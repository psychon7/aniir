# Dokploy Deployment Configuration for SQL Server

## Overview

This document provides comprehensive Dokploy deployment instructions for the **ERP2025 ECOLED EUROPE** system with SQL Server as the primary database.

**Tech Stack:**
- **Backend**: ASP.NET 4.8 WebForms + Web API 2 (or FastAPI for new services)
- **Database**: **SQL Server** (Azure SQL, Azure SQL Edge, or on-premise)
- **Frontend**: React 18 (Vite + TypeScript)
- **Cache**: Redis
- **Storage**: MinIO (dev) / AWS S3 (prod)

---

## Architecture Diagram

```
+---------------------------------------------------------------------+
|                           Dokploy Platform                          |
+---------------------------------------------------------------------+
|                                                                     |
|  +---------------+  +---------------+  +------------------+        |
|  |    Nginx      |  |   Frontend    |  |     Backend      |        |
|  |   (Reverse    |->|   (React)     |->|   (ASP.NET or    |        |
|  |    Proxy)     |  |   Port 3000   |  |    FastAPI)      |        |
|  +---------------+  +---------------+  |   Port 8000      |        |
|                                        +------------------+        |
|                                               |                     |
|  +---------------+  +---------------+  +------v-----------+        |
|  |    Redis      |  |    MinIO      |  |   SQL Server     |        |
|  |  Port 6379    |  |  Port 9000    |  |   (EXTERNAL)     |        |
|  +---------------+  +---------------+  |   Port 1433      |        |
|                                        +------------------+        |
|  +---------------+  +---------------+                              |
|  | Celery Worker |  |  Celery Beat  |                              |
|  | (Background)  |  |  (Scheduler)  |                              |
|  +---------------+  +---------------+                              |
|                                                                     |
+---------------------------------------------------------------------+
                               |
           +-------------------v-------------------+
           |     SQL Server Database              |
           |     Server: sql.yourcompany.com:1433 |
           |     Database: ERP_ECOLED             |
           |     (67+ tables with production data)|
           +---------------------------------------+
```

---

## SQL Server Connection Options

### Option 1: External SQL Server (Recommended for Production)

Connect to an existing Azure SQL or on-premise SQL Server instance:

```bash
# Connection details
MSSQL_SERVER=sql.yourcompany.com
MSSQL_PORT=1433
MSSQL_DATABASE=ERP_ECOLED
MSSQL_USER=erp_app_user
MSSQL_PASSWORD=<your_secure_password>
```

### Option 2: Containerized SQL Server (Development/Testing)

For development environments, use Azure SQL Edge (supports ARM64/Apple Silicon):

```yaml
# docker-compose.yml
services:
  sqlserver:
    image: mcr.microsoft.com/azure-sql-edge:latest
    container_name: erp-sqlserver
    hostname: sqlserver
    user: root
    cap_add:
      - SYS_PTRACE
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=${MSSQL_SA_PASSWORD:-YourStrong@Passw0rd}
    ports:
      - "${MSSQL_PORT:-1433}:1433"
    volumes:
      - sqlserver-data:/var/opt/mssql
    networks:
      - erp-network
    deploy:
      resources:
        limits:
          memory: 2G
    restart: unless-stopped
```

### Option 3: Full SQL Server (x86/amd64 only)

For x86/amd64 machines, use the official SQL Server image:

```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: erp-sqlserver
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=${MSSQL_SA_PASSWORD}
      - MSSQL_PID=Developer  # or Express, Standard, Enterprise
    ports:
      - "1433:1433"
    volumes:
      - sqlserver-data:/var/opt/mssql
    healthcheck:
      test: /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$${MSSQL_SA_PASSWORD}" -Q "SELECT 1" -C || exit 1
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped
```

---

## Production Docker Compose Configuration

```yaml
version: '3.8'

services:
  # ============================================================================
  # Redis - Cache & Celery Broker
  # ============================================================================
  redis:
    image: redis:7-alpine
    container_name: erp-redis
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - erp-network

  # ============================================================================
  # MinIO - S3-compatible storage (optional - use AWS S3 in prod)
  # ============================================================================
  minio:
    image: minio/minio:latest
    container_name: erp-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 20s
      retries: 3
    restart: unless-stopped
    networks:
      - erp-network

  # ============================================================================
  # FastAPI Backend (Python)
  # ============================================================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: erp-backend
    environment:
      # SQL Server connection (EXTERNAL database)
      - MSSQL_SERVER=${MSSQL_SERVER}
      - MSSQL_PORT=${MSSQL_PORT:-1433}
      - MSSQL_DATABASE=${MSSQL_DATABASE}
      - MSSQL_USER=${MSSQL_USER}
      - MSSQL_PASSWORD=${MSSQL_PASSWORD}
      - DATABASE_URL=mssql+pyodbc://${MSSQL_USER}:${MSSQL_PASSWORD}@${MSSQL_SERVER}:${MSSQL_PORT}/${MSSQL_DATABASE}?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
      # Redis
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - CELERY_BROKER_URL=redis://:${REDIS_PASSWORD}@redis:6379/1
      - CELERY_RESULT_BACKEND=redis://:${REDIS_PASSWORD}@redis:6379/2
      # Storage
      - S3_ENDPOINT=${S3_ENDPOINT:-http://minio:9000}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - S3_BUCKET=${S3_BUCKET:-erp-documents}
      # Auth
      - JWT_SECRET=${JWT_SECRET}
      - JWT_ALGORITHM=HS256
      - JWT_ACCESS_EXPIRE_MINUTES=15
      - JWT_REFRESH_EXPIRE_DAYS=7
      # Environment
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
    depends_on:
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - erp-network

  # ============================================================================
  # Celery Worker (background tasks)
  # ============================================================================
  celery-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: erp-celery-worker
    environment:
      - MSSQL_SERVER=${MSSQL_SERVER}
      - MSSQL_PORT=${MSSQL_PORT:-1433}
      - MSSQL_DATABASE=${MSSQL_DATABASE}
      - MSSQL_USER=${MSSQL_USER}
      - MSSQL_PASSWORD=${MSSQL_PASSWORD}
      - DATABASE_URL=mssql+pyodbc://${MSSQL_USER}:${MSSQL_PASSWORD}@${MSSQL_SERVER}:${MSSQL_PORT}/${MSSQL_DATABASE}?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - CELERY_BROKER_URL=redis://:${REDIS_PASSWORD}@redis:6379/1
      - CELERY_RESULT_BACKEND=redis://:${REDIS_PASSWORD}@redis:6379/2
    depends_on:
      - redis
      - backend
    command: celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4
    restart: unless-stopped
    networks:
      - erp-network

  # ============================================================================
  # Celery Beat (scheduler)
  # ============================================================================
  celery-beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: erp-celery-beat
    environment:
      - MSSQL_SERVER=${MSSQL_SERVER}
      - MSSQL_DATABASE=${MSSQL_DATABASE}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - CELERY_BROKER_URL=redis://:${REDIS_PASSWORD}@redis:6379/1
    depends_on:
      - redis
      - backend
    command: celery -A app.tasks.celery_app beat --loglevel=info
    restart: unless-stopped
    networks:
      - erp-network

  # ============================================================================
  # React Frontend
  # ============================================================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=${VITE_API_URL}
    container_name: erp-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - erp-network

  # ============================================================================
  # Nginx Reverse Proxy
  # ============================================================================
  nginx:
    image: nginx:alpine
    container_name: erp-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - erp-network

volumes:
  redis_data:
  minio_data:

networks:
  erp-network:
    driver: bridge
```

---

## Backend Dockerfile (FastAPI with SQL Server ODBC)

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies and SQL Server ODBC driver
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    unixodbc-dev \
    gcc \
    g++ \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 mssql-tools18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Add ODBC tools to PATH
ENV PATH="$PATH:/opt/mssql-tools18/bin"

# Install Python dependencies
COPY pyproject.toml poetry.lock* ./
RUN pip install --no-cache-dir poetry \
    && poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Copy application
COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Environment Variables

### Production .env Configuration

```bash
# =============================================================================
# SQL Server Database (EXTERNAL - your existing database)
# =============================================================================
MSSQL_SERVER=sql.yourcompany.com
MSSQL_PORT=1433
MSSQL_DATABASE=ERP_ECOLED
MSSQL_USER=erp_app_user
MSSQL_PASSWORD=<your_secure_sql_password>

# Full connection string (alternative)
DATABASE_URL=mssql+pyodbc://erp_app_user:<password>@sql.yourcompany.com:1433/ERP_ECOLED?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes

# =============================================================================
# Redis (containerized)
# =============================================================================
REDIS_PASSWORD=<strong_redis_password>

# =============================================================================
# Storage - MinIO (dev) / AWS S3 (prod)
# =============================================================================
# For MinIO (development):
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=<strong_minio_password>
S3_BUCKET=erp-documents
MINIO_USER=minioadmin
MINIO_PASSWORD=<strong_minio_password>

# For AWS S3 (production):
# S3_ENDPOINT=https://s3.eu-west-1.amazonaws.com
# S3_ACCESS_KEY=<your_aws_access_key>
# S3_SECRET_KEY=<your_aws_secret_key>
# S3_BUCKET=your-erp-bucket

# =============================================================================
# JWT Authentication
# =============================================================================
# Generate with: openssl rand -hex 32
JWT_SECRET=<your_generated_jwt_secret>
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=7

# =============================================================================
# Frontend Configuration
# =============================================================================
VITE_API_URL=https://api.yourdomain.com

# =============================================================================
# Environment
# =============================================================================
ENVIRONMENT=production
LOG_LEVEL=INFO
DEBUG=false
```

---

## SQL Server Specific Configuration

### Database Connection String Formats

**SQLAlchemy (pyodbc):**
```python
# Connection string format for pyodbc
DATABASE_URL = (
    f"mssql+pyodbc://{MSSQL_USER}:{MSSQL_PASSWORD}"
    f"@{MSSQL_SERVER}:{MSSQL_PORT}/{MSSQL_DATABASE}"
    f"?driver=ODBC+Driver+18+for+SQL+Server"
    f"&TrustServerCertificate=yes"
)
```

**pymssql (alternative):**
```python
# Alternative using pymssql (no ODBC required)
DATABASE_URL = f"mssql+pymssql://{MSSQL_USER}:{MSSQL_PASSWORD}@{MSSQL_SERVER}:{MSSQL_PORT}/{MSSQL_DATABASE}"
```

### Firewall Rules for Azure SQL

If using Azure SQL, ensure the following firewall rules:

```bash
# Allow Azure services
az sql server firewall-rule create \
  --resource-group <resource-group> \
  --server <server-name> \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow specific IP range (Dokploy server)
az sql server firewall-rule create \
  --resource-group <resource-group> \
  --server <server-name> \
  --name DokployServer \
  --start-ip-address <dokploy-server-ip> \
  --end-ip-address <dokploy-server-ip>
```

---

## Nginx Configuration

### nginx/nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=webhook_limit:10m rate=100r/s;

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com api.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Frontend (React SPA)
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts for long-running operations
            proxy_connect_timeout 60s;
            proxy_send_timeout 120s;
            proxy_read_timeout 120s;
        }

        # Webhooks (higher rate limit)
        location /webhooks/ {
            limit_req zone=webhook_limit burst=200 nodelay;

            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }
    }
}
```

---

## Deployment Steps

### 1. Initial Setup

```bash
# Clone repository
git clone <your-repo-url>
cd ERP2025

# Create environment file
cp .env.example .env
# Edit .env with production values
nano .env

# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Verify SQL Server Connection

```bash
# Test SQL Server connectivity from backend container
docker-compose exec backend \
  /opt/mssql-tools18/bin/sqlcmd \
  -S ${MSSQL_SERVER},${MSSQL_PORT} \
  -U ${MSSQL_USER} \
  -P ${MSSQL_PASSWORD} \
  -d ${MSSQL_DATABASE} \
  -Q "SELECT @@VERSION" \
  -C

# Alternative: Test from Python
docker-compose exec backend python -c "
from sqlalchemy import create_engine, text
import os
engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    result = conn.execute(text('SELECT @@VERSION'))
    print(result.fetchone()[0])
"
```

### 3. Database Migration

```bash
# Run Alembic migrations
docker-compose exec backend alembic upgrade head

# Check current migration version
docker-compose exec backend alembic current

# Generate new migration (development)
docker-compose exec backend alembic revision --autogenerate -m "description"
```

### 4. SSL Certificate Setup (Let's Encrypt)

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Using Certbot standalone mode
docker run -it --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  -d yourdomain.com \
  -d api.yourdomain.com

# Copy certificates
cp nginx/ssl/live/yourdomain.com/fullchain.pem nginx/ssl/
cp nginx/ssl/live/yourdomain.com/privkey.pem nginx/ssl/

# Restart nginx
docker-compose restart nginx
```

---

## SQL Server Backup & Restore

### Backup Methods

**Option 1: Using sqlcmd from container**
```bash
# Full database backup
docker-compose exec backend \
  /opt/mssql-tools18/bin/sqlcmd \
  -S ${MSSQL_SERVER},${MSSQL_PORT} \
  -U ${MSSQL_USER} \
  -P ${MSSQL_PASSWORD} \
  -Q "BACKUP DATABASE [${MSSQL_DATABASE}] TO DISK = N'/var/backups/erp_$(date +%Y%m%d_%H%M%S).bak' WITH COMPRESSION, INIT" \
  -C
```

**Option 2: Azure SQL Automated Backup**
```bash
# Azure SQL has automated backups - configure retention
az sql db ltr-policy set \
  --resource-group <resource-group> \
  --server <server-name> \
  --database ${MSSQL_DATABASE} \
  --weekly-retention "P4W" \
  --monthly-retention "P12M" \
  --yearly-retention "P5Y" \
  --week-of-year 1
```

**Option 3: Export to BACPAC (portable format)**
```bash
# Using SqlPackage
SqlPackage.exe /Action:Export \
  /SourceServerName:${MSSQL_SERVER} \
  /SourceDatabaseName:${MSSQL_DATABASE} \
  /SourceUser:${MSSQL_USER} \
  /SourcePassword:${MSSQL_PASSWORD} \
  /TargetFile:backup_$(date +%Y%m%d).bacpac
```

### Restore Methods

**From .bak file:**
```sql
RESTORE DATABASE [ERP_ECOLED]
FROM DISK = N'/var/backups/erp_backup.bak'
WITH REPLACE,
MOVE 'ERP_ECOLED' TO '/var/opt/mssql/data/ERP_ECOLED.mdf',
MOVE 'ERP_ECOLED_log' TO '/var/opt/mssql/data/ERP_ECOLED_log.ldf';
```

**From BACPAC:**
```bash
SqlPackage.exe /Action:Import \
  /TargetServerName:${MSSQL_SERVER} \
  /TargetDatabaseName:${MSSQL_DATABASE}_restored \
  /TargetUser:${MSSQL_USER} \
  /TargetPassword:${MSSQL_PASSWORD} \
  /SourceFile:backup_20260131.bacpac
```

---

## Monitoring & Health Checks

### Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| Backend API | `https://yourdomain.com/api/health` | `{"status": "healthy"}` |
| Frontend | `https://yourdomain.com` | HTTP 200 |
| Redis | `docker-compose exec redis redis-cli -a $REDIS_PASSWORD ping` | `PONG` |
| SQL Server | See verification commands above | Version info |

### Application Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery-worker

# Filter by time
docker-compose logs --since 1h backend

# Nginx access/error logs
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log
```

### SQL Server Query Performance

```sql
-- Check slow queries
SELECT TOP 10
    qs.total_elapsed_time / qs.execution_count AS avg_elapsed_time,
    qs.execution_count,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY avg_elapsed_time DESC;

-- Check connection count
SELECT COUNT(*) as connection_count
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID('ERP_ECOLED');

-- Check database size
EXEC sp_spaceused;
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale Celery workers
docker-compose up -d --scale celery-worker=4

# Scale backend (requires load balancer configuration)
docker-compose up -d --scale backend=3
```

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  celery-worker:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

---

## Troubleshooting

### Common Issues

#### 1. SQL Server Connection Failed

```bash
# Check if SQL Server is reachable
docker-compose exec backend nc -zv ${MSSQL_SERVER} ${MSSQL_PORT}

# Test ODBC driver
docker-compose exec backend odbcinst -j

# Verify connection string format
docker-compose exec backend python -c "
import pyodbc
print([x for x in pyodbc.drivers()])
"
```

**Solutions:**
- Verify firewall rules allow connection from Dokploy server IP
- Check SQL Server is listening on the correct port
- Ensure ODBC Driver 18 is installed in container
- For Azure SQL, enable "Allow Azure services" in firewall

#### 2. ODBC Driver Not Found

```bash
# Verify driver installation
docker-compose exec backend cat /etc/odbcinst.ini

# Expected output should include:
# [ODBC Driver 18 for SQL Server]
# Description=Microsoft ODBC Driver 18 for SQL Server
# Driver=/opt/microsoft/msodbcsql18/lib64/libmsodbcsql-18.*.so.1.*
```

#### 3. Celery Tasks Not Running

```bash
# Check Redis connectivity
docker-compose exec celery-worker redis-cli -h redis -a $REDIS_PASSWORD ping

# Check Celery worker status
docker-compose exec celery-worker celery -A app.tasks.celery_app status

# View task queue
docker-compose exec celery-worker celery -A app.tasks.celery_app inspect active
```

#### 4. Frontend Cannot Reach API

```bash
# Verify CORS settings
curl -I -X OPTIONS https://yourdomain.com/api/health \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: GET"

# Check nginx proxy configuration
docker-compose exec nginx nginx -t
```

---

## Security Checklist

- [ ] SQL Server uses strong, unique password
- [ ] Redis requires authentication
- [ ] JWT secret is randomly generated (32+ chars)
- [ ] SSL/TLS enabled for all external connections
- [ ] SQL Server firewall restricts access to known IPs
- [ ] Environment variables not committed to repository
- [ ] Database user has minimal required permissions
- [ ] Regular automated backups configured
- [ ] Security headers enabled in Nginx
- [ ] Rate limiting configured for API endpoints

---

## Related Documentation

- [SQL Server Docker Documentation](https://learn.microsoft.com/en-us/sql/linux/sql-server-linux-docker-container-deployment)
- [Azure SQL Edge](https://learn.microsoft.com/en-us/azure/azure-sql-edge/)
- [Dokploy Documentation](https://dokploy.com/docs)
- [FastAPI SQL Server Guide](https://fastapi.tiangolo.com/tutorial/sql-databases/)
