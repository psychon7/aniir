# 🚀 Database Migration Guide for Dokploy

## 📋 Overview

This guide provides multiple methods to run the ERP system database migrations on your production SQL Server.

**Migration Files:**
- `V1.0.0.2__create_client_product_price.sql` - Client product pricing table
- `V1.0.0.3__create_supplier_product_price.sql` - Supplier product pricing table

**Database Connection Details:**
- Server: `47.254.130.238:1433`
- Database: `DEV_ERP_ECOLED` (Development) or `ERP_ECOLED` (Production)
- User: `iZ9x6t9u0t5n8Z\Administrator`
- Password: `2@24Courtry`

---

## 🎯 Quick Start (Recommended Methods)

### Method 1: Using the All-in-One SQL Script (Easiest)

This is the **simplest method** - just run one SQL file that contains all migrations.

#### In Dokploy Terminal:
```bash
# Upload the file to your Dokploy container
# Then run:
sqlcmd -S 47.254.130.238,1433 \
  -U 'iZ9x6t9u0t5n8Z\Administrator' \
  -P '2@24Courtry' \
  -d DEV_ERP_ECOLED \
  -i run_migrations.sql \
  -e
```

#### In SSMS / Azure Data Studio:
1. Open `run_migrations.sql`
2. Connect to server: `47.254.130.238`
3. Select database: `DEV_ERP_ECOLED`
4. Click Execute (F5)

---

### Method 2: Using Bash Script (Linux/Mac/Dokploy)

Automated script with connection testing and colored output.

```bash
# Make it executable
chmod +x run_migrations.sh

# Run it
./run_migrations.sh
```

**Features:**
- ✅ Tests database connection before running
- ✅ Colored output for easy reading
- ✅ Error handling and validation
- ✅ Provides next steps after completion

---

### Method 3: Using PowerShell Script (Windows)

```powershell
.\run_migrations.ps1
```

---

### Method 4: Using Docker (If sqlcmd not available)

If `sqlcmd` is not installed in your Dokploy environment:

```bash
# Run migrations using Microsoft's SQL tools container
docker run -it --rm \
  -v $(pwd):/migrations \
  mcr.microsoft.com/mssql-tools:latest \
  /opt/mssql-tools/bin/sqlcmd \
  -S 47.254.130.238,1433 \
  -U 'iZ9x6t9u0t5n8Z\Administrator' \
  -P '2@24Courtry' \
  -d DEV_ERP_ECOLED \
  -i /migrations/run_migrations.sql \
  -e
```

---

## 📁 File Descriptions

### `run_migrations.sql`
Complete SQL script with:
- Both migrations (V1.0.0.2 and V1.0.0.3)
- IF NOT EXISTS checks (safe to run multiple times)
- Verification queries
- Detailed logging

### `run_migrations.sh`
Bash script with:
- Automatic connection testing
- Colored terminal output
- Error handling
- Installation instructions for sqlcmd

### `run_migrations.ps1`
PowerShell equivalent for Windows environments

---

## 🔍 Manual Execution (Individual Files)

If you prefer to run migrations one by one:

```bash
# Migration 1: Client Product Price
sqlcmd -S 47.254.130.238,1433 \
  -U 'iZ9x6t9u0t5n8Z\Administrator' \
  -P '2@24Courtry' \
  -d DEV_ERP_ECOLED \
  -i V1.0.0.2__create_client_product_price.sql

# Migration 2: Supplier Product Price
sqlcmd -S 47.254.130.238,1433 \
  -U 'iZ9x6t9u0t5n8Z\Administrator' \
  -P '2@24Courtry' \
  -d DEV_ERP_ECOLED \
  -i V1.0.0.3__create_supplier_product_price.sql
```

---

## ✅ Verification

After running migrations, verify the tables exist:

```sql
-- Check if tables were created
SELECT name, create_date 
FROM sys.tables 
WHERE name IN ('TM_CPP_Client_Product_Price', 'TM_SPP_Supplier_Product_Price')
ORDER BY name;

-- Check table structure
EXEC sp_help 'TM_CPP_Client_Product_Price';
EXEC sp_help 'TM_SPP_Supplier_Product_Price';

-- Verify indexes
SELECT 
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('TM_CPP_Client_Product_Price', 'TM_SPP_Supplier_Product_Price')
ORDER BY t.name, i.name;
```

---

## 🚨 Troubleshooting

### Issue: "sqlcmd: command not found"

**Solution 1 - Install sqlcmd on Ubuntu/Debian:**
```bash
# Add Microsoft repository
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | \
  sudo tee /etc/apt/sources.list.d/msprod.list

# Install tools
sudo apt-get update
sudo apt-get install -y mssql-tools unixodbc-dev

# Add to PATH
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Solution 2 - Use Docker method** (see Method 4 above)

### Issue: "Login failed for user"

Check:
1. Username format includes backslash: `iZ9x6t9u0t5n8Z\Administrator`
2. Password is correct: `2@24Courtry`
3. Network connectivity to `47.254.130.238:1433`

### Issue: "Cannot open database"

Make sure you're connecting to the correct database:
- Development: `DEV_ERP_ECOLED`
- Production: `ERP_ECOLED`

### Issue: "Foreign key constraint error"

The referenced tables must exist:
- `TM_CLI_CLient` (for client table)
- `TM_PRD_Product` (for product table)
- `TM_SUP_Supplier` (for supplier table)

These should already exist in your database.

---

## 🎯 After Migration

Once migrations complete successfully:

1. **Verify tables exist** (see Verification section)

2. **Restart Dokploy application:**
   - The backend will automatically detect the new tables
   - SQLAlchemy models will load successfully

3. **Test the endpoints:**
   ```bash
   # Test client endpoint
   curl http://your-domain.com/api/v1/clients
   
   # Test supplier endpoint
   curl http://your-domain.com/api/v1/suppliers
   ```

4. **Check logs:**
   - Backend should start without "Invalid object name" errors
   - Look for successful table initialization messages

---

## 📊 What These Tables Enable

### TM_CPP_Client_Product_Price
- ✅ Custom pricing per client/product combination
- ✅ Volume discounts (min/max quantity)
- ✅ Time-limited special pricing (valid_from/valid_to)
- ✅ Multi-currency support
- ✅ Discount percentages
- ✅ Audit trail (created_by, updated_by, timestamps)

### TM_SPP_Supplier_Product_Price
- ✅ Track costs from different suppliers
- ✅ Compare supplier pricing
- ✅ Lead time tracking
- ✅ Preferred supplier designation
- ✅ Supplier SKU/reference mapping
- ✅ Priority ordering for multiple suppliers

---

## 🔐 Security Note

**Important:** The credentials in these scripts are for development purposes. For production:

1. Use environment variables or secret management
2. Restrict file permissions: `chmod 600 run_migrations.sh`
3. Don't commit credentials to version control
4. Use SQL Server Authentication with strong passwords
5. Consider using Azure AD authentication

---

## 📝 Migration Tracking

Create a migration history table (optional but recommended):

```sql
CREATE TABLE [dbo].[_MigrationHistory] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [version] NVARCHAR(50) NOT NULL,
    [description] NVARCHAR(500) NOT NULL,
    [executed_at] DATETIME NOT NULL DEFAULT GETDATE(),
    [executed_by] NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    [success] BIT NOT NULL DEFAULT 1
);

-- Record migrations
INSERT INTO [_MigrationHistory] ([version], [description])
VALUES 
    ('V1.0.0.2', 'Create TM_CPP_Client_Product_Price table'),
    ('V1.0.0.3', 'Create TM_SPP_Supplier_Product_Price table');
```

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify database connectivity
3. Check SQL Server error logs
4. Ensure all prerequisite tables exist
5. Contact your database administrator

---

## 📌 Quick Reference Commands

```bash
# Test connection only
sqlcmd -S 47.254.130.238,1433 -U 'iZ9x6t9u0t5n8Z\Administrator' -P '2@24Courtry' -Q "SELECT @@VERSION"

# Run all migrations
./run_migrations.sh

# Check if sqlcmd is installed
which sqlcmd

# View script help
./run_migrations.sh --help
```

---

**Last Updated:** 2026-02-04  
**Version:** 1.0.0  
**Database:** DEV_ERP_ECOLED / ERP_ECOLED
