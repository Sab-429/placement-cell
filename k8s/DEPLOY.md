# AWS EC2 + Kubernetes Deployment Guide (Simple EC2 + External PostgreSQL)

This guide walks you through deploying the Placement Portal on a single AWS EC2 instance
running Kubernetes (K3s), connecting to an external/local PostgreSQL database
(installed on the same EC2 or reachable at host `postgres`).

Your Docker Hub images are already built:
- zorochuro1234/placement-backend:localv2  -> API
- zorochuro1234/placement-worker:localv1   -> Worker
- zorochuro1234/placement-frontend:localv2 -> Frontend

Your domain: https://sabyasachisaha.portal.in
Your DB: host=postgres, port=5432, user=portal, password=Sabya@#429, dbname=placement

## Prerequisites

- AWS account with an EC2 instance (t3.medium or larger, 4 GB+ RAM)
- Security group allowing: SSH (22), HTTP (80), HTTPS (443)
- kubectl installed on your local machine
- PostgreSQL installed and running on your EC2 (or reachable at host postgres)

---

## Step 1: Prepare the EC2 instance

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Install PostgreSQL on EC2 (if not already installed)
sudo apt update && sudo apt install -y postgresql postgresql-contrib   # Ubuntu
# OR
sudo yum install -y postgresql postgresql-server                        # Amazon Linux

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create the database and user
sudo -u postgres psql -c "CREATE USER portal WITH PASSWORD 'Sabya@#429';"
sudo -u postgres psql -c "CREATE DATABASE placement OWNER portal;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE placement TO portal;"

# Get your EC2 private IP (needed for K8s hostAlias)
curl -s http://169.254.169.254/latest/meta-data/local-ipv4
# Example: 172.31.16.101  <- note this down

# Install K3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# Check node status
sudo kubectl get nodes

# Get kubeconfig for local access
sudo cat /etc/rancher/k3s/k3s.yaml
# Copy this to your local machine as ~/.kube/config and replace 127.0.0.1 with EC2 public IP
```

---

## Step 2: Configure Kubernetes secrets

```bash
# On your local machine (where kubectl is configured):
cp k8s/secrets.yaml.template k8s/secrets.yaml

# Edit k8s/secrets.yaml and confirm:
#   DB_PASSWORD: "Sabya@#429"
#   JWT_SECRET: <generate with: openssl rand -base64 32>
#   RESEND_API_KEY: your Resend API key

kubectl apply -f k8s/secrets.yaml
```

---

## Step 3: Configure the API hostAlias (important!)

Edit k8s/api.yaml and replace <EC2_PRIVATE_IP> with your EC2's private IP
(from Step 1, e.g. 172.31.16.101):

```yaml
hostAliases:
  - ip: "172.31.16.101"
    hostnames:
      - "postgres"
```

This lets the API pod resolve postgres to your EC2 where PostgreSQL is running.

---

## Step 4: Apply Kubernetes manifests

```bash
# Create namespace and config
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Deploy Redis (used for background job queue)
kubectl apply -f k8s/redis.yaml

# DO NOT apply k8s/postgres.yaml — you are using external PostgreSQL

# Deploy applications (uses your Docker Hub images)
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/frontend.yaml

# Deploy ingress (ALB for external access)
kubectl apply -f k8s/ingress.yaml

# Verify all pods are running
kubectl get pods -n placement
kubectl get services -n placement
```

---

## Step 5: Access the application

Get the ALB DNS name:

```bash
kubectl get ingress -n placement
```

Wait a few minutes for the ALB to be provisioned, then:

1. Create a DNS record for sabyasachisaha.portal.in pointing to the ALB DNS name
2. Visit: https://sabyasachisaha.portal.in/
3. API health: https://sabyasachisaha.portal.in/api/health

---

## Step 6: HTTPS / SSL certificate

For HTTPS to work, request a free certificate in AWS Certificate Manager (ACM)
for sabyasachisaha.portal.in in the same region as your EC2, then update
k8s/ingress.yaml:

```yaml
annotations:
  alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:REGION:ACCOUNT_ID:certificate/CERTIFICATE_ID
```

---

## Summary of what to apply (and what NOT to apply)

| File | Apply? | Purpose |
|------|--------|---------|
| k8s/namespace.yaml | Yes | Creates placement namespace |
| k8s/configmap.yaml | Yes | Non-secret env vars (DB host=postgres, etc.) |
| k8s/secrets.yaml | Yes | DB password, JWT secret, Resend key |
| k8s/redis.yaml | Yes | Redis for background job queue |
| k8s/postgres.yaml | NO | You use external PostgreSQL — skip this |
| k8s/api.yaml | Yes | Go API (your Docker Hub image) |
| k8s/worker.yaml | Yes | Python worker (your Docker Hub image) |
| k8s/frontend.yaml | Yes | React + Nginx (your Docker Hub image) |
| k8s/ingress.yaml | Yes | ALB ingress for sabyasachisaha.portal.in |

---

## Troubleshooting

```bash
# Check pod logs
kubectl logs -f deployment/api -n placement
kubectl logs -f deployment/worker -n placement

# Check events
kubectl get events -n placement --sort-by='.lastTimestamp'

# Test API directly (port-forward)
kubectl port-forward service/api-service 8080:8080 -n placement
curl http://localhost:8080/api/health

# Verify DB_HOST resolves from inside the API pod
kubectl exec -it deployment/api -n placement -- ping -c 3 postgres
```

---

## Files at a glance

```
/mnt/c/Users/sabya/Hackathon/k8s/
  namespace.yaml          # K8s namespace
  configmap.yaml          # DB_HOST=postgres, DB_USER=portal, DB_NAME=placement, etc.
  secrets.yaml.template   # Copy to secrets.yaml with DB_PASSWORD=Sabya@#429
  postgres.yaml           # DO NOT APPLY — external PostgreSQL only
  redis.yaml              # Redis for job queue
  api.yaml                # Backend API (zorochuro1234/placement-backend:localv2)
  worker.yaml             # Worker (zorochuro1234/placement-worker:localv1)
  frontend.yaml           # Frontend (zorochuro1234/placement-frontend:localv2)
  ingress.yaml            # ALB ingress for sabyasachisaha.portal.in
  DEPLOY.md               # This guide
```
