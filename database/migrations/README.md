# Database Migrations
Generated: 2026-02-04

This folder stores migration scripts for new tables or schema changes that are **not** present in the legacy ERP database.

## 🚀 Automatic Migration System

**Migrations now run automatically on every deployment!**

When the FastAPI application starts:
1. Checks the `_MigrationHistory` table for applied migrations
2. Discovers new `.sql` files in this folder
3. Executes any pending migrations in version order
4. Records successful migrations in the history table

### How It Works
```
Push Code → Dokploy Deploys → App Starts → Migrations Run → App Ready
```

### No Manual Intervention Needed!
- Just add new migration files following the naming convention
- Push to git
- Dokploy will deploy and migrations run automatically

---

## Rules
- If a feature exists in the legacy database, do **not** create new tables. Map models to legacy tables instead.
- If a feature is **new** (not in legacy DB), add a migration file here and document the table in `schema-alignment.md`.
- Keep migrations idempotent (use IF NOT EXISTS checks).

## Naming Convention
Migrations follow the Flyway naming convention:
- `V{version}__{description}.sql`
- Example: `V1.0.0.1__create_document_attachments.sql`

**Version Format:** `V{major}.{minor}.{patch}.{sequence}`

---

## 🔧 Manual Execution Options

### CLI Commands (Recommended)
```bash
# Check migration status
python -m app.cli migrate status

# Run pending migrations
python -m app.cli migrate run

# List pending migrations
python -m app.cli migrate pending

# Dry run (see what would execute)
python -m app.cli migrate run --dry-run
```

### Direct Module Execution
```bash
# Run migrations
python -m app.migrations.runner run

# Check status
python -m app.migrations.runner status

# List pending
python -m app.migrations.runner pending
```

### SQL Script (First-Time Setup)
```bash
# Run the combined migration script
sqlcmd -S 47.254.130.238,1433 \
  -U 'iZ9x6t9u0t5n8Z\Administrator' \
  -P '2@24Courtry' \
  -d DEV_ERP_ECOLED \
  -i run_migrations.sql
```

---

## 📊 Health Check Endpoint

Check migration status via API:
```bash
curl http://your-domain.com/health/migrations
```

Response:
```json
{
  "status": "ok",
  "pending_count": 0,
  "pending_migrations": []
}
```

---

## Migration History
| Version | Description | Date | Status |
|---------|-------------|------|--------|
| V1.0.0.0 | Initialize Migration History Table | 2026-02-04 | ✅ Applied |
| V1.0.0.1 | Record Baseline Migrations | 2026-02-04 | ✅ Applied |
| V1.0.0.2 | Create TM_CPP_Client_Product_Price table | 2026-02-04 | Pending |
| V1.0.0.3 | Create TM_SPP_Supplier_Product_Price table | 2026-02-04 | Pending |

---

## 📁 Files in This Directory

| File | Purpose |
|------|---------|
| `V*.sql` | Individual migration files |
| `run_migrations.sql` | Combined script for manual execution |
| `run_migrations.sh` | Bash automation script |
| `run_migrations.ps1` | PowerShell automation script |
| `MIGRATION_GUIDE.md` | Detailed execution guide |
| `QUICK_START.md` | Quick reference |

---

## 🆕 Creating New Migrations

1. **Create a new SQL file** following the naming convention:
   ```
   V1.0.0.4__create_new_feature.sql
   ```

2. **Add IF NOT EXISTS checks** for idempotency:
   ```sql
   IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'NewTable')
   BEGIN
       CREATE TABLE [dbo].[NewTable] (...)
   END
   ```

3. **Push to git** - migration runs automatically on deploy!

4. **Update this README** with the new migration in the history table.

---

## ⚠️ Important Notes

- Migrations are **idempotent** - safe to run multiple times
- Failed migrations are recorded with `success = 0`
- The migration runner stops on first failure
- Always test migrations locally before pushing
- The `_MigrationHistory` table tracks all applied migrations
