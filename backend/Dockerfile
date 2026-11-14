# ── Backend API: Go (Gin) ──────────────────────────────────────────────
# Stage 1: Build the Go binary
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Cache Go module downloads
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/main.go

# ── Stage 2: Minimal runtime image ─────────────────────────────────────
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata && \
    adduser -D -s /bin/sh appuser

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .

# Create storage directories (shared volume will be mounted at /app/storage)
RUN mkdir -p /app/storage/pfps /app/storage/resumes /app/storage/logos && \
    chown -R appuser:appuser /app/storage

USER appuser

EXPOSE 8080

# Healthcheck for Kubernetes liveness/readiness probes
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["./server"]
