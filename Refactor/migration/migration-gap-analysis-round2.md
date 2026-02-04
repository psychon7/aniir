# Migration Gap Analysis – Round 2 (Legacy ERP vs React/FastAPI)
Generated: 2026-02-04
Scope: Legacy codebase under `Legacy/` and current implementation under `backend/` and `frontend/`.

## Executive Summary
- The Round 1 report (`Refactor/migration/migration-gap-analysis.md`) states full parity, but the codebase does not support that claim.
- Multiple legacy modules are missing or partial, and several enabled APIs depend on disabled models that do not map to real DB tables.
- The task graph (`TASK-DEPENDENCY-GRAPH.md`) still shows 54 pending and 14 backlog items, with P3 only 28% complete, which contradicts “full parity.”

## Key Contradictions to Round 1 Report
- Warehouse was marked complete, but the APIs depended on disabled stock models. The backend is now aligned to legacy inventory/shipping tables; remaining gaps are UI workflows (shelves, vouchers) and stock movement semantics.
- Payments now use legacy tables (TM_CPY/ TR_SPR) but allocation workflows and accounting routes remain missing.
- Chat/Drive are marked complete, but their models are disabled and do not map to legacy tables (`backend/app/models/chat.py`, `backend/app/models/drive.py`).
- Attachments and email logs are presented in the UI, but their routers are not mounted or depend on disabled tables (`backend/app/api/v1/__init__.py`, `backend/app/models/email_log.py`).

## Legacy Screen Coverage (Round 2)
| Module | Legacy Screens | Current Status | Evidence / Gaps |
| --- | --- | --- | --- |
| Client | SearchClient, Client, ClientPrice, ClientApplication | Partial | List/detail exist in `frontend/src/routes/_authenticated/clients/*`. Prices/delegates are list-only and actions are stubbed. `ClientApplication` has no route. |
| Product | SearchProduct, Product, ProductAttribute, SearchAttProduct, ProductExpress, RecommandedProduct, SiteProject | Partial | Basic list/detail exist. No product attribute UI or attribute search. Express/recommended/site-project routes are missing. |
| Project | SearchProject, Project, ProjectCostPlanList, ProjectClientOrderList, ProjectClientInvoiceList | Partial | Detail page now includes quotes, orders, and invoices lists using new `/quotes/by-project`, `/orders/by-project`, and `/invoices/by-project` endpoints. Verify permissions and pagination. |
| Quote (CostPlan) | SearchCostPlan, CostPlan, CostPlanClientOrderList, CostPlanClientInvoiceList | Partial | Detail page now shows related orders and invoices. Convert action is wired; PDF/email actions are still not wired. |
| Client Order | SearchClientOrder, ClientOrder, ClientOrderDeliveryFormList | Partial | Detail page shows deliveries and now wires Create Invoice; Delivery action navigates to new delivery screen (form still stubbed). |
| Delivery | SearchDeliveryForm, DeliveryForm | Partial | List/detail exist; create screen now loads orders/carriers and line items; PDF and status actions are stubbed. |
| Client Invoice | SearchClientInvoice, ClientInvoice, ClientInvoiceA, ClientInvoiceStatment | Partial | Detail page exists; PDF/email/payment actions are stubbed. Credit notes and statements are missing. |
| Supplier | SearchSupplier, Supplier, SupplierPrice, SupplierProduct, SupplierProductSearch | Partial | Detail page lists prices only. Supplier products/search screens are missing. |
| Supplier Orders | SearchSupplierOrder, SupplierOrder, SupplierOrderDetails, SupplierOrderStatus, SupplierOrderPayment, PinSodDetails, SodCinPayment, SupplierOrderSup, SearchSupplierOrderSup | Partial | Core CRUD exists, but payment record workflow, supplier view/search, and cross-payment screens are missing. |
| Supplier Invoices | SearchSupplierInvoice, SupplierInvoice | Partial | CRUD exists; payment allocation and integration with supplier order payment records are missing. |
| Purchase Intent | SearchPurchaseIntent, PurchaseIntent | Partial | List/detail exist. Create route referenced but missing (`/purchase-intents/new`). Conversion to supplier order not present. |
| Warehouse | Warehouse, Shelves, ProductInventory, WarehouseVoucher, SearchVoucher | Partial | Backend now maps stock to TM_INV/TI_INVR/TI_PIV/TR_PSH/TM_SHE and movements to TM_SRV/TM_SRL. UI still lacks shelves/voucher flows and movement semantics are simplified. |
| Logistics | SearchLogistics, Logistics | Partial / Aligned | API now uses TM_LGS/TM_LGL legacy logistics tables; UI still lacks consignee association, send/receive/stock-in actions, and PDF outputs. |
| Payment Record | SupplierOrderPR | Missing | No equivalent workflow or UI in current app. |
| Admin | EnterpriseSetting, ImportData, Users | Partial | Import and Users exist. Enterprise settings page is missing. Email logs rely on disabled model. |
| Calendar | Calendar, edit | Partial | Task feature exists but needs verification against legacy task schema and UI parity. |
| Message | Message | Missing | Chat models are disabled and not mapped to legacy TM_MSG_Message. |
| Album | Album | Missing | Drive models are disabled and not mapped to legacy TM_ALB/TM_PHO. |
| Category/Brands | Category, SearchCategory | Partial | Brands UI exists; verify mapping to legacy categories. |
| Consignee | SearchConsignee | Partial | Consignee CRUD/search API and UI are now implemented; still needs linking to logistics/deliveries workflows if required by legacy. |
| Common PDF | PageDownLoad, PageForPDF | Partial | PDF endpoints exist but UI does not wire download/view actions. |

## API/UI Mismatches and Broken Paths
- Quote endpoints `/quotes/by-project/{id}`, `/quotes/in-progress`, `/quotes/recent-in-progress` are now implemented; verify UI payload alignment and permissions.
- Attachments API (`/attachments/*`) is now mounted; requires `TM_DOC_DocumentAttachment` migration before use.
- Accounting routes exist in UI (`frontend/src/routes/_authenticated/accounting/*`), but `accounting` router is commented out in `backend/app/api/v1/__init__.py`.
- `/purchase-intents/new` is referenced in `frontend/src/routes/_authenticated/purchase-intents/index.tsx` but no route file exists.

## Data Model Gaps (Enabled Routes Using Disabled Models)
- Warehouse stock and movements now map to legacy inventory/shipping tables; remaining gaps are UI workflows (shelves/vouchers) and richer movement semantics.
- Chat and Drive APIs depend on disabled models (`backend/app/models/chat.py`, `backend/app/models/drive.py`).
- Email logs depend on disabled `EmailLog` (`backend/app/models/email_log.py`).
- Unit of Measure and Business Unit are disabled (`backend/app/models/unit_of_measure.py`, `backend/app/models/business_unit.py`).

## Business Logic Gaps
- Reference code generation exists but is not consistently applied across entities.
- Cascade delete validation exists in `backend/app/utils/cascade_validator.py` but is not used by delete endpoints.
- Row-level permission filtering (commercial hierarchy) is not implemented on list/search endpoints.
- Client multi-type assignment and contact address type flags from legacy are not reflected in UI or service logic.
- Supplier order payment record workflow and SOD/CIN cross allocation are not implemented.

## Conclusion
Current implementation is not at legacy feature parity. Core CRUD exists for many entities, but multiple legacy workflows are missing, several modules are blocked by disabled models, and several UI paths call missing backend endpoints. Parity requires a focused execution plan (see `executionplan.md`).
