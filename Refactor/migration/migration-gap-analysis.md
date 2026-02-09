# Migration Gap Analysis: Legacy .NET ERP vs New React/FastAPI Application

**Generated:** 2026-02-09  
**Version:** 3.0  
**Status:** Partial parity; core workflows implemented, integrations and automation incomplete

---

## Executive Summary

This report compares the legacy ASP.NET WebForms ERP system (under `Legacy/`) with the current React/FastAPI application (under `frontend/` and `backend/`). Core sales, purchasing, warehouse, and payment workflows are functional, but feature parity is not achieved due to disabled database tables, missing endpoints, and unmounted routers (notably `/accounting` and `/integrations`).

**Key observations:**
- P1/P2 foundation tasks are complete; P3 integrations are ~28% complete (see `TASK-DEPENDENCY-GRAPH.md`).
- Recent commits fixed list/detail responses (camelCase + totals), enabled attachments, and corrected supplier order/invoice endpoints.
- Integration-heavy modules (Shopify/X3, landed cost, chat/drive, email logs) remain blocked by missing DB tables or disabled routers.

---

## Recent Codebase Updates (Last Commits)

- List endpoints now return camelCase fields with pre-aggregated totals for quotes, orders, invoices, deliveries.
- Supplier order and supplier invoice endpoints corrected; attachments router enabled.
- Consignees endpoint registered; supplier UI mapping fixes applied.
- Query performance improvements across list endpoints.

---

## Coverage Summary (Legacy Screens vs Current App)

| Module | Legacy Screens | Current Status | Evidence / Gaps |
| --- | --- | --- | --- |
| Client | SearchClient, Client, ClientPrice, ClientApplication | Partial | List/detail exist; prices/delegates list-only; `ClientApplication` missing |
| Product | SearchProduct, Product, ProductAttribute, SearchAttProduct, ProductExpress | Partial | List/detail exists; product attributes API enabled but no UI; attribute search missing |
| Project | SearchProject, Project, ProjectCostPlanList, ProjectClientOrderList, ProjectClientInvoiceList | Partial | Detail exists; UI calls `/quotes|orders|invoices/by-project` which are missing |
| Quote (CostPlan) | SearchCostPlan, CostPlan, CostPlanClientOrderList, CostPlanClientInvoiceList | Partial | Convert action wired; related orders/invoices endpoints missing; PDF/email not wired |
| Client Order | SearchClientOrder, ClientOrder, ClientOrderDeliveryFormList | Partial | Create invoice wired; delivery creation basic; PDF/email missing |
| Delivery | SearchDeliveryForm, DeliveryForm | Partial | CRUD exists; status/PDF actions missing |
| Client Invoice | SearchClientInvoice, ClientInvoice, ClientInvoiceA, ClientInvoiceStatement | Partial | CRUD exists; credit notes + statements missing; PDF/email/payment actions not wired |
| Supplier | SearchSupplier, Supplier, SupplierPrice, SupplierProduct | Partial | Prices list-only; supplier products/search screens missing |
| Supplier Orders | SearchSupplierOrder, SupplierOrder, SupplierOrderDetails, SupplierOrderStatus, SupplierOrderPayment | Partial | CRUD exists; payment allocation + supplier portal missing |
| Supplier Invoices | SearchSupplierInvoice, SupplierInvoice | Partial | CRUD exists; allocation to supplier orders missing |
| Purchase Intent | SearchPurchaseIntent, PurchaseIntent | Partial | List/detail exist; `/purchase-intents/new` missing; no conversion to supplier order |
| Warehouse | Warehouse, Shelves, ProductInventory, WarehouseVoucher, SearchVoucher | Partial | Stock/movements/adjustments exist; shelves/bin + voucher workflows incomplete |
| Logistics | SearchLogistics, Logistics | Partial | CRUD exists; consignee/send/receive/stock-in actions missing; no PDF |
| Payment Record | SupplierOrderPR | Partial | `/payments` CRUD exists; allocation UI uses `/accounting` endpoints not mounted |
| Accounting | Statements, Aging, Export | Partial | Services exist; `/accounting` router commented out |
| Admin | EnterpriseSetting, ImportData, Users, EmailLogs | Partial | Import + Users exist; Enterprise settings missing; EmailLog model disabled |
| Calendar | Calendar, edit | Partial | Task module exists; full parity unverified |
| Message | Message | Missing | Chat models disabled (`TM_CHT_*`) |
| Album | Album | Missing | Drive models disabled (`TM_DRV_*`) |
| Integrations | Shopify, X3 | Missing | `/integrations` router disabled; Shopify tables missing; UI uses mocks |
| Landed Cost | Supply lots | Missing | Supply lot models disabled; `/landed-cost` router disabled |
| Consignee | SearchConsignee | Partial | API/UI exists; not linked into logistics/deliveries |
| Category/Brands | Category, SearchCategory | Partial | Brands CRUD exists; categories lookup only |

---

## API/UI Mismatches and Broken Paths

- `/quotes/by-project/{id}`, `/orders/by-project/{id}`, `/invoices/by-project/{id}` are referenced by UI but not implemented.
- `/orders/by-quote/{id}` and `/invoices/by-quote/{id}` are referenced by quote detail UI but not implemented.
- `/accounting/*` endpoints are not mounted (router commented out) despite UI usage for allocations, statements, and aging.
- `/integrations/*` endpoints are not mounted; Shopify/X3 UI relies on mock data.
- `/purchase-intents/new` is referenced by UI but no route exists.
- PDF/email buttons exist in quote/invoice views but are not wired to PDF endpoints.

---

## Data Model Alignment (Enabled vs Disabled)

**Enabled / mapped to legacy tables:**
- Clients, suppliers, products, projects, quotes, orders, deliveries, invoices
- Supplier orders/invoices, purchase intents
- Warehouses, inventory, shipping/receiving
- Logistics (`TM_LGS_*`)
- Payments (`TM_CPY`, `TR_SPR`)
- Document attachments (`TM_DOC_DocumentAttachment`)

**Disabled (tables missing in DB):**
- Chat (`TM_CHT_*`, `TM_CHAT_*`)
- Drive (`TM_DRV_*`)
- Email logs (`TM_SET_EmailLog`)
- Shopify integration (`TR_SHP_*`, `TM_SHP_*`, `TM_INT_ShopifyStore`)
- Supply lots (`TM_SUP_SupplyLot*`)
- Business unit (`TR_BU_BusinessUnit`)
- Unit of measure

---

## Business Logic Gaps

- Reference generator exists (`backend/app/utils/reference_generator.py`) but is not consistently applied across entities.
- Cascade delete validator exists (`backend/app/utils/cascade_validator.py`) but is not used by delete endpoints.
- Row-level permission filtering (commercial hierarchy) not implemented.
- Purchase intent conversion to supplier order missing.
- Supplier order payment allocation (SOD/CIN cross-payment) missing.
- Landed cost allocation workflow missing (landed cost router disabled).
- PDF generation endpoints exist, but UI actions are not wired.

---

## Migration Priority Roadmap

### P1: Wiring and Parity
1. Mount `/accounting` and `/integrations` routers in `backend/app/api/v1/__init__.py`.
2. Add missing relation endpoints (by-project / by-quote for quotes/orders/invoices).
3. Wire PDF/email actions in quote/order/invoice/delivery UI.
4. Implement credit note workflow (API + UI).

### P2: Data Model Enablement
5. Create/migrate missing tables: chat, drive, email logs, business unit, Shopify integrations.
6. Enable landed cost/supply lot tables and routes.
7. Align categories/product attributes with UI.

### P3: Integrations and Automation
8. Shopify multi-store integration + webhook processing.
9. X3 export pipeline and mappings.
10. Technical sheet generation + AI catalog import/translation.

---

## Conclusion

Feature parity with the legacy ERP is not yet achieved. Core workflows are stable, but integration-heavy modules and automation remain blocked by disabled tables and unmounted routers. Focusing on router enablement, missing relation endpoints, and database alignment will unlock the majority of remaining parity work.
