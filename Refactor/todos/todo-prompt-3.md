# TODO: Prompt 3 - Integrations Task Breakdown

## Overview

| Property | Value |
|----------|-------|
| **Total Tasks** | ~70 tasks |
| **Estimated Time** | 5-6 hours (4 parallel agents) |
| **Dependencies** | Prompts 1 & 2 must be complete |
| **Database** | SQL Server (new TM_INT_* tables) |

## ⚠️ CRITICAL RULES

1. **New tables** use `TM_INT_` prefix for integration data
2. **SQL scripts** go in `/SQL/V1.0.0.4/` folder
3. **Reference existing tables** (TM_CLI_Client, TM_PRD_Product, TM_INV_ClientInvoice)
4. **Encrypt sensitive data** (Shopify access tokens)

---

## Agent Assignment

| Agent | Focus Area | Tasks | Time |
|-------|------------|-------|------|
| **Agent 1** | Shopify Models + OAuth | P3-001 to P3-018 | 2h |
| **Agent 2** | Shopify Webhooks + Sync | P3-019 to P3-035 | 2.5h |
| **Agent 3** | Sage X3 Integration | P3-036 to P3-052 | 2h |
| **Agent 4** | SuperPDP + Frontend | P3-053 to P3-070 | 2h |

---

## Group A: Shopify Models + OAuth (Agent 1)

### SQL Scripts
| ID | Task | Effort |
|----|------|--------|
| P3-001 | Create `/SQL/V1.0.0.4/06-create-shopify-tables.sql` | Medium |

### Backend - Models
| ID | Task | Effort |
|----|------|--------|
| P3-002 | Create `backend/app/models/integrations/__init__.py` | Small |
| P3-003 | Create `backend/app/models/integrations/shopify.py` (ShopifyStore) | Small |
| P3-004 | Add ShopifyLocationMap model | Small |
| P3-005 | Add ShopifySyncCursor model | Small |
| P3-006 | Add ShopifyWebhookEvent model | Small |

### Backend - OAuth
| ID | Task | Effort |
|----|------|--------|
| P3-007 | Add `httpx` to `pyproject.toml` | Small |
| P3-008 | Create `backend/app/integrations/__init__.py` | Small |
| P3-009 | Create `backend/app/integrations/shopify/__init__.py` | Small |
| P3-010 | Create `backend/app/integrations/shopify/config.py` (settings) | Small |
| P3-011 | Create `backend/app/api/v1/integrations/__init__.py` | Small |
| P3-012 | Create `backend/app/api/v1/integrations/shopify_oauth.py` | Medium |
| P3-013 | Implement `GET /integrations/shopify/install` (redirect to Shopify) | Medium |
| P3-014 | Implement `GET /integrations/shopify/callback` (exchange token) | Large |
| P3-015 | Implement HMAC verification for OAuth callback | Medium |
| P3-016 | Implement state verification (Redis) | Small |
| P3-017 | Implement token exchange | Medium |
| P3-018 | Implement webhook registration after OAuth | Medium |

**Acceptance Criteria:**
- [ ] OAuth flow redirects to Shopify
- [ ] Callback verifies HMAC
- [ ] Token exchanged and stored
- [ ] Webhooks registered

---

## Group B: Shopify Webhooks + Sync (Agent 2)

### Backend - GraphQL Client
| ID | Task | Effort |
|----|------|--------|
| P3-019 | Create `backend/app/integrations/shopify/graphql_client.py` | Large |
| P3-020 | Implement execute_query() with retry + rate limiting | Large |
| P3-021 | Create `backend/app/integrations/shopify/queries.py` | Medium |
| P3-022 | Implement fetch_order_query() | Small |
| P3-023 | Implement list_orders_query() | Small |
| P3-024 | Implement set_inventory_mutation() | Small |
| P3-025 | Implement get_locations_query() | Small |

### Backend - Webhooks
| ID | Task | Effort |
|----|------|--------|
| P3-026 | Create `backend/app/api/v1/integrations/shopify_webhooks.py` | Medium |
| P3-027 | Implement `POST /webhooks/shopify/{store_id}` | Medium |
| P3-028 | Implement HMAC verification for webhooks | Medium |
| P3-029 | Implement idempotency check (duplicate detection) | Medium |

### Backend - Celery Tasks
| ID | Task | Effort |
|----|------|--------|
| P3-030 | Create `backend/app/tasks/shopify_tasks.py` | Large |
| P3-031 | Implement process_webhook_event_task() | Medium |
| P3-032 | Implement create_or_update_order_task() | Large |
| P3-033 | Implement sync_inventory_to_shopify_task() | Medium |

### Backend - Admin Endpoints
| ID | Task | Effort |
|----|------|--------|
| P3-034 | Create `backend/app/api/v1/integrations/shopify_admin.py` | Medium |
| P3-035 | Implement `GET /integrations/shopify/stores` | Small |
| P3-036 | Implement `POST /integrations/shopify/stores/{id}/test-connection` | Small |
| P3-037 | Implement `POST /integrations/shopify/stores/{id}/sync-orders` | Medium |
| P3-038 | Implement `POST /integrations/shopify/stores/{id}/sync-inventory` | Medium |
| P3-039 | Implement `GET /integrations/shopify/stores/{id}/webhook-events` | Small |

**Acceptance Criteria:**
- [ ] Webhooks verified with HMAC
- [ ] Idempotency prevents duplicate processing
- [ ] Orders synced to TM_ORD_ClientOrder
- [ ] Inventory pushed to Shopify

---

## Group C: Sage X3 Integration (Agent 3)

### SQL Scripts
| ID | Task | Effort |
|----|------|--------|
| P3-040 | Create `/SQL/V1.0.0.4/07-create-x3-mapping-tables.sql` | Small |

### Backend - Models
| ID | Task | Effort |
|----|------|--------|
| P3-041 | Create `backend/app/models/integrations/sage_x3.py` | Small |
| P3-042 | Add X3CustomerMap model | Small |
| P3-043 | Add X3ProductMap model | Small |

### Backend - Mapping Endpoints
| ID | Task | Effort |
|----|------|--------|
| P3-044 | Create `backend/app/api/v1/integrations/x3_mapping.py` | Medium |
| P3-045 | Implement `GET /integrations/x3/customer-mappings` | Small |
| P3-046 | Implement `POST /integrations/x3/customer-mappings` | Small |
| P3-047 | Implement `GET /integrations/x3/product-mappings` | Small |
| P3-048 | Implement `POST /integrations/x3/product-mappings` | Small |
| P3-049 | Implement bulk import for mappings | Medium |

### Backend - Export Service
| ID | Task | Effort |
|----|------|--------|
| P3-050 | Create `backend/app/services/x3_export_service.py` | Large |
| P3-051 | Implement export_invoices_to_x3() (ZIP with CSV) | Large |
| P3-052 | Implement export_payments_to_x3() (CSV) | Medium |
| P3-053 | Create CSV templates (X3_SIH_H, X3_SIH_L, X3_PAY) | Medium |

### Backend - Export Endpoints
| ID | Task | Effort |
|----|------|--------|
| P3-054 | Create `backend/app/api/v1/accounting/x3_export.py` | Small |
| P3-055 | Implement `GET /accounting/export/x3/invoices` | Medium |
| P3-056 | Implement `GET /accounting/export/x3/payments` | Small |

**Acceptance Criteria:**
- [ ] Customer/product mappings CRUD works
- [ ] Invoice export generates correct CSV format
- [ ] Payment export generates correct CSV format
- [ ] ZIP download works

---

## Group D: SuperPDP + Frontend (Agent 4)

### SQL Scripts
| ID | Task | Effort |
|----|------|--------|
| P3-057 | Create `/SQL/V1.0.0.4/08-create-einvoice-table.sql` | Small |

### Backend - SuperPDP
| ID | Task | Effort |
|----|------|--------|
| P3-058 | Create `backend/app/models/integrations/superpdp.py` (EInvoice) | Small |
| P3-059 | Create `backend/app/integrations/superpdp/__init__.py` | Small |
| P3-060 | Create `backend/app/integrations/superpdp/client.py` (stub) | Medium |
| P3-061 | Implement send_invoice() (stub) | Small |
| P3-062 | Implement poll_status() (stub) | Small |
| P3-063 | Create `backend/app/services/einvoice_service.py` | Medium |
| P3-064 | Add `POST /api/v1/invoices/{id}/send-einvoice` endpoint | Small |

### Frontend - Shopify
| ID | Task | Effort |
|----|------|--------|
| P3-065 | Create `/integrations/shopify` page (store list) | Medium |
| P3-066 | Create `/integrations/shopify/{id}` page (store detail) | Large |
| P3-067 | Add location mapping table | Medium |
| P3-068 | Add webhook events table | Medium |
| P3-069 | Add "Connect Store" button | Small |

### Frontend - Sage X3
| ID | Task | Effort |
|----|------|--------|
| P3-070 | Create `/integrations/x3/mappings` page | Medium |
| P3-071 | Add customer mapping table | Medium |
| P3-072 | Add product mapping table | Medium |
| P3-073 | Update `/accounting/export` page with X3 export buttons | Medium |

### Frontend - SuperPDP
| ID | Task | Effort |
|----|------|--------|
| P3-074 | Add "Send E-Invoice" button to invoice detail page | Small |
| P3-075 | Add e-invoice status indicator | Small |

**Acceptance Criteria:**
- [ ] Shopify UI shows connected stores
- [ ] X3 mapping UI works
- [ ] Export buttons download files
- [ ] E-invoice button sends to SuperPDP (stub)

---

## SQL Scripts Summary

| Script | Tables Created |
|--------|---------------|
| `06-create-shopify-tables.sql` | TM_INT_ShopifyStore, TM_INT_ShopifyLocationMap, TM_INT_ShopifySyncCursor, TM_INT_ShopifyWebhookEvent |
| `07-create-x3-mapping-tables.sql` | TM_INT_X3CustomerMap, TM_INT_X3ProductMap |
| `08-create-einvoice-table.sql` | TM_INT_EInvoice |

---

## Environment Variables Required

```bash
# Shopify
SHOPIFY_APP_KEY=<your_app_key>
SHOPIFY_APP_SECRET=<your_app_secret>
SHOPIFY_SCOPES=read_orders,write_orders,read_customers,read_products,read_inventory,write_inventory,read_locations
SHOPIFY_WEBHOOK_SECRET=<your_webhook_secret>
SHOPIFY_API_VERSION=2024-01

# Sage X3
X3_EXPORT_PATH=/app/exports

# SuperPDP
SUPERPDP_BASE_URL=https://api.superpdp.com
SUPERPDP_API_KEY=<your_api_key>
SUPERPDP_ENVIRONMENT=sandbox
```

---

## Unit Tests Required

| Test | Location |
|------|----------|
| Shopify HMAC verification | `tests/integrations/test_shopify_hmac.py` |
| Shopify webhook idempotency | `tests/integrations/test_shopify_webhooks.py` |
| X3 CSV export format | `tests/integrations/test_x3_export.py` |
| Order sync logic | `tests/integrations/test_shopify_sync.py` |

---

**Last Updated**: 2026-01-31
