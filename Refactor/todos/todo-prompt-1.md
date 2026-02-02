# TODO: Prompt 1 - FastAPI + SQL Server Backend Tasks

## Overview

This document breaks down Prompt 1 into tasks optimized for **10 parallel Claude Code agents** to complete in **4-5 hours**.

**Key Approach:** FastAPI backend connecting to **existing SQL Server** database. Frontend already exists.

## Context & References

- **Full Prompt**: `Refactor/prompts/prompt-1-foundation.md`
- **Database Schema**: `../frontend/DOCUMENTATION/03-DATABASE-SCHEMA.md`
- **API Specs**: `../frontend/DOCUMENTATION/02-REST-API-MIGRATION.md`
- **Business Logic**: `../frontend/DOCUMENTATION/04-BUSINESS-LOGIC.md`
- **Existing Frontend**: `../frontend/` (keep as-is)

## Critical Requirements

⚠️ **WARNING**: Connect to EXISTING database - NO migrations!
- Use **exact table names** (TM_CLI_Client, TR_STA_Status, etc.)
- Use **exact column names** (cli_id, cli_company_name, etc.)
- **NO Alembic migrations** - schema already exists
- **NO frontend changes** - only update API base URL

## Agent Assignment (10 Parallel Agents)

| Agent | Focus | Est. Time | Dependencies |
|-------|-------|-----------|--------------|
| 1 | Project scaffold + Docker Compose | 1-2h | None |
| 2 | SQLAlchemy models (TR_* reference tables) | 2h | Agent 1 |
| 3 | SQLAlchemy models (TM_* master tables) | 3h | Agent 1 |
| 4 | Auth service + JWT endpoints | 2h | Agent 1, 2 |
| 5 | API: Clients + Contacts | 2h | Agent 2, 3 |
| 6 | API: Products + Instances + Categories | 2h | Agent 2, 3 |
| 7 | API: Quotes + Orders + Invoices | 3h | Agent 2, 3 |
| 8 | API: Suppliers + Warehouse + Logistics | 2h | Agent 2, 3 |
| 9 | API: Lookups + Users + Settings | 2h | Agent 2, 3 |
| 10 | Integration testing + Dokploy config | 2h | All agents |

## Task Groups

### Group 1: Project Scaffold (Agent 1)

| Task ID | Description | Effort |
|---------|-------------|--------|
| P1-001 | Create `backend/` folder structure | Small |
| P1-002 | Create `backend/pyproject.toml` with dependencies | Small |
| P1-003 | Create `backend/Dockerfile` | Small |
| P1-004 | Create `backend/.env.example` | Small |
| P1-005 | Create `docker-compose.yml` (SQL Server, Redis, MinIO) | Medium |
| P1-006 | Create `backend/app/main.py` (FastAPI entry) | Small |
| P1-007 | Create `backend/app/config.py` (SQL Server settings) | Small |
| P1-008 | Create `backend/app/database.py` (SQLAlchemy + pyodbc) | Medium |
| P1-009 | Create `backend/app/dependencies.py` (get_db, get_current_user) | Small |
| P1-010 | Create `README.md` with setup instructions | Small |

**Acceptance Criteria:**
- [ ] `docker-compose up` starts SQL Server, Redis, MinIO
- [ ] `poetry install` works in backend/
- [ ] FastAPI starts and shows /docs
- [ ] Can connect to SQL Server

---

### Group 2: Reference Table Models - TR_* (Agent 2)

⚠️ **Use EXACT table and column names from existing database!**

| Task ID | Description | Table Name |
|---------|-------------|------------|
| P1-011 | Create Society model | `TR_SOC_Society` |
| P1-012 | Create BusinessUnit model | `TR_BU_BusinessUnit` |
| P1-013 | Create Country model | `TR_COU_Country` |
| P1-014 | Create Currency model | `TR_CUR_Currency` |
| P1-015 | Create VatRate model | `TR_VAT_VatRate` |
| P1-016 | Create PaymentMode model | `TR_PAY_PaymentMode` |
| P1-017 | Create PaymentTerm model | `TR_PAY_PaymentTerm` |
| P1-018 | Create Status model | `TR_STA_Status` |
| P1-019 | Create ClientType model | `TR_CT_ClientType` |
| P1-020 | Create Category model | `TR_CAT_Category` |
| P1-021 | Create Brand model | `TR_BRA_Brand` |
| P1-022 | Create UnitOfMeasure model | `TR_UOM_UnitOfMeasure` |
| P1-023 | Create Carrier model | `TR_CAR_Carrier` |
| P1-024 | Create Warehouse model | `TR_WH_Warehouse` |
| P1-025 | Create Role model | `TR_ROL_Role` |
| P1-026 | Create Language model | `TR_LAN_Language` |

**Acceptance Criteria:**
- [ ] All 16 TR_* models created in `models/reference.py`
- [ ] All models use exact table names
- [ ] All columns mapped with exact names
- [ ] Can query existing data from each table

---

### Group 3: Master Table Models - TM_* (Agent 3)

⚠️ **Use EXACT table and column names from existing database!**

| Task ID | Description | Table Name |
|---------|-------------|------------|
| P1-027 | Create User model | `TM_USR_User` |
| P1-028 | Create Client model | `TM_CLI_Client` |
| P1-029 | Create ClientContact model | `TM_CLI_ClientContact` |
| P1-030 | Create Supplier model | `TM_SUP_Supplier` |
| P1-031 | Create Product model | `TM_PRD_Product` |
| P1-032 | Create ProductInstance model | `TM_PRD_ProductInstance` |
| P1-033 | Create CostPlan (Quote) model | `TM_CP_CostPlan` |
| P1-034 | Create CostPlanLine model | `TM_CP_CostPlanLine` |
| P1-035 | Create ClientOrder model | `TM_ORD_ClientOrder` |
| P1-036 | Create ClientOrderLine model | `TM_ORD_ClientOrderLine` |
| P1-037 | Create ClientInvoice model | `TM_INV_ClientInvoice` |
| P1-038 | Create ClientInvoiceLine model | `TM_INV_ClientInvoiceLine` |
| P1-039 | Create DeliveryForm model | `TM_DEL_DeliveryForm` |
| P1-040 | Create DeliveryFormLine model | `TM_DEL_DeliveryFormLine` |
| P1-041 | Create Stock model | `TM_STK_Stock` |
| P1-042 | Create StockMovement model | `TM_STK_StockMovement` |
| P1-043 | Create Shipment model | `TM_LOG_Shipment` |
| P1-044 | Create Project model | `TM_PRJ_Project` |

**Acceptance Criteria:**
- [ ] All 18 TM_* models created in `models/master.py`
- [ ] All models use exact table names
- [ ] All columns mapped with exact names
- [ ] Foreign key relationships defined
- [ ] Can query existing data from each table

---

### Group 4: Auth Service + JWT (Agent 4)

| Task ID | Description | Effort |
|---------|-------------|--------|
| P1-045 | Create `utils/jwt.py` (create/verify tokens) | Medium |
| P1-046 | Create `utils/password.py` (hash/verify) | Small |
| P1-047 | Create `schemas/auth.py` (LoginRequest, AuthResponse) | Small |
| P1-048 | Create `services/auth_service.py` | Medium |
| P1-049 | Create `api/v1/auth.py` (login, refresh, logout) | Medium |
| P1-050 | Add token blacklist in Redis | Small |
| P1-051 | Create `get_current_user` dependency | Medium |

**Acceptance Criteria:**
- [ ] `POST /api/auth/login` returns JWT tokens
- [ ] `POST /api/auth/refresh` refreshes token
- [ ] `POST /api/auth/logout` blacklists token
- [ ] Protected endpoints require valid token

---

### Group 5: API - Clients + Contacts (Agent 5)

| Task ID | Description | Effort |
|---------|-------------|--------|
| P1-052 | Create `schemas/client.py` | Medium |
| P1-053 | Create `services/client_service.py` | Medium |
| P1-054 | Create `api/v1/clients.py` | Medium |
| P1-055 | `GET /api/clients` - List with pagination | Medium |
| P1-056 | `GET /api/clients/{id}` - Get one | Small |
| P1-057 | `POST /api/clients` - Create | Medium |
| P1-058 | `PUT /api/clients/{id}` - Update | Medium |
| P1-059 | `DELETE /api/clients/{id}` - Delete | Small |
| P1-060 | `GET /api/clients/{id}/contacts` - List contacts | Small |
| P1-061 | `POST /api/clients/{id}/contacts` - Add contact | Medium |
| P1-062 | `GET /api/clients/export` - Export CSV | Medium |

**Acceptance Criteria:**
- [ ] All client endpoints working
- [ ] Returns data from existing database
- [ ] Pagination works (page, pageSize, totalCount)
- [ ] Search/filter works

---

### Group 6: API - Products + Categories (Agent 6)

| Task ID | Description | Effort |
|---------|-------------|--------|
| P1-063 | Create `schemas/product.py` | Medium |
| P1-064 | Create `services/product_service.py` | Medium |
| P1-065 | Create `api/v1/products.py` | Medium |
| P1-066 | `GET /api/products` - List | Medium |
| P1-067 | `GET /api/products/{id}` - Get one | Small |
| P1-068 | `POST /api/products` - Create | Medium |
| P1-069 | `PUT /api/products/{id}` - Update | Medium |
| P1-070 | `DELETE /api/products/{id}` - Delete | Small |
| P1-071 | `GET /api/products/{id}/instances` - List instances | Small |
| P1-072 | `POST /api/products/{id}/instances` - Add instance | Medium |

**Acceptance Criteria:**
- [ ] All product endpoints working
- [ ] Returns existing product data
- [ ] Product instances (serial numbers) work

---

### Group 7: API - Quotes + Orders + Invoices (Agent 7)

| Task ID | Description | Effort |
|---------|-------------|--------|
| P1-073 | Create `schemas/quote.py` | Medium |
| P1-074 | Create `schemas/order.py` | Medium |
| P1-075 | Create `schemas/invoice.py` | Medium |
| P1-076 | Create `api/v1/quotes.py` - Full CRUD + lines | Large |
| P1-077 | Create `api/v1/orders.py` - Full CRUD + lines | Large |
| P1-078 | Create `api/v1/invoices.py` - Full CRUD | Large |
| P1-079 | `POST /api/quotes/{id}/convert` - Convert to order | Medium |
| P1-080 | `PATCH /api/orders/{id}/status` - Update status | Small |
| P1-081 | `POST /api/invoices/from-order/{orderId}` - Create from order | Medium |

**Acceptance Criteria:**
- [ ] Quotes CRUD with lines
- [ ] Orders CRUD with lines
- [ ] Invoices CRUD
- [ ] Quote to Order conversion works
- [ ] Invoice from Order works

---

### Group 8: API - Suppliers + Warehouse + Logistics (Agent 8)

| Task ID | Description | Effort |
|---------|-------------|--------|
| P1-082 | Create `schemas/supplier.py` | Medium |
| P1-083 | Create `api/v1/suppliers.py` - Full CRUD | Medium |
| P1-084 | Create `schemas/warehouse.py` | Medium |
| P1-085 | Create `api/v1/warehouse.py` - Stock levels, movements | Medium |
| P1-086 | Create `api/v1/deliveries.py` - Full CRUD | Medium |
| P1-087 | Create `api/v1/logistics.py` - Shipments | Medium |

**Acceptance Criteria:**
- [ ] Suppliers CRUD working
- [ ] Stock levels queryable
- [ ] Stock movements work
- [ ] Deliveries CRUD working
- [ ] Shipments queryable

---

### Group 9: API - Lookups + Users (Agent 9)

| Task ID | Description | Effort |
|---------|-------------|--------|
| P1-088 | Create `api/v1/lookups.py` | Medium |
| P1-089 | `GET /api/lookups/countries` | Small |
| P1-090 | `GET /api/lookups/currencies` | Small |
| P1-091 | `GET /api/lookups/vat-rates` | Small |
| P1-092 | `GET /api/lookups/payment-modes` | Small |
| P1-093 | `GET /api/lookups/payment-terms` | Small |
| P1-094 | `GET /api/lookups/statuses` | Small |
| P1-095 | `GET /api/lookups/business-units` | Small |
| P1-096 | `GET /api/lookups/client-types` | Small |
| P1-097 | `GET /api/lookups/categories` | Small |
| P1-098 | `GET /api/lookups/brands` | Small |
| P1-099 | `GET /api/lookups/warehouses` | Small |
| P1-100 | `GET /api/lookups/carriers` | Small |
| P1-101 | `GET /api/lookups/units-of-measure` | Small |
| P1-102 | Create `api/v1/users.py` - CRUD | Medium |

**Acceptance Criteria:**
- [ ] All 13 lookup endpoints returning data
- [ ] Users CRUD working (admin only)

---

### Group 10: Integration Testing + Deployment (Agent 10)

| Task ID | Description | Effort |
|---------|-------------|--------|
| P1-103 | Test SQL Server connection | Small |
| P1-104 | Test all models query existing data | Medium |
| P1-105 | Test auth flow (login → access → refresh) | Medium |
| P1-106 | Test all CRUD endpoints | Large |
| P1-107 | Update `frontend/src/api/client.ts` base URL | Small |
| P1-108 | Test frontend connects to new backend | Medium |
| P1-109 | Create `deployment/dokploy-config.md` for SQL Server | Medium |
| P1-110 | Verify Docker Compose in production mode | Medium |

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Frontend works with new backend
- [ ] Dokploy deployment documented

---

## Progress Tracking

| Group | Agent | Tasks | Status |
|-------|-------|-------|--------|
| Scaffold | 1 | 10 | 🔴 Not Started |
| TR_* Models | 2 | 16 | 🔴 Not Started |
| TM_* Models | 3 | 18 | 🔴 Not Started |
| Auth | 4 | 7 | 🔴 Not Started |
| Clients API | 5 | 11 | 🔴 Not Started |
| Products API | 6 | 10 | 🔴 Not Started |
| Quotes/Orders/Invoices API | 7 | 9 | 🔴 Not Started |
| Suppliers/Warehouse API | 8 | 6 | 🔴 Not Started |
| Lookups/Users API | 9 | 15 | 🔴 Not Started |
| Testing/Deploy | 10 | 8 | 🔴 Not Started |
| **TOTAL** | **10** | **110** | 🔴 |

---

## Validation Checklist

Before marking complete:
- [ ] `docker-compose up` starts all services
- [ ] Backend connects to SQL Server
- [ ] All 16 TR_* tables mapped
- [ ] All 18+ TM_* tables mapped
- [ ] JWT auth working
- [ ] All CRUD endpoints return data
- [ ] Existing frontend connects to new backend
- [ ] Response format matches frontend expectations


