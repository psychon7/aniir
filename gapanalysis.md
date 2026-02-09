# ERP2025 Gap Analysis Report
**Date:** 2026-02-09  
**Scope:** Functional Requirements vs Current Implementation  
**Focus:** Business Logic, Features & Capabilities (Stack-Agnostic)

---

## Executive Summary

Your vision describes a comprehensive multi-business ERP platform with advanced automation, multi-site e-commerce integration, international logistics, and role-based workflows. The current ERP2025 implementation provides a solid foundation (~65% coverage) with strong core flows, but there are still meaningful gaps in multi-business support, automation, and integrations.

**Overall Maturity:** 🟡 **65% Complete**
- ✅ Strong: Core CRM, quote → order → delivery → invoice flow, supplier orders/invoices, purchase intents, warehouse stock/movements, payment recording, attachments
- 🟡 Partial: Logistics workflows, Shopify integration, accounting statements/allocations, product attributes, drive/chat
- ❌ Missing: Credit notes, automated technical sheets, AI catalog import/translation, multi-business theming, landed cost, French e-invoicing

---

## 1. Core Business Entities & Workflows

### 1.1 Document Flow (Devis → Facture)

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Quotations (Devis)** | ✅ | ✅ `TM_CPL_Cost_Plan` + API/UI | PDF/email actions not wired |
| **Client Orders (BC Client)** | ✅ | ✅ `TM_COD_Client_Order` + API/UI | PDF/email actions not wired |
| **Supplier Orders (BC Fournisseur)** | ✅ | ✅ `TM_SOD_Supplier_Order` + API/UI | No purchase intent conversion; payment allocation partial |
| **Purchase Intents** | ✅ | ✅ `TM_PIN_Purchase_Intent` + API/UI | `/purchase-intents/new` route missing |
| **Delivery Notes (BL)** | ✅ | ✅ `TM_DFO_Delivery_Form` + API/UI | Status/PDF actions not wired |
| **Invoices (Factures)** | ✅ | ✅ `TM_CIN_Client_Invoice` + API/UI | Payment/PDF/email actions not wired |
| **Credit Notes (Avoirs)** | ✅ | ❌ Not implemented | 🔴 **Missing workflow/UI** |
| **Technical Sheets in Quotes** | ✅ | ❌ No auto-generation | 🔴 **Missing** |

**Verdict:** 🟡 **75% Complete**  
**Critical Gaps:**
- Credit note workflow and UI
- Automated technical sheet generation
- Purchase intent → supplier order conversion
- PDF/email actions not wired in UI

---

### 1.2 Product Catalog Management

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Product Types** | ✅ | ✅ `TM_PTY_Product_Type` | None |
| **Products + Variants** | ✅ | ✅ `TM_PRD_Product` + `TM_PIT_Product_Instance` | None |
| **Categories** | ✅ | ⚠️ Lookup only (`lookups`); no CRUD UI | 🟡 **Partial** |
| **Supplier Pricing** | ✅ | ✅ `TM_SPP_Supplier_Product_Price` + list UI | None |
| **Images** | ✅ | ⚠️ Attachments exist, no product image UI | 🟡 **Partial** |
| **Product Attributes** | ✅ | ⚠️ API enabled, no UI | 🟡 **Partial** |
| **Auto Catalog Import** | ✅ | ❌ Manual CSV only | 🔴 **Missing AI-powered import** |
| **Auto Technical Sheets** | ✅ | ❌ Not implemented | 🔴 **Missing** |
| **Multi-Language Catalog** | ✅ | ⚠️ i18n exists (FR/EN/ZH) but no auto-translation | 🟡 **Partial** |
| **Product Accessories/Bundles** | ✅ | ❌ No relationship model | 🔴 **Missing** |

**Verdict:** 🟡 **55% Complete**  
**Critical Gaps:**
- AI-powered catalog import and translation
- Automated technical sheet PDF generation
- Product relationship model (accessories/bundles)
- Product attributes UI

---

### 1.3 Multi-Business & Multi-Site

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Business Segmentation** | LED / Domotique / Accessoires / PAC | ❌ Business unit model disabled (`TR_BU_BusinessUnit`) | 🔴 **Missing** |
| **Multi-Site Shopify** | 1 Shopify per business | ❌ Shopify integration tables disabled | 🔴 **Missing** |
| **Color Theming per Business** | Orange/Blue/Pink/Violet | ❌ No dynamic theming | 🔴 **Missing** |
| **Separate Warehouses** | Per business unit | ✅ `TM_WAR_Warehouse` exists | 🟡 **Model exists, no business link** |
| **Client Business Assignment** | Client can buy from multiple businesses | ❌ No client-business junction | 🔴 **Missing** |

**Verdict:** 🔴 **20% Complete**  
**Critical Gaps:**
- No business unit entity or links
- No multi-Shopify configuration
- No dynamic theming system

---

## 2. E-Commerce Integration (Shopify)

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Product Sync** | ✅ | ⚠️ Tasks exist; integration tables disabled | 🟡 **Partial** |
| **Order Sync** | ✅ | ⚠️ Webhook handlers stubbed (`TODO`) | 🟡 **Partial** |
| **Inventory Sync** | ✅ | ⚠️ Tasks exist; integration tables disabled | 🟡 **Partial** |
| **Customer Sync** | ✅ | ⚠️ Tasks exist; integration tables disabled | 🟡 **Partial** |
| **Multi-Store Support** | 3-4 Shopify stores | ❌ No active multi-store tables/routers | 🔴 **Missing** |
| **Auto Order → Invoice** | ✅ | ❌ Not implemented | 🔴 **Missing** |

**Verdict:** 🟡 **40% Complete**  
**Critical Gaps:**
- Shopify integration tables are disabled (`TR_SHP_*`, `TM_SHP_*`)
- Integrations router is not mounted in `backend/app/api/v1/__init__.py`
- Webhook handlers still contain placeholder logic

---

## 3. International Logistics & Sourcing

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Supplier Orders (China)** | ✅ | ✅ Supplier orders + purchase intents exist | ⚠️ No conversion workflow |
| **Shipment Tracking** | Container/Flight numbers | ⚠️ `TM_LGS_Logistic` + UI | 🟡 **No send/receive/stock-in workflow** |
| **Logistics Costs** | Transport invoices, cost/kg | ❌ Landed cost/supply lots disabled | 🔴 **Missing** |
| **Sourcing Office Access** | Chinese UI, update shipment status | ❌ No role-based UI localization | 🔴 **Missing** |
| **Document Upload** | Scan transport invoices | ⚠️ Attachments API exists | 🟡 **No logistics-specific flow** |
| **Profitability Tracking** | Purchase + logistics + delivery costs | ❌ No landed cost aggregation | 🔴 **Missing** |

**Verdict:** 🟡 **45% Complete**  
**Critical Gaps:**
- Landed cost/supply lot workflow
- Shipment send/receive/stock-in actions
- Profitability dashboard and costing

**Recommended Next Models/Services:**
```python
# Landed cost / allocation (enable TM_SUP_SupplyLot* or map to legacy)
lot_id, lot_reference, lot_status, lot_created_at
lot_line_id, lot_id, prd_id, quantity, purchase_price
lot_cost_id, lot_id, cost_type, amount, currency_id
```

---

## 4. Warehouse & Inventory Management

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Warehouses** | ✅ | ✅ `TM_WAR_Warehouse` | None |
| **Warehouse Zones/Aisles** | ✅ | ❌ No shelf/bin endpoints/UI | 🔴 **Missing** |
| **Stock Movements** | ✅ | ✅ `TM_SRV/TM_SRL` + UI | None |
| **Stock Adjustments** | Manual corrections | ✅ `/warehouse/stock/adjust` | None |
| **Multi-Warehouse Inventory** | Per business unit | ⚠️ No business-warehouse link | 🟡 **Partial** |

**Verdict:** 🟡 **70% Complete**  
**Critical Gaps:**
- Shelf/bin location management
- Business unit link to inventory

---

## 5. Role-Based Access Control (RBAC)

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Admin Role** | Full access | ✅ `TR_ROL_Role` + `TR_RIT_Right` | None |
| **Logistics Role** | Warehouse, stock, shipments | ✅ RBAC system exists | 🟡 **Need granular rights** |
| **Sales Role** | View own quotes/orders only | ✅ RBAC system exists | 🟡 **No row-level security** |
| **Sourcing Office Role** | Chinese UI, shipment updates | ❌ No localized UI variant | 🔴 **Missing** |
| **Accounting Role** | Payments, statements, exports | ✅ RBAC exists | 🟡 **Rights + routes incomplete** |

**Verdict:** 🟡 **70% Complete**  
**Critical Gaps:**
- Row-level security and commercial hierarchy rules
- Role-specific UI localization for sourcing office

---

## 6. Accounting & Financial Management

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Payment Tracking** | ✅ | ✅ `TM_CPY` + `TR_SPR` + UI | None |
| **Outstanding Invoices** | ✅ | ⚠️ Stats in services; no dashboard | 🟡 **Missing UI** |
| **Invoice Statements** | Per client | ⚠️ Service + templates exist | 🟡 **Router not mounted** |
| **Sage Export (X3)** | Accounting integration | ⚠️ Code exists | 🟡 **Integrations router disabled** |
| **French E-Invoicing** | `superpdp.tech` | ❌ Not implemented | 🔴 **Missing** |
| **Multi-Society Accounting** | Separate books per business | ✅ `TR_SOC_Society` exists | 🟡 **No accounting separation** |

**Verdict:** 🟡 **55% Complete**  
**Critical Gaps:**
- `/accounting` router not mounted (statements, allocations, aging)
- Sage/X3 export integration disabled
- French e-invoicing integration missing

---

## 7. Automation & AI Features

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Auto Technical Sheets** | PDF generation with product images | ❌ Not implemented | 🔴 **Missing** |
| **AI Catalog Import** | Supplier Excel → ERP format | ❌ Not implemented | 🔴 **Missing** |
| **Auto Translation** | Supplier catalogs (ZH → FR/EN) | ❌ Not implemented | 🔴 **Missing** |
| **Daily Invoice Emails** | Auto-send invoices at 21:00 | ✅ Celery task exists | ✅ **Implemented** |
| **Overdue Reminders** | Auto-send at 9:00 AM | ✅ Celery task exists | ✅ **Implemented** |
| **Email Logs** | Audit sent emails | ❌ `TM_SET_EmailLog` missing | 🔴 **Missing** |
| **AI Copilot** | Natural language ERP queries | ⚠️ Planned in `aiplan.md` | 🟡 **In design** |

**Verdict:** 🟡 **40% Complete**  
**Critical Gaps:**
- Technical sheets, AI import/translation
- Email log table and audit UI

---

## 8. Communication & Collaboration

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Internal Chat** | Real-time chat | ❌ Models disabled (`TM_CHT_*`) | 🔴 **Missing** |
| **File Sharing** | Drive module | ❌ Models disabled (`TM_DRV_*`) | 🔴 **Missing** |
| **Document Attachments** | File attachments | ✅ `TM_DOC_DocumentAttachment` + UI | None |
| **Email Notifications** | Auto-send invoices, reminders | ✅ Celery tasks exist | None |
| **Accounting CC Emails** | Copy accountant on invoices | ✅ Config exists (`ACCOUNTING_CC_EMAIL`) | None |

**Verdict:** 🟡 **50% Complete**  
**Critical Gaps:**
- Chat/Drive tables not available in DB
- Folder permissions and sharing

---

## 9. User Experience & Design

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Left Sidebar Menu** | ✅ | ✅ React app has sidebar | None |
| **Top Menu** | ✅ | ✅ React app has top nav | None |
| **Color Theming** | Per business unit | ❌ No dynamic theming | 🔴 **Missing** |
| **Multi-Language** | FR/EN/ZH | ✅ i18next configured | None |
| **Responsive Design** | ✅ | ✅ Tailwind CSS | None |

**Verdict:** 🟡 **75% Complete**  
**Critical Gaps:**
- No dynamic color theming based on business context

---

## 10. Priority Gap Summary

### 🔴 Critical Missing Features (Must Have)

1. Credit notes workflow (UI + API)
2. Automated technical sheet generation
3. AI catalog import and translation
4. Business unit model + multi-store Shopify integration
5. Landed cost / supply lots (cost allocation)
6. `/accounting` router (statements + allocations + aging)
7. Chat/Drive database tables
8. French e-invoicing integration
9. Product relationships (bundles/accessories)
10. Dynamic theming per business unit

### 🟡 Incomplete Features (Should Have)

1. Purchase intent → supplier order conversion
2. PDF/email actions for quotes, orders, deliveries, invoices
3. Warehouse shelf/bin management
4. Row-level security for sales users
5. Accounting dashboards (outstanding, aging)
6. Logistics send/receive/stock-in actions
7. Product attributes UI

### ✅ Well-Implemented Features

1. Core CRM (clients, suppliers, contacts)
2. Quote → order → delivery → invoice flow
3. Supplier orders/invoices + purchase intents (CRUD)
4. Warehouse stock and movements
5. Payment recording (client + supplier)
6. Attachments for documents
7. Multi-language scaffolding

---

## 11. Recommended Implementation Roadmap

### Phase 1: Parity and Wiring (4-6 weeks)
1. Mount `/accounting` and `/integrations` routers in `backend/app/api/v1/__init__.py`
2. Add missing endpoints for project/quote relations (`/quotes|orders|invoices` by-project/by-quote)
3. Wire PDF/email actions in UI (quotes, orders, deliveries, invoices)
4. Add credit notes workflow to invoices (API + UI)

### Phase 2: Data Model Enablement (6-8 weeks)
5. Create/migrate missing tables: `TR_BU_BusinessUnit`, `TM_DRV_*`, `TM_CHT_*`, `TM_SET_EmailLog`
6. Enable Shopify integration tables (`TR_SHP_*`, `TM_SHP_*`) and connect UI
7. Add landed cost tables or map to legacy equivalents (supply lots)

### Phase 3: Advanced Automation (6-8 weeks)
8. Technical sheet PDF generation
9. AI catalog import + translation pipeline
10. French e-invoicing integration and Sage/X3 export

---

## 12. Conclusion

**Current State:** ERP2025 delivers reliable core operations and purchasing, but integration-heavy and automation features remain incomplete. The biggest blockers are disabled integration tables/routers, missing credit notes, and unimplemented landed cost workflows.

**Key Strengths:**
- Strong core sales and purchasing flows
- Warehouse and logistics foundations aligned to legacy tables
- Payment recording and document attachments in place

**Key Weaknesses:**
- Multi-business/multi-site support missing
- Integrations (Shopify/X3/accounting) not wired end-to-end
- Automation (technical sheets, AI import, translation) absent

**Estimated Completion:** With focused development and database alignment, reaching 85-90% parity is feasible in ~12-18 weeks.
