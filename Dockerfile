# Monorepo Dockerfile - Frontend + Backend in single container
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Final image with Backend + Frontend static files
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for pymssql and nginx
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    freetds-dev \
    freetds-bin \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend and install dependencies
COPY backend/pyproject.toml backend/README.md* ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir pymssql && \
    pip install --no-cache-dir \
        "fastapi>=0.109.0" \
        "uvicorn[standard]>=0.27.0" \
        "sqlalchemy>=2.0.25" \
        "pydantic>=2.5.3" \
        "pydantic-settings>=2.1.0" \
        "python-jose[cryptography]>=3.3.0" \
        "passlib[bcrypt]>=1.7.4" \
        "python-multipart>=0.0.6" \
        "httpx>=0.26.0" \
        "aiofiles>=23.2.1" \
        "python-socketio>=5.11.0" \
        "redis>=5.0.1" \
        "python-dateutil>=2.8.2" \
        "structlog>=24.1.0" \
        "python-dotenv>=1.0.0" \
        "email-validator>=2.1.0"

COPY backend/app ./app

# Copy frontend build from builder stage
COPY --from=frontend-builder /app/frontend/dist /var/www/html

# Nginx configuration
RUN rm /etc/nginx/sites-enabled/default
COPY <<'NGINX' /etc/nginx/sites-enabled/default
server {
    listen 80;
    server_name _;

    # Frontend - serve static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API - proxy to uvicorn
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
NGINX

# Supervisor configuration to run both nginx and uvicorn
COPY <<'SUPERVISOR' /etc/supervisor/conf.d/app.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:uvicorn]
command=uvicorn app.main:app --host 127.0.0.1 --port 8001
directory=/app
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
SUPERVISOR

# Create log directory
RUN mkdir -p /var/log/supervisor

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/api/v1/health || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
