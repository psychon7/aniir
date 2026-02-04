# Database Migrations
Generated: 2026-02-04

This folder stores migration scripts for new tables or schema changes that are **not** present in the legacy ERP database.

Rules:
- If a feature exists in the legacy database, do **not** create new tables. Map models to legacy tables instead.
- If a feature is **new** (not in legacy DB), add a migration file here and document the table in `schema-alignment.md`.
- Keep migrations idempotent and include both `UP` and `DOWN` sections.

Naming convention:
- `YYYYMMDD_HHMM_<short_description>.sql`

Example:
- `20260204_1200_add_document_attachment.sql`
