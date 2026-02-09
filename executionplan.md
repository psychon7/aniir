# Execution Plan – Legacy Parity Gaps (Revalidated)
Generated: 2026-02-09

This plan lists missing tasks required to reach functional parity with the legacy ERP. It aligns with `TASK-DEPENDENCY-GRAPH.md` and references concrete evidence in the codebase.

## P0 – Blockers (Data Model + Router Correctness)
| ID | Task | Evidence | Dependencies |
| --- | --- | --- | --- |
| P0-01 | Align accounting allocation data model (legacy TM_CPY/TR_SPR vs TM_PAY) and refactor `AccountingService`. | `backend/app/services/accounting_service.py`, `backend/app/api/v1/accounting.py` | None |
| P0-02 | Implement missing accounting endpoints and mount `/accounting` router. | `backend/app/api/v1/__init__.py`, `frontend/src/api/accounting.ts`, `frontend/src/components/features/payments/PaymentAllocationModal.tsx` | P0-01 |
| P0-03 | Create BusinessUnit + UnitOfMeasure tables or remove lookups. | `backend/app/models/business_unit.py`, `backend/app/models/unit_of_measure.py`, `backend/app/api/v1/lookups.py` | None |
| P0-04 | Create `TM_SET_EmailLog` or disable email log endpoints/UI. | `backend/app/models/email_log.py`, `backend/app/api/v1/endpoints/email_logs.py`, `frontend/src/routes/_authenticated/settings/email-logs.tsx` | None |
| P0-05 | Create `TM_CHT_*` chat tables or disable chat endpoints/UI. | `backend/app/models/chat.py`, `backend/app/api/v1/endpoints/chat.py`, `frontend/src/routes/_authenticated/chat/index.tsx` | None |
| P0-06 | Create `TM_DRV_*` drive tables or disable drive endpoints/UI. | `backend/app/models/drive.py`, `backend/app/api/v1/drive.py`, `frontend/src/routes/_authenticated/drive/index.tsx` | None |
| P0-07 | Create Shopify integration tables and re-enable models. | `backend/app/models/integrations/shopify.py`, `backend/app/models/integrations/shopify_store.py` | None |
| P0-08 | Create supply lot/landed cost tables or map to legacy; re-enable landed cost router. | `backend/app/models/supply_lot.py`, `backend/app/api/v1/landed_cost.py` | None |
| P0-09 | Mount `/integrations` router and verify Shopify/X3 routes are safe. | `backend/app/api/v1/__init__.py`, `backend/app/api/v1/integrations/__init__.py` | P0-07 |

## P1 – Core Legacy Parity (User-Facing Workflows)
| ID | Task | Evidence | Dependencies |
| --- | --- | --- | --- |
| P1-01 | Implement credit note workflow (ClientInvoiceA) and link to original invoice. | `backend/app/models/invoice.py`, `frontend/src/routes/_authenticated/invoices/$invoiceId.tsx` | None |
| P1-02 | Add missing relation endpoints (by-project, by-quote) for quotes/orders/invoices or update UI to match existing APIs. | `frontend/src/api/quotes.ts`, `frontend/src/api/orders.ts`, `frontend/src/api/invoices.ts` | None |
| P1-03 | Wire PDF/email/payment actions for quote/order/delivery/invoice screens. | `frontend/src/routes/_authenticated/quotes/$quoteId.tsx`, `frontend/src/routes/_authenticated/invoices/$invoiceId.tsx`, `backend/app/api/v1/endpoints/pdf.py` | None |
| P1-04 | Add Purchase Intent creation route and conversion to Supplier Order. | `frontend/src/routes/_authenticated/purchase-intents/index.tsx`, `backend/app/services/purchase_intent_service.py` | None |
| P1-05 | Implement supplier order payment record workflow and SOD/CIN allocation screens. | `backend/app/models/supplier_order_payment_record.py`, `Legacy/ERP.Web/Views/SupplierOrder/SodCinPayment.aspx` | None |
| P1-06 | Implement Supplier Product list/search screens. | `Legacy/ERP.Web/Views/Supplier/SupplierProduct.aspx`, `frontend/src/routes/_authenticated/suppliers/$supplierId.tsx` | None |
| P1-07 | Implement Product Attribute management UI and attribute-based search. | `backend/app/api/v1/product_attributes.py`, `Legacy/ERP.Web/Views/Product/ProductAttribute.aspx` | None |
| P1-08 | Complete warehouse shelves/bin + voucher workflows. | `Legacy/ERP.Web/Views/Warehouse/*`, `frontend/src/routes/_authenticated/warehouse/*` | None |
| P1-09 | Complete logistics send/receive/stock-in actions + consignee linking. | `backend/app/models/logistics.py`, `frontend/src/routes/_authenticated/logistics/$shipmentId.tsx` | None |
| P1-10 | Add Enterprise Settings page and API. | `Legacy/ERP.Web/Views/Admin/EnterpriseSetting.aspx`, `frontend/src/routes/_authenticated/settings` | None |

## P2 – Secondary Parity (Quality + Completeness)
| ID | Task | Evidence | Dependencies |
| --- | --- | --- | --- |
| P2-01 | Implement row-level security (commercial hierarchy filtering). | `Legacy/ERP.Repositories/SqlServer/ClientOrderRepository.cs`, `backend/app/api/v1/*` | None |
| P2-02 | Implement client multi-type assignment and contact address flags. | `Legacy/ERP.Repositories/SqlServer/ClientRepository.cs` | None |
| P2-03 | Add category CRUD + product image management. | `backend/app/api/v1/lookups.py`, `frontend/src/routes/_authenticated/products/*` | None |
| P2-04 | Implement multi-business theming + business-unit links. | `backend/app/models/business_unit.py`, `frontend/src` | P0-03 |
| P2-05 | Enable accounting statements/aging UI after router alignment. | `frontend/src/routes/_authenticated/accounting/*`, `backend/app/services/statement_service.py` | P0-01, P0-02 |
| P2-06 | Add PDF viewer/download pages (PageDownLoad/PageForPDF). | `Legacy/ERP.Web/Views/Common/PageDownLoad.aspx` | P1-03 |

## P3 – Integrations & Automation
| ID | Task | Evidence | Dependencies |
| --- | --- | --- | --- |
| P3-01 | Shopify sync workflows + auto order→invoice; remove TODOs in tasks. | `backend/app/tasks/shopify_tasks.py` | P0-07, P0-09 |
| P3-02 | X3 export payments + bulk mapping import. | `backend/app/services/x3_export_service.py`, `frontend/src/routes/_authenticated/integrations/x3/mappings.tsx` | P0-09 |
| P3-03 | SuperPDP e-invoicing integration. | `backend/app/api/v1/integrations/*` | P0-09 |
| P3-04 | AI catalog import + translation pipeline. | `gapanalysis.md` | None |
| P3-05 | Technical sheet PDF generation. | `gapanalysis.md` | None |
| P3-06 | Landed cost allocation workflow. | `backend/app/api/v1/landed_cost.py`, `frontend/src/routes/_authenticated/supply-lots/*` | P0-08 |
