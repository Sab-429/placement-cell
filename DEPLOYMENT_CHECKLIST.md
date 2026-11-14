# Pre-Deployment Checklist — AWS EC2 + Kubernetes

## Project Overview
- **Backend**: Go 1.24 + Gin (API on port 8080)
- **Frontend**: React + Vite, served by Nginx (port 80)
- **Worker**: Python + WeasyPrint (background jobs via Redis queue)
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7

---

## 🔴 Critical — Must Fix Before Deployment

### 1. `worker/requirements.txt` is corrupted
The file contains null bytes (`\u0000`) between every character. `pip install -r requirements.txt` will fail.
**Fix**: Recreate as a clean UTF-8 file (see `worker/requirements.txt`).

### 2. `.env.global` uses Windows path for `STORAGE_PATH`
```
STORAGE_PATH=C:\Users\sabya\Hackathon\backend\storage
```
This will not resolve on Linux EC2/K8s containers.
**Fix**: Set to `/app/storage` (container path) and mount a shared volume (EFS) for API + Worker.

### 3. Hardcoded secrets in `.env.global`
`DB_PASSWORD`, `JWT_SECRET`, `RESEND_API_KEY` are committed in plain text.
**Fix**: Move all secrets into Kubernetes Secrets. Do NOT commit `.env.global`.

### 4. `backend/cmd/main.go` loads `../.env.global` via relative path
```go
godotenv.Load("../.env.global")
```
This file won't exist inside the container. While non-fatal (env vars are injected via K8s), it logs an error on every start.
**Fix**: Remove the `godotenv.Load()` call for production, or guard it with `APP_ENV=development`.

---

## 🟡 Medium — Should Fix Before Production

### 5. Nginx upstream name mismatch
`frontend/nginx.conf` uses `proxy_pass http://api-service:8080`, but the Docker Compose service is named `api`.
**Fix**: Name the Kubernetes Service `api-service` to match nginx.conf (or update nginx.conf to `api`).

### 6. Shared storage for file uploads
Both API (uploads) and Worker (generated PDFs) write to `STORAGE_PATH`. On K8s, they run in separate pods and need a shared filesystem.
**Fix**: Use AWS EFS (ReadWriteMany) mounted at `/app/storage` on both API and Worker pods.

### 7. Go version mismatch
`backend/go.mod` says `go 1.25.0` but Go 1.25 may not be released. Dockerfile uses `golang:1.25-alpine`.
**Fix**: Pin to `golang:1.24-alpine` and `go 1.24.0`.

### 8. No resource limits, probes, or health checks
K8s pods need liveness/readiness probes and resource requests/limits for stable operation.
**Fix**: Add to K8s Deployment manifests (see `k8s/`).

---

## 🟢 Low — Recommended

### 9. Missing `.dockerignore` files
Build contexts include `node_modules`, `dist`, `.git`, etc., bloating image sizes.
**Fix**: Add `.dockerignore` for backend, frontend, and worker.

### 10. `.env.global` is tracked by git
Listed in `.gitignore` but still present in the repo. Remove from tracking.

---

## ✅ Already Good

| Item | Status |
|------|--------|
| Multi-stage Docker builds | Present for all 3 services |
| Backend health endpoints | `/api/health`, `/api/health/ready` |
| Nginx SPA fallback | `try_files $uri $uri/ /index.html` |
| Worker Redis retry logic | `connect_redis()` with retries |
| Docker Compose for local dev | Present and functional |
| Nginx gzip + caching | Configured |
| CORS middleware | Configured with `FRONTEND_URL` |

---

## Deployment Order on Kubernetes

1. Namespace + ConfigMap + Secrets
2. PostgreSQL (StatefulSet + PVC + Service)
3. Redis (Deployment + PVC + Service)
4. API (Deployment + Service `api-service`)
5. Worker (Deployment)
6. Frontend (Deployment + Service + Ingress)
7. Verify: `kubectl get pods`, `curl <ALB-DNS>/api/health`

---

## Files Created for Deployment

```
k8s/
  namespace.yaml          # placement namespace
  configmap.yaml          # Non-secret env vars
  secrets.yaml.template   # Copy to secrets.yaml and fill in real values
  postgres.yaml           # Postgres StatefulSet + Service + PVC
  redis.yaml              # Redis Deployment + Service + PVC
  api.yaml                # Go API Deployment + Service (named api-service)
  worker.yaml             # Python Worker Deployment
  frontend.yaml           # React + Nginx Deployment + Service
  ingress.yaml            # Ingress for external HTTP access
  DEPLOY.md               # Step-by-step AWS EC2 + K3s guide
backend/Dockerfile        # Updated (Go 1.24, non-root, healthcheck)
frontend/Dockerfile       # Updated (non-root nginx)
worker/Dockerfile         # Updated (clean requirements, non-root)
worker/requirements.txt   # Recreated (clean UTF-8)
backend/.dockerignore
frontend/.dockerignore
worker/.dockerignore
DEPLOYMENT_CHECKLIST.md   # This file
```
