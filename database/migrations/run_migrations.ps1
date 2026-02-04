# ============================================================================
# ERP System - Migration Runner Script for Dokploy (PowerShell)
# ============================================================================
# Description: Executes SQL migrations on the production database
# Usage: .\run_migrations.ps1
# ============================================================================

# Database Connection Details
$DB_SERVER = "47.254.130.238"
$DB_NAME = "DEV_ERP_ECOLED"  # Change to ERP_ECOLED for production
$DB_USER = "iZ9x6t9u0t5n8Z\Administrator"
$DB_PASSWORD = "2@24Courtry"
$DB_PORT = "1433"

# Script Configuration
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$MIGRATION_FILE = Join-Path $SCRIPT_DIR "run_migrations.sql"

Write-Host "============================================================================" -ForegroundColor Blue
Write-Host "ERP System - Migration Runner" -ForegroundColor Blue
Write-Host "============================================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "📊 Database: $DB_NAME" -ForegroundColor Green
Write-Host "🖥️  Server: ${DB_SERVER}:${DB_PORT}" -ForegroundColor Green
Write-Host "👤 User: $DB_USER" -ForegroundColor Green
Write-Host "📁 Migration File: $MIGRATION_FILE" -ForegroundColor Green
Write-Host ""

# Check if migration file exists
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ Error: Migration file not found at $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}

# Check if sqlcmd is installed
try {
    $null = Get-Command sqlcmd -ErrorAction Stop
} catch {
    Write-Host "❌ Error: sqlcmd is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install SQL Server Command Line Tools from:"
    Write-Host "https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility"
    exit 1
}

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow

$testQuery = "SELECT DB_NAME() AS CurrentDatabase"
try {
    $result = sqlcmd -S "$DB_SERVER,$DB_PORT" -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -Q $testQuery -W -h -1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
        Write-Host ""
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "❌ Failed to connect to database" -ForegroundColor Red
    Write-Host "Please check your credentials and network connectivity" -ForegroundColor Yellow
    exit 1
}

# Run migrations
Write-Host "🚀 Running migrations..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Blue

sqlcmd -S "$DB_SERVER,$DB_PORT" `
    -U $DB_USER `
    -P $DB_PASSWORD `
    -d $DB_NAME `
    -i $MIGRATION_FILE `
    -e

$EXIT_CODE = $LASTEXITCODE

Write-Host "============================================================================" -ForegroundColor Blue
Write-Host ""

# Check result
if ($EXIT_CODE -eq 0) {
    Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Verify tables in database:"
    Write-Host "     - TM_CPP_Client_Product_Price"
    Write-Host "     - TM_SPP_Supplier_Product_Price"
    Write-Host "  2. Restart your Dokploy application"
    Write-Host "  3. Check backend logs for successful startup"
    Write-Host ""
} else {
    Write-Host "❌ Migration failed with exit code $EXIT_CODE" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    exit $EXIT_CODE
}

Write-Host "============================================================================" -ForegroundColor Blue
Write-Host "Done!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Blue
