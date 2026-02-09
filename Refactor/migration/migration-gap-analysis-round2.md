# Migration Gap Analysis – Round 2 (Legacy ERP vs React/FastAPI)
Generated: 2026-02-09
Scope: Legacy codebase under `Legacy/` and current implementation under `backend/` and `frontend/`.

## Executive Summary
- Round 1 parity claim is not supported by current code; P3 integrations remain ~28% complete (see `TASK-DEPENDENCY-GRAPH.md`).
- Recent commits fixed list/detail endpoints (camelCase + totals), enabled attachments, and corrected supplier order/invoice endpoints.
- Major gaps persist in integrations, accounting router, and disabled data models (chat/drive/email logs/shopify/supply lots).

## Key Contradictions to Round 1 Report
- `/accounting` and `/integrations` routers are commented out while UI relies on `/accounting/*` and `/integrations/*`.
- Chat/Drive/EmailLog models are disabled; routers are mounted but fail at runtime.
- Project/quote relation endpoints (`/quotes|orders|invoices` by-project/by-quote) are referenced by UI but not implemented.
- PDF/email actions exist in UI but are not wired to PDF endpoints.
- Shopify tasks exist but integration tables are disabled and webhooks remain TODO.

## Legacy Screen Coverage (Round 2.1)
| Module | Legacy Screens | Current Status | Evidence / Gaps |
| --- | --- | --- | --- |
| Client | SearchClient, Client, ClientPrice, ClientApplication | Partial | List/detail exist; prices/delegates list-only; ClientApplication missing |
| Product | SearchProduct, Product, ProductAttribute, SearchAttProduct | Partial | List/detail exist; product attributes API enabled but no UI |
| Project | SearchProject, Project, ProjectCostPlanList, ProjectClientOrderList, ProjectClientInvoiceList | Partial | Detail exists; `/quotes|orders|invoices/by-project` missing |
| Quote (CostPlan) | SearchCostPlan, CostPlan, CostPlanClientOrderList, CostPlanClientInvoiceList | Partial | Convert wired; `/orders|invoices/by-quote` missing; PDF/email not wired |
| Client Order | SearchClientOrder, ClientOrder, ClientOrderDeliveryFormList | Partial | Create invoice wired; delivery creation basic; no PDF/email |
| Delivery | SearchDeliveryForm, DeliveryForm | Partial | CRUD exists; status/PDF actions missing |
| Client Invoice | SearchClientInvoice, ClientInvoice, ClientInvoiceA, ClientInvoiceStatement | Partial | CRUD exists; credit notes + statements missing; PDF/email not wired |
| Supplier | SearchSupplier, Supplier, SupplierPrice, SupplierProduct | Partial | Prices list-only; supplier products/search screens missing |
| Supplier Orders | SearchSupplierOrder, SupplierOrder, SupplierOrderDetails, SupplierOrderStatus | Partial | CRUD exists; payment allocation + supplier portal missing |
| Supplier Invoices | SearchSupplierInvoice, SupplierInvoice | Partial | CRUD exists; allocation to supplier orders missing |
| Purchase Intent | SearchPurchaseIntent, PurchaseIntent | Partial | List/detail exist; `/purchase-intents/new` missing; no conversion |
| Warehouse | Warehouse, Shelves, ProductInventory, WarehouseVoucher, SearchVoucher | Partial | Stock/movements/adjustments exist; shelves/bin + voucher workflows incomplete |
| Logistics | SearchLogistics, Logistics | Partial | CRUD exists; consignee/send/receive/stock-in actions missing; no PDF |
| Payment Record | SupplierOrderPR | Partial | `/payments` CRUD exists; allocation UI uses `/accounting` endpoints not mounted |
| Admin | EnterpriseSetting, ImportData, Users, EmailLogs | Partial | Import + Users exist; Enterprise settings missing; EmailLog model disabled |
| Calendar | Calendar, edit | Partial | Task module exists; parity unverified |
| Message / Album | Message, Album | Missing | Chat/Drive models disabled |
| Consignee | SearchConsignee | Partial | API/UI exists; not linked into logistics/deliveries |
| Common PDF | PageDownLoad, PageForPDF | Partial | Endpoints exist; UI not wired |

## API/UI Mismatches and Broken Paths
- `/quotes/by-project/{id}`, `/orders/by-project/{id}`, `/invoices/by-project/{id}` referenced by UI but not implemented.
- `/orders/by-quote/{id}` and `/invoices/by-quote/{id}` referenced by quote detail UI but not implemented.
- `/accounting/*` routes not mounted (allocations, statements, aging) while UI depends on them.
- `/integrations/*` routes not mounted; Shopify/X3 UI uses mocks.
- PDF/email actions exist in UI but no API wiring.

## Data Model Gaps (Enabled Routes Using Disabled Models)
- Chat models (`TM_CHT_*`), Drive models (`TM_DRV_*`), EmailLog (`TM_SET_EmailLog`).
- Shopify integration tables (`TR_SHP_*`, `TM_SHP_*`, `TM_INT_ShopifyStore`).
- Supply lot models (`TM_SUP_SupplyLot*`).
- Business unit (`TR_BU_BusinessUnit`) and unit of measure.

## Business Logic Gaps
- Reference generator exists but not consistently applied.
- Cascade delete validator exists but not used by delete endpoints.
- Row-level permission filtering not implemented.
- Purchase intent → supplier order conversion missing.
- Supplier order payment allocation (SOD/CIN) missing.
- Landed cost allocation workflow missing.

## Conclusion
Current implementation is not at legacy feature parity. Core CRUD and most P1/P2 flows exist, but integrations and automation remain blocked by missing tables, unmounted routers, and unimplemented relation endpoints.
