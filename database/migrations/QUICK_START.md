# 🎯 Migration Scripts - Ready for Dokploy Execution

## ✅ Files Created

### 1. **run_migrations.sql** (Recommended - Full Featured)
- 📁 Complete SQL script with both migrations
- ✅ Idempotent (safe to run multiple times)
- ✅ Detailed logging and verification
- ✅ Best for SSMS, Azure Data Studio, or sqlcmd with `-i` flag

**How to use:**
```bash
sqlcmd -S 47.254.130.238,1433 -U 'iZ9x6t9u0t5n8Z\Administrator' -P '2@24Courtry' -d DEV_ERP_ECOLED -i run_migrations.sql -e
```

---

### 2. **run_migrations.sh** (Bash Script - User Friendly)
- 🐧 Automated bash script for Linux/Mac/Dokploy
- ✅ Tests connection before running
- ✅ Colored output for easy reading
- ✅ Error handling and helpful messages
- ✅ Displays next steps after completion

**How to use:**
```bash
chmod +x run_migrations.sh
./run_migrations.sh
```

---

### 3. **run_migrations.ps1** (PowerShell - Windows)
- 🪟 PowerShell version for Windows environments
- ✅ Same features as bash script
- ✅ Native Windows console colors

**How to use:**
```powershell
.\run_migrations.ps1
```

---

### 4. **one_liner.sh** (Quick Execution - No File Upload)
- ⚡ Single command that can be copied/pasted
- ✅ No need to upload files
- ✅ Uses sqlcmd `-Q` flag for inline SQL
- ✅ Perfect for quick execution in Dokploy terminal

**How to use:**
```bash
./one_liner.sh
```

Or directly:
```bash
sqlcmd -S 47.254.130.238,1433 -U 'iZ9x6t9u0t5n8Z\Administrator' -P '2@24Courtry' -d DEV_ERP_ECOLED -Q "..." -e
```

---

### 5. **MIGRATION_GUIDE.md** (Complete Documentation)
- 📚 Comprehensive guide with all execution methods
- ✅ Troubleshooting section
- ✅ Verification queries
- ✅ Installation instructions for sqlcmd
- ✅ Docker-based execution method

---

## 🚀 Quick Start Guide

### Option A: Use Bash Script (Easiest - Recommended)
```bash
cd /path/to/database/migrations
chmod +x run_migrations.sh
./run_migrations.sh
```

### Option B: Direct SQL Execution
```bash
sqlcmd -S 47.254.130.238,1433 \
  -U 'iZ9x6t9u0t5n8Z\Administrator' \
  -P '2@24Courtry' \
  -d DEV_ERP_ECOLED \
  -i run_migrations.sql \
  -e
```

### Option C: Copy-Paste in GUI (SSMS/Azure Data Studio)
1. Open `run_migrations.sql` in your SQL editor
2. Connect to `47.254.130.238`
3. Select database `DEV_ERP_ECOLED`
4. Press F5 or click Execute

---

## 🔐 Credentials Used

```
Server: 47.254.130.238:1433
Database: DEV_ERP_ECOLED
Username: iZ9x6t9u0t5n8Z\Administrator
Password: 2@24Courtry
```

⚠️ **Security Note:** These are development credentials. For production:
- Use environment variables
- Don't commit to git
- Use SQL Server Authentication with strong passwords

---

## 📋 What Gets Created

### Table 1: TM_CPP_Client_Product_Price
- Custom pricing per client/product
- Volume discounts (min/max quantity)
- Time-limited pricing (valid_from/valid_to)
- Multi-currency support
- Audit fields (created_by, updated_by, timestamps)

### Table 2: TM_SPP_Supplier_Product_Price
- Supplier product pricing
- Lead time tracking
- Preferred supplier designation
- Supplier SKU/reference mapping
- Priority ordering

Both tables include:
- ✅ Primary keys and indexes
- ✅ Foreign key constraints
- ✅ Default values
- ✅ Audit fields

---

## ✅ Verification After Execution

Run this query to verify:
```sql
-- Check tables exist
SELECT name, create_date 
FROM sys.tables 
WHERE name IN ('TM_CPP_Client_Product_Price', 'TM_SPP_Supplier_Product_Price')
ORDER BY name;

-- Should return 2 rows:
-- TM_CPP_Client_Product_Price
-- TM_SPP_Supplier_Product_Price
```

---

## 🎯 Next Steps After Migration

1. ✅ **Verify tables** - Run verification query above
2. ✅ **Restart Dokploy** - Backend will auto-detect new tables
3. ✅ **Test endpoints** - Try `/api/v1/clients` and `/api/v1/suppliers`
4. ✅ **Check logs** - Should see no "Invalid object name" errors

---

## 🐳 Docker Method (If sqlcmd not available)

```bash
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

## 🆘 Troubleshooting

### "sqlcmd: command not found"
**Solution:** Install sqlcmd or use Docker method (see MIGRATION_GUIDE.md)

### "Login failed for user"
**Solution:** Check username includes backslash: `iZ9x6t9u0t5n8Z\Administrator`

### "Cannot open database"
**Solution:** Verify database name: `DEV_ERP_ECOLED` or `ERP_ECOLED`

For more troubleshooting, see `MIGRATION_GUIDE.md`

---

## 📦 All Files in This Directory

```
database/migrations/
├── README.md                                    # Migration tracking
├── MIGRATION_GUIDE.md                          # Complete documentation (THIS FILE)
├── QUICK_START.md                              # This summary
├── V1.0.0.2__create_client_product_price.sql   # Individual migration
├── V1.0.0.3__create_supplier_product_price.sql # Individual migration
├── run_migrations.sql                          # All-in-one SQL script
├── run_migrations.sh                           # Bash automation script
├── run_migrations.ps1                          # PowerShell script
└── one_liner.sh                                # Quick one-command execution
```

---

## ⚡ TL;DR - Just Run This

**In Dokploy Terminal:**
```bash
# Option 1: Upload and run bash script
chmod +x run_migrations.sh && ./run_migrations.sh

# Option 2: Direct SQL execution (if sqlcmd available)
sqlcmd -S 47.254.130.238,1433 -U 'iZ9x6t9u0t5n8Z\Administrator' -P '2@24Courtry' -d DEV_ERP_ECOLED -i run_migrations.sql -e
```

**In SSMS/Azure Data Studio:**
1. Open `run_migrations.sql`
2. Press F5

**Done!** 🎉

---

**Created:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Ready for execution
