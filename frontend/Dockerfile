# ========================================
# Stage 1: Build Stage
# ========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules (if any)
RUN apk add --no-cache libc6-compat

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies
# Using npm ci for faster, reliable, reproducible builds
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build-time environment variables (can be overridden during build)
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_SOCKET_URL=
ARG VITE_APP_NAME="ERP System"
ARG VITE_APP_VERSION=1.0.0

# Set environment variables for the build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION

# Build the application
RUN npm run build

# ========================================
# Stage 2: Production Stage with nginx
# ========================================
FROM nginx:alpine AS production

# Install envsubst for runtime environment variable substitution
RUN apk add --no-cache gettext

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create a template for runtime environment variable injection
# This allows changing API URL at container runtime
RUN cat > /docker-entrypoint.d/40-inject-env.sh << 'EOF'
#!/bin/sh
set -e

# Create runtime environment config
cat > /usr/share/nginx/html/env-config.js << ENVEOF
window._env_ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-/api/v1}",
  VITE_SOCKET_URL: "${VITE_SOCKET_URL:-}",
  VITE_APP_NAME: "${VITE_APP_NAME:-ERP System}",
  VITE_APP_VERSION: "${VITE_APP_VERSION:-1.0.0}"
};
ENVEOF

# Update index.html to include env-config.js if not already present
if ! grep -q 'env-config.js' /usr/share/nginx/html/index.html; then
  sed -i 's|</head>|<script src="/env-config.js"></script></head>|' /usr/share/nginx/html/index.html
fi

echo "Environment configuration injected successfully"
EOF

RUN chmod +x /docker-entrypoint.d/40-inject-env.sh

# Create health check script
RUN cat > /usr/share/nginx/html/health << 'EOF'
OK
EOF

# Set proper permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Expose port 80
EXPOSE 80

# Health check - verify nginx is serving the app
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Labels for container metadata
LABEL maintainer="ERP Team" \
      version="1.0.0" \
      description="ERP Frontend Application" \
      org.opencontainers.image.source="https://github.com/axtech/erp2025"

# Run as non-root user (commented out as nginx needs root for port 80)
# For production, consider using port 8080 and enabling this
# USER appuser

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
