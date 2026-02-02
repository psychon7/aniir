# Quick database connection test script for Windows

Write-Host "🔍 Testing SQL Server Connection..." -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\.."

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Please edit .env with your database credentials" -ForegroundColor Yellow
    exit 1
}

# Run the test
python -m app.tests.test_db_connection

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
