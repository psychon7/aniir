# Prompt 3 - Integrations: Shopify Multi-Store + Sage X3 + SuperPDP

## Metadata

| Property | Value |
|----------|-------|
| **Prompt Number** | 3 of 3 |
| **Title** | External System Integrations |
| **Estimated Time** | 90-120 minutes (AI generation) |
| **Dependencies** | Prompts 1 and 2 must be completed and tested |
| **Status** | 🔴 Not Started |

## ⚠️ CRITICAL: SQL Server Approach

This prompt adds integration tables to the **EXISTING SQL Server database**.

**Rules:**
1. **New integration tables** - Use `TM_INT_` prefix for integration master data
2. **Column naming** - Follow existing pattern: `[prefix]_[field_name]`
3. **NO Alembic migrations** - Add new tables via SQL scripts in `/SQL/V1.0.0.4/`
4. **Foreign keys** - Reference existing tables (e.g., `TM_CLI_Client`, `TM_PRD_Product`)

## Key Deliverables Checklist

### Shopify Integration
- [ ] TM_INT_ShopifyStore, TM_INT_ShopifyLocationMap, TM_INT_ShopifySyncCursor, TM_INT_ShopifyWebhookEvent models
- [ ] OAuth install flow (install + callback endpoints)
- [ ] GraphQL client with retry and rate limiting
- [ ] Webhook controller with HMAC verification
- [ ] Webhook event processing (orders, refunds, inventory)
- [ ] Order sync (Shopify → CRM, create TM_ORD_ClientOrder)
- [ ] Inventory sync (CRM → Shopify)
- [ ] Multi-store support (one per Business Unit)
- [ ] Location mapping (Shopify locations → TM_WH_Warehouse)
- [ ] Idempotency handling
- [ ] Admin endpoints (list stores, test connection, manual sync)
- [ ] UI pages (store list, store detail, webhook logs)
- [ ] Documentation (setup guide, webhook registration)

### Sage X3 Integration
- [ ] TM_INT_X3CustomerMap, TM_INT_X3ProductMap models
- [ ] Mapping UI (TM_CLI_Client → BPCORD, TM_PRD_Product → ITMREF)
- [ ] Invoice export service (CSV generation from TM_INV_ClientInvoice)
- [ ] Payment export service (CSV generation from TM_PAY_Payment)
- [ ] Export endpoints (invoices, payments)
- [ ] CSV templates (X3_SIH_H, X3_SIH_L, X3_PAY)
- [ ] UI pages (mappings, export)

### SuperPDP E-Invoicing Integration
- [ ] TM_INT_EInvoice model
- [ ] SuperPDP client (stub implementation, ready for real API)
- [ ] Send invoice endpoint
- [ ] Poll status endpoint
- [ ] UI button (send e-invoice on invoice detail page)

## Prerequisites

Before running this prompt, ensure:
- [ ] Prompts 1 and 2 are completed and tested
- [ ] All features from Prompt 2 are working
- [ ] You have Shopify app credentials (or can create test app)
- [ ] You understand Sage X3 CSV import format
- [ ] You have SuperPDP API documentation (or will use stub)

## Dependencies

This prompt extends the codebase from Prompts 1 and 2. Do NOT restart or recreate the project.

---

## Full Prompt Text

Continue from the existing FastAPI + React monorepo (do NOT restart).

**CONTEXT**: You are completing the production ERP system refactor by adding external integrations. All existing functionality from Prompts 1 and 2 must remain intact.

Now implement integrations with Shopify, Sage X3, and SuperPDP.

========================
PART 1 — SHOPIFY INTEGRATION (MANDATORY, COMPLETE)
========================

**Goal:**
Connect multiple Shopify stores (one per business unit/brand) to the CRM. Sync orders → sales orders/invoices, sync inventory from CRM → Shopify, handle webhooks securely.

**Tech:**
- Shopify Admin API (GraphQL)
- OAuth install flow
- Webhook verification (HMAC)
- Celery tasks for async processing
- httpx for async HTTP requests

### A) DATA MODELS

SQL Script (`/SQL/V1.0.0.4/06-create-shopify-tables.sql`):
```sql
-- Shopify store connections (one per Business Unit)
CREATE TABLE TM_INT_ShopifyStore (
    shs_id INT IDENTITY(1,1) PRIMARY KEY,
    shs_soc_id INT NOT NULL FOREIGN KEY REFERENCES TR_SOC_Society(soc_id),
    shs_bu_id INT NOT NULL FOREIGN KEY REFERENCES TR_BU_BusinessUnit(bu_id),
    shs_shop_domain NVARCHAR(255) NOT NULL UNIQUE,
    shs_access_token NVARCHAR(500) NOT NULL,  -- Encrypt at rest
    shs_api_version NVARCHAR(20) DEFAULT '2024-01',
    shs_is_active BIT DEFAULT 1,
    shs_created_at DATETIME DEFAULT GETDATE(),
    shs_updated_at DATETIME NULL
);

-- Map Shopify locations to CRM warehouses
CREATE TABLE TM_INT_ShopifyLocationMap (
    slm_id INT IDENTITY(1,1) PRIMARY KEY,
    slm_shs_id INT NOT NULL FOREIGN KEY REFERENCES TM_INT_ShopifyStore(shs_id),
    slm_shopify_location_id NVARCHAR(100) NOT NULL,
    slm_wh_id INT NOT NULL FOREIGN KEY REFERENCES TR_WH_Warehouse(wh_id),
    CONSTRAINT UQ_ShopifyLocation UNIQUE (slm_shs_id, slm_shopify_location_id)
);

-- Sync cursors for incremental sync
CREATE TABLE TM_INT_ShopifySyncCursor (
    ssc_id INT IDENTITY(1,1) PRIMARY KEY,
    ssc_shs_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES TM_INT_ShopifyStore(shs_id),
    ssc_last_orders_sync_at DATETIME NULL,
    ssc_last_inventory_sync_at DATETIME NULL,
    ssc_last_products_sync_at DATETIME NULL
);

-- Webhook events for idempotency and debugging
CREATE TABLE TM_INT_ShopifyWebhookEvent (
    swe_id INT IDENTITY(1,1) PRIMARY KEY,
    swe_shs_id INT NOT NULL FOREIGN KEY REFERENCES TM_INT_ShopifyStore(shs_id),
    swe_topic NVARCHAR(100) NOT NULL,  -- orders/create, orders/paid, etc.
    swe_shopify_id NVARCHAR(100) NOT NULL,
    swe_payload NVARCHAR(MAX) NOT NULL,  -- JSON
    swe_status NVARCHAR(20) DEFAULT 'PENDING',  -- PENDING, PROCESSING, COMPLETED, FAILED
    swe_error_message NVARCHAR(MAX) NULL,
    swe_received_at DATETIME DEFAULT GETDATE(),
    swe_processed_at DATETIME NULL,
    CONSTRAINT UQ_WebhookEvent UNIQUE (swe_shs_id, swe_topic, swe_shopify_id)
);
CREATE INDEX IX_WebhookEvent_Status ON TM_INT_ShopifyWebhookEvent(swe_status);
```

Models (backend/app/models/integrations/shopify.py):
```python
class ShopifyStore(Base):
    __tablename__ = "TM_INT_ShopifyStore"
    shs_id = Column(Integer, primary_key=True)
    shs_soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    shs_bu_id = Column(Integer, ForeignKey("TR_BU_BusinessUnit.bu_id"), nullable=False)
    shs_shop_domain = Column(String(255), unique=True, nullable=False)
    shs_access_token = Column(String(500), nullable=False)
    shs_api_version = Column(String(20), default="2024-01")
    shs_is_active = Column(Boolean, default=True)
    shs_created_at = Column(DateTime, server_default=func.now())
    shs_updated_at = Column(DateTime, onupdate=func.now())

class ShopifyLocationMap(Base):
    __tablename__ = "TM_INT_ShopifyLocationMap"
    slm_id = Column(Integer, primary_key=True)
    slm_shs_id = Column(Integer, ForeignKey("TM_INT_ShopifyStore.shs_id"), nullable=False)
    slm_shopify_location_id = Column(String(100), nullable=False)
    slm_wh_id = Column(Integer, ForeignKey("TR_WH_Warehouse.wh_id"), nullable=False)

class ShopifySyncCursor(Base):
    __tablename__ = "TM_INT_ShopifySyncCursor"
    ssc_id = Column(Integer, primary_key=True)
    ssc_shs_id = Column(Integer, ForeignKey("TM_INT_ShopifyStore.shs_id"), unique=True)
    ssc_last_orders_sync_at = Column(DateTime)
    ssc_last_inventory_sync_at = Column(DateTime)
    ssc_last_products_sync_at = Column(DateTime)

class ShopifyWebhookEvent(Base):
    __tablename__ = "TM_INT_ShopifyWebhookEvent"
    swe_id = Column(Integer, primary_key=True)
    swe_shs_id = Column(Integer, ForeignKey("TM_INT_ShopifyStore.shs_id"), nullable=False)
    swe_topic = Column(String(100), nullable=False)
    swe_shopify_id = Column(String(100), nullable=False)
    swe_payload = Column(Text, nullable=False)  # JSON
    swe_status = Column(String(20), default="PENDING")
    swe_error_message = Column(Text)
    swe_received_at = Column(DateTime, server_default=func.now())
    swe_processed_at = Column(DateTime)
```

### B) BACKEND MODULES

1. **OAuth Controller** (backend/app/api/v1/integrations/shopify_oauth.py):

```python
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
import hmac
import hashlib

router = APIRouter(prefix="/integrations/shopify", tags=["Shopify OAuth"])

@router.get("/install")
async def install_shopify_store(
    shop: str = Query(..., description="Shop domain (e.g., mystore.myshopify.com)")
):
    """
    Initiate Shopify OAuth flow.
    Redirects to Shopify authorization page.
    """
    # Build authorization URL with scopes
    scopes = settings.SHOPIFY_SCOPES
    redirect_uri = f"{settings.API_BASE_URL}/integrations/shopify/callback"
    state = generate_random_state()  # Store in Redis with expiry
    
    auth_url = (
        f"https://{shop}/admin/oauth/authorize?"
        f"client_id={settings.SHOPIFY_APP_KEY}&"
        f"scope={scopes}&"
        f"redirect_uri={redirect_uri}&"
        f"state={state}"
    )
    
    return RedirectResponse(url=auth_url)

@router.get("/callback")
async def shopify_oauth_callback(
    code: str = Query(...),
    hmac: str = Query(...),
    shop: str = Query(...),
    state: str = Query(...)
):
    """
    Handle Shopify OAuth callback.
    Verify HMAC, exchange code for access token, store in database.
    """
    # 1. Verify HMAC
    if not verify_shopify_hmac(request.query_params, settings.SHOPIFY_APP_SECRET):
        raise HTTPException(status_code=400, detail="Invalid HMAC")
    
    # 2. Verify state (check Redis)
    if not verify_state(state):
        raise HTTPException(status_code=400, detail="Invalid state")
    
    # 3. Exchange code for access token
    access_token = await exchange_code_for_token(shop, code)
    
    # 4. Store in database
    store = await create_shopify_store(shop, access_token)
    
    # 5. Register webhooks
    await register_webhooks(store.id)
    
    return {"message": "Store connected successfully", "store_id": str(store.id)}
```

---

========================
PART 2 — SAGE X3 INTEGRATION (MANDATORY)
========================

**Goal:**
Export invoices and payments to Sage X3 via CSV import templates. This is a one-way export (CRM → Sage X3).

### A) DATA MODELS

SQL Script (`/SQL/V1.0.0.4/07-create-x3-mapping-tables.sql`):
```sql
-- Map CRM clients to Sage X3 customer codes
CREATE TABLE TM_INT_X3CustomerMap (
    xcm_id INT IDENTITY(1,1) PRIMARY KEY,
    xcm_cli_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES TM_CLI_Client(cli_id),
    xcm_bpcord NVARCHAR(50) NOT NULL,  -- Sage X3 customer code
    xcm_salfcy NVARCHAR(20) NULL,  -- Sage X3 sales site (optional)
    xcm_created_at DATETIME DEFAULT GETDATE()
);

-- Map CRM products to Sage X3 item references
CREATE TABLE TM_INT_X3ProductMap (
    xpm_id INT IDENTITY(1,1) PRIMARY KEY,
    xpm_prd_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES TM_PRD_Product(prd_id),
    xpm_itmref NVARCHAR(50) NOT NULL,  -- Sage X3 item reference
    xpm_created_at DATETIME DEFAULT GETDATE()
);
```

Models (backend/app/models/integrations/sage_x3.py):
```python
class X3CustomerMap(Base):
    __tablename__ = "TM_INT_X3CustomerMap"
    xcm_id = Column(Integer, primary_key=True)
    xcm_cli_id = Column(Integer, ForeignKey("TM_CLI_Client.cli_id"), unique=True)
    xcm_bpcord = Column(String(50), nullable=False)
    xcm_salfcy = Column(String(20))
    xcm_created_at = Column(DateTime, server_default=func.now())

class X3ProductMap(Base):
    __tablename__ = "TM_INT_X3ProductMap"
    xpm_id = Column(Integer, primary_key=True)
    xpm_prd_id = Column(Integer, ForeignKey("TM_PRD_Product.prd_id"), unique=True)
    xpm_itmref = Column(String(50), nullable=False)
    xpm_created_at = Column(DateTime, server_default=func.now())
```

### B) BACKEND SERVICES

1. **Mapping Endpoints** (backend/app/api/v1/integrations/x3_mapping.py):
```python
@router.get("/customer-mappings")
async def list_customer_mappings(db: Session = Depends(get_db))

@router.post("/customer-mappings")
async def create_customer_mapping(mapping: X3CustomerMapCreate, db: Session = Depends(get_db))

@router.get("/product-mappings")
async def list_product_mappings(db: Session = Depends(get_db))

@router.post("/product-mappings")
async def create_product_mapping(mapping: X3ProductMapCreate, db: Session = Depends(get_db))
```

2. **Export Service** (backend/app/services/x3_export_service.py):
```python
class X3ExportService:
    async def export_invoices_to_x3(
        self,
        from_date: date,
        to_date: date,
        soc_id: Optional[int] = None,
        bu_id: Optional[int] = None
    ) -> bytes:
        """
        Generate ZIP file with:
        - X3_SIH_H.csv (invoice headers)
        - X3_SIH_L.csv (invoice lines)
        """
        
    async def export_payments_to_x3(
        self,
        from_date: date,
        to_date: date
    ) -> bytes:
        """Generate X3_PAY.csv (payments)"""
```

3. **Export Endpoints** (backend/app/api/v1/accounting/x3_export.py):
```python
@router.get("/export/x3/invoices")
async def export_invoices_to_x3(
    from_date: date,
    to_date: date,
    soc_id: Optional[int] = None,
    bu_id: Optional[int] = None
):
    """Returns ZIP file with X3_SIH_H.csv and X3_SIH_L.csv"""

@router.get("/export/x3/payments")
async def export_payments_to_x3(from_date: date, to_date: date):
    """Returns X3_PAY.csv"""
```

### C) CSV TEMPLATES

**X3_SIH_H.csv** (Invoice Headers):
```
SALFCY,BPCORD,NUM,INVDAT,INVTYP,CUR,AMTATI,AMTNOTAX
```

**X3_SIH_L.csv** (Invoice Lines):
```
SALFCY,NUM,ITMREF,QTY,GROPRI,DISCRGVAL1,TAXCOD
```

**X3_PAY.csv** (Payments):
```
BPCORD,PAYDAT,PAYAMT,PAYMTH,PAYREF
```

### D) FRONTEND UI

- `/integrations/x3/mappings` - Customer and product mapping tables
- `/accounting/export` - Date range picker + export buttons

---

========================
PART 3 — SUPERPDP E-INVOICING (STUB, WIRED)
========================

**Goal:**
Integrate with SuperPDP for French e-invoicing compliance. This is a stub implementation ready for the real API.

### A) DATA MODEL

SQL Script (`/SQL/V1.0.0.4/08-create-einvoice-table.sql`):
```sql
CREATE TABLE TM_INT_EInvoice (
    ein_id INT IDENTITY(1,1) PRIMARY KEY,
    ein_inv_id INT NOT NULL FOREIGN KEY REFERENCES TM_INV_ClientInvoice(inv_id),
    ein_provider NVARCHAR(50) DEFAULT 'superpdp',
    ein_provider_ref NVARCHAR(100) NULL,  -- SuperPDP reference
    ein_status NVARCHAR(20) DEFAULT 'PENDING',  -- PENDING, SENT, ACCEPTED, REJECTED, ERROR
    ein_payload NVARCHAR(MAX) NULL,  -- JSON request payload
    ein_error_message NVARCHAR(MAX) NULL,
    ein_sent_at DATETIME NULL,
    ein_updated_at DATETIME NULL
);
CREATE INDEX IX_EInvoice_Invoice ON TM_INT_EInvoice(ein_inv_id);
CREATE INDEX IX_EInvoice_Status ON TM_INT_EInvoice(ein_status);
```

Model (backend/app/models/integrations/superpdp.py):
```python
class EInvoice(Base):
    __tablename__ = "TM_INT_EInvoice"
    ein_id = Column(Integer, primary_key=True)
    ein_inv_id = Column(Integer, ForeignKey("TM_INV_ClientInvoice.inv_id"))
    ein_provider = Column(String(50), default="superpdp")
    ein_provider_ref = Column(String(100))
    ein_status = Column(String(20), default="PENDING")
    ein_payload = Column(Text)
    ein_error_message = Column(Text)
    ein_sent_at = Column(DateTime)
    ein_updated_at = Column(DateTime)
```

### B) BACKEND

1. **SuperPDP Client** (backend/app/integrations/superpdp/client.py):
```python
class SuperPDPClient:
    """Stub implementation - replace with real API calls"""
    
    async def send_invoice(self, invoice_id: int) -> str:
        """Send invoice to SuperPDP. Returns provider_ref."""
        # STUB: Return mock reference
        return f"SPDP-{invoice_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    async def poll_status(self, provider_ref: str) -> str:
        """Poll invoice status. Returns status."""
        # STUB: Return mock status
        return "ACCEPTED"
```

2. **Service** (backend/app/services/einvoice_service.py):
```python
class EInvoiceService:
    async def send_invoice_to_superpdp(self, invoice_id: int) -> EInvoice:
        # Create EInvoice record
        # Call SuperPDPClient.send_invoice
        # Update record with provider_ref
        
    async def poll_einvoice_status(self, einvoice_id: int) -> EInvoice:
        # Call SuperPDPClient.poll_status
        # Update record with status
```

3. **Endpoint** (backend/app/api/v1/invoices/einvoice.py):
```python
@router.post("/{invoice_id}/send-einvoice")
async def send_einvoice(invoice_id: int, db: Session = Depends(get_db))
```

### C) CONFIGURATION

Add to `backend/.env.example`:
```bash
# SuperPDP E-Invoicing
SUPERPDP_BASE_URL=https://api.superpdp.com
SUPERPDP_API_KEY=<your_api_key>
SUPERPDP_ENVIRONMENT=sandbox  # sandbox or production
```

### D) FRONTEND

Add "Send E-Invoice" button on invoice detail page (`frontend/src/routes/invoices/$invoiceId.tsx`).

---

========================
DELIVERABLES
========================

1. Provide FULL updated file tree
2. Provide FULL code for all new/modified files
3. Update README with integration setup instructions
4. Include SQL scripts in `/SQL/V1.0.0.4/`
5. Include unit tests for:
   - Shopify HMAC verification
   - Shopify webhook idempotency
   - X3 CSV export format
6. Include example .env variables

STOP after implementing these integrations.

Output format: File tree first, then full code for each file.
