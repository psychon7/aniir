# Task Dependency Graph (Revalidated)

Generated: 2026-02-09

This document replaces prior completion claims and lists the current open work based on the latest codebase audit (`gapanalysis.md`, `Refactor/migration/migration-gap-analysis*.md`). Tasks not listed here are assumed complete, deprecated, or out of scope for parity.

## Summary

| Status          | Count        |
| --------------- | ------------ |
| Completed    | 17           |
| In Progress  | 0            |
| Pending      | 11           |
| Backlog      | 3            |
| **Total** | **31** |

## Completion by Priority

| Priority                    | Total | Completed | In Progress | Pending | Backlog | Completion % |
| --------------------------- | ----- | --------- | ----------- | ------- | ------- | ------------ |
| P0: Blockers                | 9     | 7         | 0           | 2       | 0       | **78%** |
| P1: Core Parity             | 10    | 10        | 0           | 0       | 0       | **100%** |
| P2: Secondary               | 6     | 0         | 0           | 5       | 1       | **0%** |
| P3: Integrations/Automation | 6     | 0         | 0           | 4       | 2       | **0%** |

## Dependency Graph

```mermaid
flowchart TD
  subgraph Completed
    p0_01[P0-01]:::completed
    p0_02[P0-02]:::completed
    p0_03[P0-03]:::completed
    p0_04[P0-04]:::completed
    p0_05[P0-05]:::completed
    p0_06[P0-06]:::completed
    p0_08[P0-08]:::completed

    p1_01[P1-01]:::completed
    p1_02[P1-02]:::completed
    p1_03[P1-03]:::completed
    p1_04[P1-04]:::completed
    p1_05[P1-05]:::completed
    p1_06[P1-06]:::completed
    p1_07[P1-07]:::completed
    p1_08[P1-08]:::completed
    p1_09[P1-09]:::completed
    p1_10[P1-10]:::completed
  end

  subgraph Pending
    p0_07[P0-07]:::pending
    p0_09[P0-09]:::pending

    p2_01[P2-01]:::pending
    p2_02[P2-02]:::pending
    p2_03[P2-03]:::pending
    p2_04[P2-04]:::pending
    p2_05[P2-05]:::pending

    p3_01[P3-01]:::pending
    p3_02[P3-02]:::pending
    p3_05[P3-05]:::pending
    p3_06[P3-06]:::pending
  end

  subgraph Backlog
    p2_06[P2-06]:::backlog
    p3_03[P3-03]:::backlog
    p3_04[P3-04]:::backlog
  end

  %% Dependencies (completed deps shown for context)
  p0_01 --> p0_02
  p0_02 --> p2_05
  p0_03 --> p2_04
  p0_07 --> p0_09
  p0_09 --> p3_01
  p0_09 --> p3_02
  p0_08 --> p3_06
  p1_02 --> p1_03

  classDef completed fill:#10b981,stroke:#059669,color:#fff
  classDef inprogress fill:#f59e0b,stroke:#d97706,color:#fff
  classDef pending fill:#3b82f6,stroke:#2563eb,color:#fff
  classDef backlog fill:#6b7280,stroke:#4b5563,color:#fff
```

## Task List by Priority

### P0 -- Blockers (Data Model + Router Correctness)

- [x] [P0-01] Align accounting allocation data model -- Rewrote payment_allocation_service, statement_service, accounting_service to use `ClientInvoicePayment` (TM_CPY).
- [x] [P0-02] Mount `/accounting` router -- 6 endpoints: receivables aging, payment allocation, payment detail, invoice payments list, client unpaid invoices, client statement.
- [x] [P0-03] Create BusinessUnit + UnitOfMeasure tables -- Migration V1.0.0.4, models restored, lookup service updated with live queries.
- [x] [P0-04] Create `TM_SET_EmailLog` -- Migration V1.0.0.5, model restored, EmailService queries fixed to use actual column names.
- [x] [P0-05] Create `TM_CHT_*` chat tables -- Migration V1.0.0.6 (7 tables), all models restored, service/repository/endpoint fixed.
- [x] [P0-06] Create `TM_DRV_*` drive tables -- Migration V1.0.0.7, DriveFile + DriveFolder models, drive service rewritten with async wrappers.
- [ ] [P0-07] Create Shopify integration tables (`TR_SHP_*`, `TM_SHP_*`, `TM_INT_ShopifyStore`) and re-enable models.
- [x] [P0-08] Create landed cost tables -- Migration V1.0.0.8 (8 tables), all models restored, router enabled (17 endpoints), supply_lot.py deprecated.
- [ ] [P0-09] Mount `/integrations` router after P0-07 and verify Shopify/X3 endpoints do not error.

### P1 -- Core Legacy Parity (User Workflows)

- [x] [P1-01] Credit note workflow -- `POST /invoices/{id}/credit-note` with line cloning, amount negation, `cin_avoir_id` linkage.
- [x] [P1-02] Relation filter endpoints -- Added `project_id` to quotes, `project_id`+`quote_id` to orders, `project_id`+`order_id` to invoices.
- [x] [P1-03] PDF/Email actions -- Fixed PDF service table refs, added send/pdf endpoints to invoices/quotes/orders/deliveries, wired frontend buttons.
- [x] [P1-04] Purchase Intent conversion -- `POST /purchase-intents/{id}/convert-to-supplier-order` with line copying and PI closure.
- [x] [P1-05] Supplier order payment records -- CRUD service + 4 endpoints with auto-recalculation of order `sod_paid`/`sod_need2pay`.
- [x] [P1-06] Supplier Product list UI -- Products tab added to supplier detail page with DataTable, search, pagination.
- [x] [P1-07] Product Attribute management UI -- Full CRUD page at `/products/attributes/` with modal forms, route tree updated.
- [x] [P1-08] Warehouse shelves/bins -- ShelfService + 6 endpoints (list/create/get/update/delete shelves, list products on shelf).
- [x] [P1-09] Logistics send/receive/stock-in -- 3 POST endpoints with strict status flow: Pending -> Sent -> Received -> Stocked In.
- [x] [P1-10] Enterprise Settings -- Full stack: SocietyService, settings router (4 endpoints), frontend page with 4 card sections, i18n (fr/en/zh).

### P2 -- Secondary Parity (Quality + Completeness)

- [ ] [P2-01] Implement row-level security (commercial hierarchy filtering).
- [ ] [P2-02] Implement client multi-type assignment + contact address type flags.
- [ ] [P2-03] Add category CRUD + product image management.
- [ ] [P2-04] Implement multi-business theming and business-unit linking (depends on P0-03).
- [ ] [P2-05] Enable accounting statements/aging UI after P0-01/P0-02.
- [ ] [P2-06] Add PDF viewer/download pages (PageDownLoad/PageForPDF equivalent). *(Backlog)*

### P3 -- Integrations & Automation

- [ ] [P3-01] Shopify sync workflows (orders/products/customers/inventory) + auto order->invoice; remove TODOs. *(Depends on P0-07/P0-09)*
- [ ] [P3-02] X3 export payments + bulk mapping import. *(Depends on P0-09)*
- [ ] [P3-03] SuperPDP e-invoicing integration. *(Backlog)*
- [ ] [P3-04] AI catalog import + translation pipeline. *(Backlog)*
- [ ] [P3-05] Technical sheet PDF generation (product images/specs).
- [ ] [P3-06] Landed cost allocation workflow (depends on P0-08).

---

## Validated Complete (Context)

- Core CRUD flows for quotes, orders, deliveries, invoices
- Supplier orders/invoices + purchase intents (CRUD)
- Warehouse stock, movements, and adjustments
- Payment recording (TM_CPY/TR_SPR)
- Document attachments (TM_DOC_DocumentAttachment)
- List endpoint fixes (camelCase + totals)

---

## Migrations Applied

| Version | Description | Date |
|---------|-------------|------|
| V1.0.0.0 | Init migration history | baseline |
| V1.0.0.1 | Create document attachments | baseline |
| V1.0.0.2 | Create client product price | baseline |
| V1.0.0.3 | Create supplier product price | baseline |
| V1.0.0.4 | Create BusinessUnit + UnitOfMeasure tables | 2026-02-09 |
| V1.0.0.5 | Create EmailLog table | 2026-02-09 |
| V1.0.0.6 | Create Chat tables (7 tables) | 2026-02-09 |
| V1.0.0.7 | Create Drive tables | 2026-02-09 |
| V1.0.0.8 | Create Landed Cost tables (8 tables) | 2026-02-09 |

---

## Last Updated

- **Date**: 2026-02-09
- **Basis**: Implementation session -- 17 tasks completed (7 P0 + 10 P1)
