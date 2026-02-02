# ERP2025 UI Setup & Run Guide

## Overview

The ERP2025 system consists of multiple ASP.NET WebForms applications:

| Project | Description | Purpose |
|---------|-------------|---------|
| **ERP.Web** | Admin Portal | Main ERP administration interface |
| **ERP.SiteNC202310** | Public Website | Customer-facing website |
| **ERP.RefSite** | Reference Site | Technical sheets and reference data |

---

## Prerequisites

### Required Software

1. **Visual Studio 2022** (or later)
   - Workload: ASP.NET and web development
   - Individual component: .NET Framework 4.8 SDK and targeting pack

2. **SQL Server** (2019 or later recommended)
   - SQL Server Express is sufficient for development
   - SQL Server Management Studio (SSMS) for database management

3. **IIS Express** (included with Visual Studio)

4. **.NET Framework 4.8**
   - Download: https://dotnet.microsoft.com/download/dotnet-framework/net48

---

## Quick Start

### Step 1: Clone/Open the Solution

```bash
# Navigate to the project directory
cd /Users/mohankumarv/Desktop/Projects/Clients/AXTECH/ERP2025/ERP

# Open the solution in Visual Studio
open ERP.sln
```

Or open Visual Studio and select:
- **File** → **Open** → **Project/Solution** → Navigate to `ERP/ERP.sln`

### Step 2: Database Setup

1. **Create the database** in SQL Server:
   ```sql
   CREATE DATABASE ERP_MORODA;
   ```

2. **Run migration scripts** from `SQL/` folder in order:
   - Execute scripts in version folders (e.g., `V1.1.1.0/V1.1.1.0.sql`)

3. **Verify connection string** in `ERP.Web/Web.config`:
   ```xml
   <add name="ERP_DBEntities" 
        connectionString="metadata=res://*/DataBase.ERP_DB.csdl|res://*/DataBase.ERP_DB.ssdl|res://*/DataBase.ERP_DB.msl;
        provider=System.Data.SqlClient;
        provider connection string=&quot;data source=(local);initial catalog=ERP_MORODA;integrated security=True;multipleactiveresultsets=True;App=EntityFramework&quot;" 
        providerName="System.Data.EntityClient"/>
   ```

   **Adjust `data source`** based on your SQL Server instance:
   - Local default: `(local)` or `.`
   - Named instance: `.\SQLEXPRESS`
   - Remote: `server-name\instance`

### Step 3: Restore NuGet Packages

In Visual Studio:
- **Right-click** on the solution → **Restore NuGet Packages**

Or via command line:
```bash
nuget restore ERP.sln
```

### Step 4: Build the Solution

1. **Set build configuration**: `Debug` or `Release`
2. **Build**: Press `Ctrl+Shift+B` or **Build** → **Build Solution**
3. Verify no build errors in the Output window

### Step 5: Run the Application

#### Option A: Visual Studio (Recommended for Development)

1. **Set startup project**:
   - Right-click `ERP.Web` → **Set as Startup Project**

2. **Run**:
   - Press `F5` (Debug mode) or `Ctrl+F5` (without debugging)
   - IIS Express will launch automatically
   - Browser opens to the application

#### Option B: IIS Express Command Line

```bash
# Navigate to IIS Express directory
cd "C:\Program Files\IIS Express"

# Run the web application
iisexpress /path:"C:\path\to\ERP2025\ERP.Web" /port:44300
```

---

## Running Different UI Projects

### ERP.Web (Admin Portal)

```
Default URL: http://localhost:44300/
Login Page: http://localhost:44300/Account/Login.aspx
```

**Set as Startup Project** → Press `F5`

### ERP.SiteNC202310 (Public Website)

```
Default URL: http://localhost:44301/
```

1. Right-click `ERP.SiteNC202310` → **Set as Startup Project**
2. Press `F5`

### ERP.RefSite (Reference Site)

```
Default URL: http://localhost:44302/
Tech Sheets: http://localhost:44302/TechSheet.aspx
```

1. Right-click `ERP.RefSite` → **Set as Startup Project**
2. Press `F5`

---

## Configuration

### Application Settings (`Web.config`)

| Key | Description | Default |
|-----|-------------|---------|
| `PageSize` | Records per page | 20 |
| `ResultLimit` | Max search results | 500 |
| `jsVersion` | JavaScript cache version | 4.5.2 |
| `softwareV` | Software version | 1.1.1.2 |

### File Storage Paths

Configure these paths in `Web.config` → `<appSettings>`:

```xml
<add key="FilePath" value="D:\AppLog\ERPs\ERP_INM\Logs.txt"/>
<add key="UpLoadFiles" value="D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles"/>
<add key="UpLoadFilesProductPhoto" value="D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles\Product\Photo"/>
```

**Create these directories** before running the application:
```bash
mkdir -p D:\AppLog\ERPs\ERP_INM
mkdir -p D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles\Product\Photo
mkdir -p D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles\Product\File
mkdir -p D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles\Album
mkdir -p D:\SiteFilesFolder\ERPs\ERP_INM\Files\UpLoadFiles\TempFile
mkdir -p D:\SiteFilesFolder\ERPs\ERP_INM\Files\EmailAttchmt
mkdir -p D:\SiteFilesFolder\ERPs\ERP_INM\Files\EmailSender
```

---

## Troubleshooting

### Common Issues

#### 1. Build Errors - Missing References

```
Error: Could not find assembly 'AjaxControlToolkit'
```

**Solution**: Ensure `Packages/` folder contains all required DLLs:
- `AjaxControlToolkit.dll`
- `itextsharp.dll`
- `Newtonsoft.Json.dll`
- `HtmlAgilityPack.dll`

#### 2. Database Connection Failed

```
Error: Cannot open database "ERP_MORODA"
```

**Solutions**:
- Verify SQL Server is running
- Check connection string in `Web.config`
- Ensure database exists and user has access
- Try Windows Authentication: `integrated security=True`

#### 3. IIS Express Port Conflict

```
Error: Port 44300 is already in use
```

**Solution**: Change port in project properties:
1. Right-click project → **Properties**
2. Go to **Web** tab
3. Change **Project Url** port number

#### 4. Forms Authentication Redirect Loop

**Solution**: Ensure `aspnetdb.mdf` exists or configure membership provider:
```xml
<connectionStrings>
  <add name="ApplicationServices" 
       connectionString="data source=.\SQLEXPRESS;Integrated Security=SSPI;AttachDBFilename=|DataDirectory|\aspnetdb.mdf;User Instance=true" 
       providerName="System.Data.SqlClient"/>
</connectionStrings>
```

---

## Development Workflow

### Project Structure

```
ERP2025/
├── ERP/                    # Solution folder
│   └── ERP.sln            # Visual Studio solution
├── ERP.Web/               # Admin Portal (Main UI)
│   ├── Account/           # Login, registration pages
│   ├── Views/             # ASPX pages by module
│   ├── js/                # JavaScript files
│   ├── bootstrap/         # CSS framework
│   ├── Web.config         # Configuration
│   └── Site.Master        # Master page template
├── ERP.SiteNC202310/      # Public website
├── ERP.RefSite/           # Reference/Tech sheets site
├── ERP.DataServices/      # Business logic layer
├── ERP.Entities/          # Domain models
├── ERP.Repositories/      # Data access layer
├── ERP.SharedServices/    # Shared utilities (PDF, Email)
├── Packages/              # Third-party DLLs
└── SQL/                   # Database scripts
```

### Making Changes

1. **UI Changes**: Edit `.aspx` files in `Views/` folders
2. **Styling**: Modify CSS in `bootstrap/` or add custom styles
3. **JavaScript**: Add/edit files in `js/` folder
4. **Business Logic**: Modify services in `ERP.DataServices`
5. **Database**: Add scripts to `SQL/` with version folders

### Hot Reload

ASP.NET WebForms supports partial hot reload:
- **ASPX/HTML changes**: Refresh browser (no rebuild needed)
- **C# code-behind changes**: Rebuild required (`Ctrl+Shift+B`)
- **Web.config changes**: Application restarts automatically

---

## Deployment

### Publish to IIS

1. Right-click `ERP.Web` → **Publish**
2. Select **Folder** or **IIS** target
3. Configure settings and publish

### Manual Deployment

1. Build in **Release** mode
2. Copy contents of `bin/` folder
3. Copy all `.aspx`, `.master`, `.config` files
4. Configure IIS application pool for .NET 4.8

---

## Support

For issues not covered in this guide:
1. Check `AppErrors.txt` log file
2. Review Visual Studio Output window
3. Enable detailed errors in `Web.config`:
   ```xml
   <customErrors mode="Off"/>
   ```

---

*Last Updated: January 2026*
