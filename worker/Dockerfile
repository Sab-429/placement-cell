# ── Worker: Python background job processor ─────────────────────────────
FROM python:3.12-slim

# System dependencies for WeasyPrint (PDF generation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user
RUN useradd -m -s /bin/bash worker && \
    chown -R worker:worker /app
USER worker

EXPOSE 8000

# Healthcheck — worker doesn't serve HTTP, so we check Redis connectivity
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import redis,os; redis.from_url(os.getenv('REDIS_URL','redis://redis:6379/0')).ping(); print('OK')" || exit 1

CMD ["python", "main.py"]
