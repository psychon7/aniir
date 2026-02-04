#!/bin/bash

# ============================================================================
# ERP System - Migration Runner Script for Dokploy
# ============================================================================
# Description: Executes SQL migrations on the production database
# Usage: chmod +x run_migrations.sh && ./run_migrations.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# Database Connection Details
# ============================================================================
DB_SERVER="47.254.130.238"
DB_NAME="DEV_ERP_ECOLED"  # Change to ERP_ECOLED for production
DB_USER="iZ9x6t9u0t5n8Z\\Administrator"
DB_PASSWORD="2@24Courtry"
DB_PORT="1433"

# ============================================================================
# Script Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="${SCRIPT_DIR}/run_migrations.sql"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}ERP System - Migration Runner${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "📊 Database: ${GREEN}${DB_NAME}${NC}"
echo -e "🖥️  Server: ${GREEN}${DB_SERVER}:${DB_PORT}${NC}"
echo -e "👤 User: ${GREEN}${DB_USER}${NC}"
echo -e "📁 Migration File: ${GREEN}${MIGRATION_FILE}${NC}"
echo ""

# ============================================================================
# Check if migration file exists
# ============================================================================
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Migration file not found at ${MIGRATION_FILE}${NC}"
    exit 1
fi

# ============================================================================
# Check if sqlcmd is installed
# ============================================================================
if ! command -v sqlcmd &> /dev/null; then
    echo -e "${RED}❌ Error: sqlcmd is not installed${NC}"
    echo ""
    echo "Install sqlcmd using one of these methods:"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -"
    echo "  curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y mssql-tools unixodbc-dev"
    echo "  echo 'export PATH=\"\$PATH:/opt/mssql-tools/bin\"' >> ~/.bashrc"
    echo ""
    echo "Docker:"
    echo "  docker run -it --rm -v \$(pwd):/migrations mcr.microsoft.com/mssql-tools bash"
    echo "  cd /migrations"
    echo "  ./run_migrations.sh"
    exit 1
fi

# ============================================================================
# Test database connection
# ============================================================================
echo -e "${YELLOW}🔍 Testing database connection...${NC}"

if sqlcmd -S "${DB_SERVER},${DB_PORT}" -U "${DB_USER}" -P "${DB_PASSWORD}" -d "${DB_NAME}" -Q "SELECT DB_NAME() AS CurrentDatabase, @@VERSION AS SQLVersion" -W -s"," &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
    echo ""
else
    echo -e "${RED}❌ Failed to connect to database${NC}"
    echo -e "${YELLOW}Please check your credentials and network connectivity${NC}"
    exit 1
fi

# ============================================================================
# Run migrations
# ============================================================================
echo -e "${YELLOW}🚀 Running migrations...${NC}"
echo ""
echo -e "${BLUE}============================================================================${NC}"

sqlcmd -S "${DB_SERVER},${DB_PORT}" \
    -U "${DB_USER}" \
    -P "${DB_PASSWORD}" \
    -d "${DB_NAME}" \
    -i "${MIGRATION_FILE}" \
    -e

EXIT_CODE=$?

echo -e "${BLUE}============================================================================${NC}"
echo ""

# ============================================================================
# Check result
# ============================================================================
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}🎯 Next Steps:${NC}"
    echo -e "  1. Verify tables in database:"
    echo -e "     - TM_CPP_Client_Product_Price"
    echo -e "     - TM_SPP_Supplier_Product_Price"
    echo -e "  2. Restart your Dokploy application"
    echo -e "  3. Check backend logs for successful startup"
    echo ""
else
    echo -e "${RED}❌ Migration failed with exit code ${EXIT_CODE}${NC}"
    echo -e "${YELLOW}Please check the error messages above${NC}"
    exit $EXIT_CODE
fi

echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}Done!${NC}"
echo -e "${BLUE}============================================================================${NC}"
