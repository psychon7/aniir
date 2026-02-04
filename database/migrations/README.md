# Database Migrations
Generated: 2026-02-04

This folder stores migration scripts for new tables or schema changes that are **not** present in the legacy ERP database.

Rules:
- If a feature exists in the legacy database, do **not** create new tables. Map models to legacy tables instead.
- If a feature is **new** (not in legacy DB), add a migration file here and document the table in `schema-alignment.md`.
- Keep migrations idempotent (use IF NOT EXISTS checks).

## Naming Convention
Migrations follow the Flyway naming convention:
- `V{version}__{description}.sql`
- Example: `V1.0.0.1__create_document_attachments.sql`

## Running Migrations
Migrations should be run in version order against the production SQL Server database.

### Manual Execution
```sql
-- Connect to your SQL Server instance
-- Execute each migration file in order
sqlcmd -S your-server -d ERP2025 -i V1.0.0.1__create_document_attachments.sql
sqlcmd -S your-server -d ERP2025 -i V1.0.0.2__create_client_product_price.sql
sqlcmd -S your-server -d ERP2025 -i V1.0.0.3__create_supplier_product_price.sql
```

## Migration History
| Version | Description | Date | Status |
|---------|-------------|------|--------|
| V1.0.0.1 | Create TM_DOC_DocumentAttachment table | 2026-02-04 | Pending |
| V1.0.0.2 | Create TM_CPP_Client_Product_Price table | 2026-02-04 | Pending |
| V1.0.0.3 | Create TM_SPP_Supplier_Product_Price table | 2026-02-04 | Pending |
