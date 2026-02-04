# Backend Dockerfile for ERP2025 FastAPI Application
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for pymssql (SQL Server driver via FreeTDS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    freetds-dev \
    freetds-bin \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir pymssql && \
    pip install --no-cache-dir -e .

# Copy application code
COPY app ./app

# Note: When building from project root, use:
# docker build -f backend/Dockerfile -t backend .
# Then add: COPY database/migrations ./migrations

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/api/v1/health')" || exit 1

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
