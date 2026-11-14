# AWS EC2 + Kind + kubectl Deployment Guide

This guide walks you through deploying the Placement Portal on **AWS EC2 Ubuntu**
using **Kind** (Kubernetes IN Docker) and **kubectl**, connecting to an
**external PostgreSQL** installed on the same EC2.

Your Docker Hub images:
- zorochuro1234/placement-backend:localv2  → API
- zorochuro1234/placement-worker:localv1   → Worker
- zorochuro1234/placement-frontend:localv2 → Frontend

Your domain: **https://sabyasachisaha.portal.in**
Your DB: host=postgres-service (K8s), port=5432, user=portal, password=Sabya@#429, dbname=placement

---

## Prerequisites on EC2

- AWS EC2 Ubuntu instance (t3.medium or larger, 4 GB+ RAM)
- Security group allowing: SSH (22), HTTP (80), HTTPS (443)
- PostgreSQL installed on EC2 (or reachable externally)

---

## Step 1: Install Docker, Kind, kubectl on EC2

SSH into your EC2 and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Kind
curl -Lo ./kind https://kind.sigs.k8s.io/releases/v0.23.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Verify
kubectl version --client
kind version
```

---

## Step 2: Install PostgreSQL on EC2 (External DB)

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER portal WITH PASSWORD 'Sabya@#429';"
sudo -u postgres psql -c "CREATE DATABASE placement OWNER portal;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE placement TO portal;"

# Allow PostgreSQL to accept connections from Kind containers
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host    all             all             0.0.0.0/0            md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql

# Get EC2 private IP (needed for Kind external-postgres Endpoints)
EC2_PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
echo "EC2 Private IP: $EC2_PRIVATE_IP"
# ^^^ SAVE THIS IP - you'll need it in Step 4

# Create shared storage directory for hostPath volumes
sudo mkdir -p /var/lib/placement/storage/pfps /var/lib/placement/storage/resumes /var/lib/placement/storage/logos
sudo chmod -R 777 /var/lib/placement/storage
```

---

## Step 3: Create Kind Cluster

On your EC2:

```bash
# Create Kind cluster with port mappings for ingress (80/443)
# and extra mounts for shared storage
kind create cluster --config k8s/kind-config.yaml --name placement

# Verify cluster
kubectl cluster-info --context kind-placement
kubectl get nodes
```

---

## Step 4: Install NGINX Ingress Controller on Kind

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Verify
kubectl get pods -n ingress-nginx
kubectl get services -n ingress-nginx
```

---

## Step 5: Configure Kubernetes Secrets (on your LOCAL machine)

From your local machine (where you have the project code and kubectl configured):

```bash
# Copy secrets template
cp k8s/secrets.yaml.template k8s/secrets.yaml

# Edit with real values
nano k8s/secrets.yaml
```

Fill in:
```yaml
stringData:
  DB_PASSWORD: "Sabya@#429"
  JWT_SECRET: "<generate with: openssl rand -base64 32>"
  RESEND_API_KEY: "re_<your-actual-resend-key>"
```

Then apply:
```bash
kubectl apply -f k8s/secrets.yaml
```

---

## Step 6: Configure External PostgreSQL for Kind

Edit `k8s/kind-external-postgres.yaml` and replace `<EC2_PRIVATE_IP>` with your EC2's private IP from Step 2:

```yaml
subsets:
  - addresses:
      - ip: "172.31.16.101"   # <-- YOUR EC2 PRIVATE IP HERE
    ports:
      - port: 5432
```

Then apply:
```bash
kubectl apply -f k8s/kind-external-postgres.yaml
```

---

## Step 7: Apply All Kubernetes Manifests

```bash
# Namespace and ConfigMap
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml

# Secrets
kubectl apply -f k8s/secrets.yaml

# External PostgreSQL (EC2-hosted)
kubectl apply -f k8s/kind-external-postgres.yaml

# Redis (for background job queue)
kubectl apply -f k8s/redis.yaml

# Applications (uses your Docker Hub images)
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/frontend.yaml

# Ingress (NGINX for Kind)
kubectl apply -f k8s/ingress.yaml

# Verify all pods
kubectl get pods -n placement
kubectl get services -n placement
kubectl get ingress -n placement
```

---

## Step 8: Access the Application

### Option A: Via Domain (requires DNS)
1. Create a DNS record: `sabyasachisaha.portal.in` → your EC2 **public IP**
2. Visit: **https://sabyasachisaha.portal.in/**
3. API health: **https://sabyasachisaha.portal.in/api/health**

### Option B: Direct via EC2 IP (no DNS needed)
```bash
# Get EC2 public IP
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Frontend: http://$EC2_PUBLIC_IP/"
echo "API: http://$EC2_PUBLIC_IP/api/health"
```

---

## Step 9: HTTPS / SSL Certificate

For HTTPS on `sabyasachisaha.portal.in`:

1. Request a free certificate in AWS Certificate Manager (ACM)
2. Or use Let's Encrypt with cert-manager on Kind
3. Update `k8s/ingress.yaml` to add TLS configuration

For now, ingress is configured with `ssl-redirect: "false"` so HTTP works immediately.

---

## Troubleshooting

```bash
# Check all pods
kubectl get pods -n placement

# Check pod logs
kubectl logs -f deployment/api -n placement
kubectl logs -f deployment/worker -n placement
kubectl logs -f deployment/frontend -n placement

# Check events
kubectl get events -n placement --sort-by='.lastTimestamp'

# Test API directly (port-forward)
kubectl port-forward service/api-service 8080:8080 -n placement
curl http://localhost:8080/api/health

# Verify PostgreSQL connectivity from API pod
kubectl exec -it deployment/api -n placement -- ping -c 3 postgres-service

# Check ingress status
kubectl get ingress -n placement
kubectl describe ingress placement-ingress -n placement

# Restart Kind cluster if needed
kind delete cluster --name placement
kind create cluster --config k8s/kind-config.yaml --name placement
```

---

## Summary: Files to Apply (and NOT to apply)

| File | Apply? | Purpose |
|------|--------|---------|
| `k8s/kind-config.yaml` | Used with `kind create cluster` | Kind cluster config with port mappings |
| `k8s/namespace.yaml` | ✅ Yes | Creates `placement` namespace |
| `k8s/configmap.yaml` | ✅ Yes | DB_HOST=postgres-service, domain, etc. |
| `k8s/secrets.yaml` | ✅ Yes | DB_PASSWORD, JWT_SECRET, RESEND_API_KEY |
| `k8s/kind-external-postgres.yaml` | ✅ Yes | Service + Endpoints for EC2 PostgreSQL |
| `k8s/postgres.yaml` | ❌ NO | External PostgreSQL — skip this |
| `k8s/redis.yaml` | ✅ Yes | Redis for job queue |
| `k8s/api.yaml` | ✅ Yes | Backend API (Docker Hub image) |
| `k8s/worker.yaml` | ✅ Yes | Worker (Docker Hub image) |
| `k8s/frontend.yaml` | ✅ Yes | Frontend (Docker Hub image) |
| `k8s/ingress.yaml` | ✅ Yes | NGINX ingress for your domain |

---

## Kind Cluster Management

```bash
# Delete cluster
kind delete cluster --name placement

# Recreate cluster
kind create cluster --config k8s/kind-config.yaml --name placement

# Check cluster info
kubectl cluster-info --context kind-placement

# Switch context
kubectl config use-context kind-placement
```

