# ERP2025 VM Setup Script
# Run this in PowerShell as Administrator on the Azure VM

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ERP2025 Development Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Install SQL Server Express
Write-Host "`n[1/4] Installing SQL Server 2022 Express..." -ForegroundColor Yellow
winget install Microsoft.SQLServer.2022.Express --accept-package-agreements --accept-source-agreements

# 2. Install SQL Server Management Studio
Write-Host "`n[2/4] Installing SQL Server Management Studio..." -ForegroundColor Yellow
winget install Microsoft.SQLServerManagementStudio --accept-package-agreements --accept-source-agreements

# 3. Install Git
Write-Host "`n[3/4] Installing Git..." -ForegroundColor Yellow
winget install Git.Git --accept-package-agreements --accept-source-agreements

# 4. Create project directory
Write-Host "`n[4/4] Creating project directory..." -ForegroundColor Yellow
$projectPath = "C:\Projects\ERP2025"
if (-not (Test-Path $projectPath)) {
    New-Item -ItemType Directory -Path $projectPath -Force
}

# 5. Create required folders for file storage
Write-Host "`nCreating file storage directories..." -ForegroundColor Yellow
$folders = @(
    "D:\AppLog\ERPs\ERP_INM",
    "D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles\Product\Photo",
    "D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles\Product\File",
    "D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles\Album",
    "D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles\TempFile",
    "D:\SiteFilesFolder\ERPs\ERP_INM\Files\EmailAttchmt",
    "D:\SiteFilesFolder\ERPs\ERP_INM\Files\EmailSender"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  Created: $folder" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Restart the VM to complete SQL Server installation"
Write-Host "2. Copy ERP2025 project files to C:\Projects\ERP2025"
Write-Host "3. Open ERP\ERP.sln in Visual Studio"
Write-Host "4. Create database 'ERP_MORODA' in SQL Server"
Write-Host "5. Run SQL scripts from SQL\ folder"
Write-Host "6. Press F5 to run the application"

Write-Host "`nConnection String (update in Web.config if needed):" -ForegroundColor Yellow
Write-Host 'data source=.\SQLEXPRESS;initial catalog=ERP_MORODA;integrated security=True'
