# Prompt 1 - Foundation: FastAPI + SQL Server Backend Only

## Metadata

| Property | Value |
|----------|-------|
| **Prompt Number** | 1 of 3 |
| **Title** | FastAPI Backend with SQL Server Connection |
| **Estimated Time** | 4-5 hours (10 parallel agents) |
| **Dependencies** | None (this is the first prompt) |
| **Status** | 🔴 Not Started |

## 🎯 Key Approach: FastAPI + SQL Server (Keep Existing DB & Frontend)

**CRITICAL DECISIONS:**
1. **Database**: Connect to **existing SQL Server** - NO PostgreSQL migration
2. **Frontend**: **Keep existing React/Vite app** at `../frontend/` - NO rebuild
3. **Backend Only**: This prompt creates ONLY the FastAPI backend

## Key Deliverables Checklist

- [ ] FastAPI backend project structure
- [ ] Docker Compose configuration (SQL Server, Redis, MinIO, Celery)
- [ ] SQLAlchemy 2.0 setup with SQL Server (pyodbc/aioodbc)
- [ ] JWT authentication with refresh tokens
- [ ] All 67+ database models mapped to existing SQL Server tables
- [ ] All REST API endpoints matching existing frontend expectations
- [ ] Audit logging middleware
- [ ] README with local development instructions
- [ ] .env.example for backend

**NOT in this prompt:**
- ❌ Frontend (already exists at `../frontend/`)
- ❌ Alembic migrations (using existing schema)
- ❌ New database tables (connecting to existing)

## Prerequisites

Before running this prompt, review:
- `../frontend/DOCUMENTATION/03-DATABASE-SCHEMA.md` - All 67+ table schemas
- `../frontend/DOCUMENTATION/04-BUSINESS-LOGIC.md` - Business rules
- `../frontend/DOCUMENTATION/02-REST-API-MIGRATION.md` - API endpoint specs
- `../frontend/src/api/` - Existing frontend API client expectations

## Critical Requirements

⚠️ **IMPORTANT**: This is a REFACTOR connecting to an EXISTING database.

### Database: SQL Server (NO Migration)
1. **Connect to existing SQL Server database** - ERP_ECOLED
2. **Use exact table names** - TM_CLI_Client, TR_STA_Status, etc.
3. **Use exact column names** - cli_id, cli_company_name, etc.
4. **NO schema changes** - Just map existing tables to SQLAlchemy models
5. **NO Alembic migrations** - Database schema already exists

### Frontend: Keep Existing (NO Changes)
The frontend at `../frontend/` is production-ready. Only update:
- `../frontend/src/api/client.ts` - Change base URL to FastAPI backend

---

## Full Prompt Text

You are a senior Python backend engineer. Create a FastAPI backend that connects to an **existing SQL Server database** for a CRM/ERP application.

**CRITICAL CONTEXT**: 
- The database already exists with 67+ tables and production data
- The frontend already exists at `../frontend/` (React + Vite)
- You are ONLY creating the backend API layer

### Reference Documents
- `../frontend/DOCUMENTATION/03-DATABASE-SCHEMA.md` - Database schema
- `../frontend/DOCUMENTATION/02-REST-API-MIGRATION.md` - API endpoint specs

---

## Tech Stack (MANDATORY)

**BACKEND:**
- FastAPI 0.109+ (Python 3.11+)
- SQLAlchemy 2.0 (with pyodbc for SQL Server)
- Pydantic v2 (validation)
- **SQL Server** (existing database - NO PostgreSQL!)
- pyodbc + aioodbc (SQL Server drivers)
- Redis 7 (caching, token blacklist)
- Celery + Celery Beat (background jobs)
- python-jose (JWT)
- passlib + bcrypt (password hashing)
- httpx (async HTTP client)
- python-multipart (file uploads)
- loguru (logging)
- Poetry (dependency management)

**INFRASTRUCTURE:**
- Docker Compose (SQL Server, Redis, MinIO, Celery worker, Celery beat)
- MinIO (S3-compatible storage for dev)

---

## Project Structure

```
ERP2025/
├── backend/                    # NEW: FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app entry
│   │   ├── config.py          # Settings (pydantic-settings)
│   │   ├── database.py        # SQLAlchemy + SQL Server setup
│   │   ├── dependencies.py    # FastAPI dependencies
│   │   ├── models/            # SQLAlchemy models (MAP EXISTING TABLES)
│   │   │   ├── __init__.py
│   │   │   ├── base.py        # Base model class
│   │   │   ├── reference.py   # TR_* tables (16 tables)
│   │   │   └── master.py      # TM_* tables (49+ tables)
│   │   ├── schemas/           # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── client.py
│   │   │   ├── product.py
│   │   │   ├── quote.py
│   │   │   ├── order.py
│   │   │   ├── invoice.py
│   │   │   └── common.py      # Pagination, responses
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py  # Main router
│   │   │       ├── auth.py
│   │   │       ├── clients.py
│   │   │       ├── products.py
│   │   │       ├── quotes.py
│   │   │       ├── orders.py
│   │   │       ├── invoices.py
│   │   │       ├── deliveries.py
│   │   │       ├── suppliers.py
│   │   │       ├── warehouse.py
│   │   │       ├── logistics.py
│   │   │       ├── users.py
│   │   │       └── lookups.py # All reference data endpoints
│   │   ├── services/          # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── client_service.py
│   │   │   ├── product_service.py
│   │   │   └── ...
│   │   ├── tasks/             # Celery tasks
│   │   │   ├── __init__.py
│   │   │   └── celery_app.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── jwt.py
│   │   │   ├── password.py
│   │   │   └── logger.py
│   │   └── middleware/
│   │       ├── __init__.py
│   │       └── audit.py
│   ├── tests/
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── .env.example
├── frontend/                   # EXISTING: Keep as-is
│   └── ... (already exists)
├── docker-compose.yml          # NEW: SQL Server + Redis + MinIO
└── README.md
```

---

## SQL Server Connection (CRITICAL)

### Connection String Format
```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # SQL Server connection
    MSSQL_SERVER: str = "localhost"
    MSSQL_PORT: int = 1433
    MSSQL_DATABASE: str = "ERP_ECOLED"
    MSSQL_USER: str = "sa"
    MSSQL_PASSWORD: str = ""
    
    @property
    def DATABASE_URL(self) -> str:
        return f"mssql+pyodbc://{self.MSSQL_USER}:{self.MSSQL_PASSWORD}@{self.MSSQL_SERVER}:{self.MSSQL_PORT}/{self.MSSQL_DATABASE}?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
```

### Database Setup
```python
# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine(settings.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## SQLAlchemy Models (CRITICAL - Map Existing Tables)

⚠️ **USE EXACT TABLE AND COLUMN NAMES FROM EXISTING DATABASE**

### Example: Client Model
```python
# models/master.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

class Client(Base):
    """Maps to existing TM_CLI_Client table - DO NOT change column names!"""
    __tablename__ = "TM_CLI_Client"
    
    # Primary key (existing)
    cli_id = Column(Integer, primary_key=True, autoincrement=True)
    
    # All existing columns (use EXACT names from database)
    cli_ref = Column(String(100), nullable=True)
    cli_company_name = Column(String(500), nullable=False)
    cli_first_name = Column(String(200), nullable=True)
    cli_last_name = Column(String(200), nullable=True)
    cli_address1 = Column(String(400), nullable=True)
    cli_address2 = Column(String(400), nullable=True)
    cli_postcode = Column(String(400), nullable=True)
    cli_city = Column(String(400), nullable=True)
    cli_phone = Column(String(200), nullable=True)
    cli_fax = Column(String(100), nullable=True)
    cli_cellphone = Column(String(200), nullable=True)
    cli_email = Column(String(1000), nullable=True)
    cli_vat_intra = Column(String(100), nullable=True)
    cli_siret = Column(String(100), nullable=True)
    cli_site = Column(String(200), nullable=True)
    cli_is_actived = Column(Boolean, default=True)
    
    # Foreign keys (existing)
    soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"))
    cou_id = Column(Integer, ForeignKey("TR_COU_Country.cou_id"))
    cty_id = Column(Integer, ForeignKey("TR_CTY_Client_Type.cty_id"))
    cur_id = Column(Integer, ForeignKey("TR_CUR_Currency.cur_id"))
    pmo_id = Column(Integer, ForeignKey("TR_PMO_Payment_Mode.pmo_id"))
    pco_id = Column(Integer, ForeignKey("TR_PCO_Payment_Condition.pco_id"))
    sta_id = Column(Integer, ForeignKey("TR_STA_Status.sta_id"))
    
    # Timestamps (existing)
    cli_create_date = Column(DateTime)
    cli_modify_date = Column(DateTime)
    
    # Relationships
    contacts = relationship("ClientContact", back_populates="client")
    society = relationship("Society")
    country = relationship("Country")
    status = relationship("Status")
```

### Reference Tables to Map (TR_*)

Map these 16 reference tables with EXACT names:
1. `TR_SOC_Society` - Organizations/Companies
2. `TR_BU_BusinessUnit` - Business Units (LED, DOMOTICS, etc.)
3. `TR_COU_Country` - Countries
4. `TR_CUR_Currency` - Currencies
5. `TR_VAT_VatRate` - VAT Rates
6. `TR_PAY_PaymentMode` - Payment Methods
7. `TR_PAY_PaymentTerm` - Payment Terms
8. `TR_STA_Status` - Statuses (generic)
9. `TR_CT_ClientType` - Client Types
10. `TR_CAT_Category` - Product Categories
11. `TR_BRA_Brand` - Brands
12. `TR_UOM_UnitOfMeasure` - Units of Measure
13. `TR_CAR_Carrier` - Shipping Carriers
14. `TR_WH_Warehouse` - Warehouses
15. `TR_ROL_Role` - User Roles
16. `TR_LAN_Language` - Languages

### Master Tables to Map (TM_*)

Map these key master tables with EXACT names:
1. `TM_USR_User` - Users
2. `TM_CLI_Client` - Clients
3. `TM_CLI_ClientContact` - Client Contacts
4. `TM_SUP_Supplier` - Suppliers
5. `TM_PRD_Product` - Products
6. `TM_PRD_ProductInstance` - Product Instances (serial tracked)
7. `TM_CP_CostPlan` - Quotes
8. `TM_CP_CostPlanLine` - Quote Lines
9. `TM_ORD_ClientOrder` - Orders
10. `TM_ORD_ClientOrderLine` - Order Lines
11. `TM_INV_ClientInvoice` - Invoices
12. `TM_INV_ClientInvoiceLine` - Invoice Lines
13. `TM_DEL_DeliveryForm` - Delivery Notes
14. `TM_DEL_DeliveryFormLine` - Delivery Lines
15. `TM_STK_Stock` - Stock Levels
16. `TM_STK_StockMovement` - Stock Movements
17. `TM_LOG_Shipment` - Shipments
18. `TM_PRJ_Project` - Projects

---

## API Response Format (Match Frontend Expectations)

The existing frontend expects these response formats:

### Paged Response
```python
# schemas/common.py
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar('T')

class PagedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T]
    page: int
    pageSize: int
    totalCount: int
    totalPages: int
    hasNextPage: bool
    hasPreviousPage: bool

class SingleResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: str = "Success"

class ErrorDetail(BaseModel):
    field: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: dict  # {code, message, details}
```

---

## API Endpoints (Match Frontend)

Create these endpoints matching `../frontend/DOCUMENTATION/02-REST-API-MIGRATION.md`:

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Clients
- `GET /api/clients` - List (paginated, searchable)
- `GET /api/clients/{id}` - Get one
- `POST /api/clients` - Create
- `PUT /api/clients/{id}` - Update
- `DELETE /api/clients/{id}` - Delete
- `GET /api/clients/{id}/contacts` - Get contacts
- `POST /api/clients/{id}/contacts` - Add contact
- `GET /api/clients/export` - Export CSV

### Products
- `GET /api/products` - List
- `GET /api/products/{id}` - Get one
- `POST /api/products` - Create
- `PUT /api/products/{id}` - Update
- `DELETE /api/products/{id}` - Delete
- `GET /api/products/{id}/instances` - Get instances
- `POST /api/products/{id}/instances` - Add instance

### Quotes
- `GET /api/quotes` - List
- `GET /api/quotes/{id}` - Get one with lines
- `POST /api/quotes` - Create
- `PUT /api/quotes/{id}` - Update
- `DELETE /api/quotes/{id}` - Delete
- `POST /api/quotes/{id}/lines` - Add line
- `PUT /api/quotes/{id}/lines/{lineId}` - Update line
- `DELETE /api/quotes/{id}/lines/{lineId}` - Delete line
- `POST /api/quotes/{id}/convert` - Convert to order

### Orders
- `GET /api/orders` - List
- `GET /api/orders/{id}` - Get one with lines
- `POST /api/orders` - Create
- `PUT /api/orders/{id}` - Update
- `PATCH /api/orders/{id}/status` - Update status

### Invoices
- `GET /api/invoices` - List
- `GET /api/invoices/{id}` - Get one
- `POST /api/invoices` - Create
- `POST /api/invoices/from-order/{orderId}` - Create from order
- `GET /api/invoices/{id}/pdf` - Get PDF

### Lookups (Reference Data)
- `GET /api/lookups/countries`
- `GET /api/lookups/currencies`
- `GET /api/lookups/vat-rates`
- `GET /api/lookups/payment-modes`
- `GET /api/lookups/payment-terms`
- `GET /api/lookups/statuses`
- `GET /api/lookups/business-units`
- `GET /api/lookups/client-types`
- `GET /api/lookups/categories`
- `GET /api/lookups/brands`
- `GET /api/lookups/warehouses`
- `GET /api/lookups/carriers`
- `GET /api/lookups/units-of-measure`

---

## Authentication (JWT)

```python
# utils/jwt.py
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.config import settings

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")

def create_refresh_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
```

---

## Docker Compose (SQL Server + Redis)

```yaml
# docker-compose.yml
version: '3.8'

services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: erp-sqlserver
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "${MSSQL_PASSWORD}"
      MSSQL_PID: "Developer"
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql
    networks:
      - erp-network

  redis:
    image: redis:7-alpine
    container_name: erp-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    networks:
      - erp-network

  minio:
    image: minio/minio:latest
    container_name: erp-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    networks:
      - erp-network

  backend:
    build: ./backend
    container_name: erp-backend
    environment:
      - MSSQL_SERVER=sqlserver
      - MSSQL_PORT=1433
      - MSSQL_DATABASE=ERP_ECOLED
      - MSSQL_USER=sa
      - MSSQL_PASSWORD=${MSSQL_PASSWORD}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "8000:8000"
    depends_on:
      - sqlserver
      - redis
    networks:
      - erp-network

  celery-worker:
    build: ./backend
    container_name: erp-celery-worker
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment:
      - MSSQL_SERVER=sqlserver
      - MSSQL_DATABASE=ERP_ECOLED
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
    depends_on:
      - backend
      - redis
    networks:
      - erp-network

volumes:
  sqlserver_data:
  minio_data:

networks:
  erp-network:
    driver: bridge
```

---

## Deliverables Checklist

1. **Files to Create:**
   - [ ] `backend/` folder with full FastAPI app
   - [ ] `backend/pyproject.toml` with dependencies
   - [ ] `backend/Dockerfile`
   - [ ] `backend/.env.example`
   - [ ] `docker-compose.yml`
   - [ ] `README.md` with setup instructions

2. **Models:**
   - [ ] All 16 reference tables (TR_*)
   - [ ] All 49+ master tables (TM_*)
   - [ ] Using EXACT table/column names

3. **API Endpoints:**
   - [ ] Auth (login, refresh, logout)
   - [ ] Clients CRUD
   - [ ] Products CRUD
   - [ ] Quotes CRUD + lines
   - [ ] Orders CRUD + lines
   - [ ] Invoices CRUD
   - [ ] Deliveries CRUD
   - [ ] Suppliers CRUD
   - [ ] Warehouse/Stock
   - [ ] Logistics
   - [ ] Lookups (all reference data)
   - [ ] Users CRUD

4. **Testing:**
   - [ ] SQL Server connection works
   - [ ] Can query existing data
   - [ ] JWT auth works
   - [ ] Existing frontend can connect

---

## Validation

Before marking complete:
- [ ] `docker-compose up` starts all services
- [ ] Backend connects to SQL Server
- [ ] Can read existing data from database
- [ ] JWT login/refresh works
- [ ] All CRUD endpoints return data
- [ ] Response format matches frontend expectations

**STOP** after backend is complete. Do NOT modify the frontend (except API base URL). Do NOT implement PDF, email, Shopify, or advanced features (those are in Prompt 2 and 3).
