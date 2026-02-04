# Execution Plan – Legacy Parity Gaps
Generated: 2026-02-04

This plan lists missing tasks required to reach functional parity with the legacy ERP. Tasks are grouped by priority and reference concrete evidence in the codebase.

## P0 – Blockers (Data Model and API Correctness)
| ID | Task | Evidence | Dependencies |
| --- | --- | --- | --- |
| P0-01 | Align warehouse stock/movements to legacy inventory + shipping tables (TM_INV/TI_INVR/TI_PIV/TR_PSH/TM_SHE, TM_SRV/TM_SRL). Update repository, service, and warehouse endpoints. **DONE (backend alignment)** | `backend/app/models/inventory.py`, `backend/app/repositories/warehouse_repository.py`, `backend/app/services/warehouse_service.py` | None |
| P0-05 | Replace chat and drive modules with legacy Message/Album tables (TM_MSG, TM_ALB, TM_PHO) or disable UI/routes until mapped. | `backend/app/models/chat.py`, `backend/app/models/drive.py` | None |
| P0-06 | Fix email logs by creating a real table or removing email log endpoints/UI. | `backend/app/models/email_log.py`, `frontend/src/routes/_authenticated/settings/email-logs.tsx` | None |
| P0-07 | Resolve UnitOfMeasure and BusinessUnit lookups (create tables or remove from UI and schemas). | `backend/app/models/unit_of_measure.py`, `backend/app/models/business_unit.py` | None |
| P0-09 | Re-enable accounting router only after backing models/queries exist; otherwise remove accounting UI routes. | `backend/app/api/v1/__init__.py`, `frontend/src/routes/_authenticated/accounting/*` | P0-07 |

## P1 – Core Legacy Parity (User-Facing Workflows)
| ID | Task | Evidence | Dependencies |
| --- | --- | --- | --- |
| P1-01 | Add Enterprise Settings page and API (legacy Admin/EnterpriseSetting). | `Legacy/ERP.Web/Views/Admin/EnterpriseSetting.aspx`, `frontend/src/routes/_authenticated/settings` | None |
| P1-02 | Implement Consignee CRUD/search and link to logistics/deliveries. **UI + API done; linking pending.** | `Legacy/ERP.Web/Views/Consignee/SearchConsignee.aspx`, `backend/app/api/v1/consignees.py`, `frontend/src/routes/_authenticated/consignees/index.tsx` | None |
| P1-03 | Implement Credit Note workflow (ClientInvoiceA) and link to original invoice. | `Legacy/ERP.Web/Views/ClientInvoice/ClientInvoiceA.aspx`, `backend/app/models/invoice.py` | None |
| P1-04 | Implement Invoice Statement generation (ClientInvoiceStatment). | `Legacy/ERP.Web/Views/ClientInvoice/ClientInvoiceStatment.aspx` | P0-09 |
| P1-05 | Implement Supplier Order Payment Record workflow (SupplierOrderPR) with upload/download. | `Legacy/ERP.Web/Views/PaymentRecord/SupplierOrderPR.aspx` | None |
| P1-06 | Implement SOD/CIN cross-payment allocation screen and API (SodCinPayment). | `Legacy/ERP.Web/Views/SupplierOrder/SodCinPayment.aspx` | P1-05 |
| P1-07 | Implement SupplierOrderPayment and PinSodDetails flows. | `Legacy/ERP.Web/Views/SupplierOrder/SupplierOrderPayment.aspx`, `Legacy/ERP.Web/Views/SupplierOrder/PinSodDetails.aspx` | P1-05 |
| P1-08 | Implement SupplierOrderSup and SearchSupplierOrderSup views. | `Legacy/ERP.Web/Views/SupplierOrder/SupplierOrderSup.aspx`, `Legacy/ERP.Web/Views/SupplierOrder/SearchSupplierOrderSup.aspx` | P1-05 |
| P1-09 | Implement Purchase Intent creation UI and line editing; add conversion to Supplier Order. | `frontend/src/routes/_authenticated/purchase-intents/index.tsx` | P1-05 |
| P1-10 | Implement Supplier Product list and search (SupplierProduct, SupplierProductSearch). | `Legacy/ERP.Web/Views/Supplier/SupplierProduct.aspx`, `Legacy/ERP.Web/Views/Supplier/SupplierProductSearch.aspx` | None |
| P1-11 | Implement Product Attribute management UI and attribute-based search. | `Legacy/ERP.Web/Views/Product/ProductAttribute.aspx`, `Legacy/ERP.Web/Views/Product/SearchAttProduct.aspx` | None |
| P1-12 | Implement Product Express, Recommended Product, and Site Project if still required. | `Legacy/ERP.Web/Views/Product/ProductExpress.aspx`, `Legacy/ERP.Web/Views/Product/RecommandedProduct.aspx`, `Legacy/ERP.Web/Views/Product/SiteProject.aspx` | None |
| P1-16 | Wire Order → Delivery and Order → Invoice actions (invoice wired; delivery create now loads orders/carriers/lines but save is still stubbed). | `frontend/src/routes/_authenticated/orders/$orderId.tsx`, `frontend/src/routes/_authenticated/deliveries/new.tsx` | None |
| P1-17 | Wire Delivery PDF and status actions. | `frontend/src/routes/_authenticated/deliveries/$deliveryId.tsx` | P0-01 |
| P1-18 | Wire Invoice PDF/email/payment actions; ensure PDF generation returns real files. | `frontend/src/routes/_authenticated/invoices/$invoiceId.tsx`, `backend/app/api/v1/invoices.py` | P0-02 |
| P1-19 | Wire Quote PDF/email actions and implement actual PDF generation. | `frontend/src/routes/_authenticated/quotes/$quoteId.tsx`, `backend/app/api/v1/endpoints/pdf.py` | None |
| P1-20 | Implement row-level permission filtering (commercial hierarchy) on list/search endpoints. | `Legacy/ERP.Repositories/SqlServer/ClientOrderRepository.cs`, `backend/app/api/v1/*` | None |
| P1-21 | Implement client multi-type assignment and persistence. | `Legacy/ERP.Repositories/SqlServer/ClientRepository.cs` | None |
| P1-22 | Implement contact address type flags (delivery/invoicing) in forms and APIs. | `Legacy/ERP.Repositories/SqlServer/ClientRepository.cs` | None |
| P1-23 | Complete Warehouse UI workflows: shelves management, product inventory views, warehouse vouchers, and voucher search. | `Legacy/ERP.Web/Views/Warehouse/*`, `frontend/src/routes/_authenticated/warehouse/*` | P0-01 |

## P2 – Secondary Parity (Quality and Completeness)
| ID | Task | Evidence | Dependencies |
| --- | --- | --- | --- |
| P2-01 | Add full CRUD UI for client/supplier prices and delegates. | `frontend/src/routes/_authenticated/clients/$clientId.tsx`, `frontend/src/routes/_authenticated/suppliers/$supplierId.tsx` | None |
| P2-02 | Add missing PDF viewer/download pages equivalent to PageDownLoad/PageForPDF. | `Legacy/ERP.Web/Views/Common/PageDownLoad.aspx`, `Legacy/ERP.Web/Views/Common/PageForPDF.aspx` | P1-17, P1-18, P1-19 |
| P2-03 | Standardize lookup routing and remove `/lookup/` alias after migration. | `backend/app/api/v1/__init__.py` | P0-07 |
| P2-04 | Validate Calendar/Tasks parity and add missing UI behaviors from legacy calendar edit flow. | `Legacy/ERP.Web/Views/Calendar/edit.aspx`, `frontend/src/routes/_authenticated/calendar/*` | None |
