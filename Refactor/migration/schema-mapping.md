# SQLAlchemy Model Mapping: SQL Server → FastAPI

## Overview

This document shows how to map **existing SQL Server tables** to **SQLAlchemy models** for FastAPI.

**CRITICAL**: 
- **NO database migration** - Connect directly to existing SQL Server
- **Use EXACT table names** - `TM_CLI_Client`, not `clients`
- **Use EXACT column names** - `cli_company_name`, not `company_name`
- **NO schema changes** - Read/write to existing tables as-is

## Mapping Strategy

### Key Principle: Direct Mapping

```python
# ✅ CORRECT - Use exact table and column names
class Client(Base):
    __tablename__ = "TM_CLI_Client"
    cli_id = Column(Integer, primary_key=True)
    cli_company_name = Column(String(500))

# ❌ WRONG - Don't rename tables or columns
class Client(Base):
    __tablename__ = "clients"  # WRONG!
    id = Column(Integer, primary_key=True)  # WRONG!
    company_name = Column(String(500))  # WRONG!
```

### SQLAlchemy Configuration for SQL Server

```python
# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Connection string for SQL Server
DATABASE_URL = "mssql+pyodbc://user:password@server:1433/ERP_ECOLED?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### Data Types Mapping

| SQL Server | SQLAlchemy | Notes |
|------------|------------|-------|
| int | Integer | |
| bigint | BigInteger | |
| nvarchar(n) | String(n) | |
| ntext | Text | |
| bit | Boolean | |
| datetime | DateTime | |
| decimal(p,s) | Numeric(p,s) | |
| float | Float | |

---

## Reference Tables (TR_*) - 16 Tables

### 1. TR_SOC_Society

```python
class Society(Base):
    __tablename__ = "TR_SOC_Society"
    
    soc_id = Column(Integer, primary_key=True)
    soc_society_name = Column(String(500))
    soc_short_label = Column(String(50))
    soc_is_actived = Column(Boolean, default=True)
    cur_id = Column(Integer, ForeignKey("TR_CUR_Currency.cur_id"))
    lng_id = Column(Integer, ForeignKey("TR_LAN_Language.lng_id"))
    soc_datebegin = Column(DateTime)
    soc_dateend = Column(DateTime)
    soc_address1 = Column(String(400))
    soc_address2 = Column(String(400))
    soc_postcode = Column(String(400))
    soc_city = Column(String(400))
    soc_tel = Column(String(200))
    soc_fax = Column(String(100))
    soc_cellphone = Column(String(200))
    soc_email = Column(String(1000))
    soc_siret = Column(String(100))
    soc_tva_intra = Column(String(100))
    soc_site = Column(String(200))
    soc_rib_name = Column(String(500))
    soc_rib_code_iban = Column(String(1000))
    soc_rib_code_bic = Column(String(1000))
```

---

### 2. TR_BU_BusinessUnit

```python
class BusinessUnit(Base):
    __tablename__ = "TR_BU_BusinessUnit"
    
    bu_id = Column(Integer, primary_key=True)
    bu_code = Column(String(20))
    bu_name = Column(String(100))
    bu_color_hex = Column(String(7))  # #3B82F6
    bu_is_active = Column(Boolean, default=True)
    bu_sort_order = Column(Integer, default=0)
```

---

### 3. TR_COU_Country

```python
class Country(Base):
    __tablename__ = "TR_COU_Country"
    
    cou_id = Column(Integer, primary_key=True)
    cou_code = Column(String(3))  # ISO code
    cou_name = Column(String(100))
    cou_is_active = Column(Boolean, default=True)
```

---

### 4. TR_CUR_Currency

```python
class Currency(Base):
    __tablename__ = "TR_CUR_Currency"
    
    cur_id = Column(Integer, primary_key=True)
    cur_code = Column(String(3))  # EUR, USD
    cur_name = Column(String(50))
    cur_symbol = Column(String(5))
    cur_decimal_places = Column(Integer, default=2)
    cur_is_active = Column(Boolean, default=True)
```

---

### 5. TR_VAT_VatRate

```python
class VatRate(Base):
    __tablename__ = "TR_VAT_VatRate"
    
    vat_id = Column(Integer, primary_key=True)
    vat_code = Column(String(20))
    vat_name = Column(String(50))
    vat_rate = Column(Numeric(5, 2))  # 20.00
    vat_is_default = Column(Boolean, default=False)
    vat_is_active = Column(Boolean, default=True)
```

---

### 6. TR_PAY_PaymentMode

```python
class PaymentMode(Base):
    __tablename__ = "TR_PAY_PaymentMode"
    
    pmo_id = Column(Integer, primary_key=True)
    pmo_code = Column(String(20))
    pmo_name = Column(String(50))
    pmo_is_active = Column(Boolean, default=True)
```

---

### 7. TR_PAY_PaymentTerm

```python
class PaymentTerm(Base):
    __tablename__ = "TR_PAY_PaymentTerm"
    
    pco_id = Column(Integer, primary_key=True)
    pco_code = Column(String(20))
    pco_name = Column(String(50))
    pco_days = Column(Integer)  # Net days
    pco_is_default = Column(Boolean, default=False)
    pco_is_active = Column(Boolean, default=True)
```

---

### 8. TR_STA_Status

```python
class Status(Base):
    __tablename__ = "TR_STA_Status"
    
    sta_id = Column(Integer, primary_key=True)
    sta_code = Column(String(20))
    sta_name = Column(String(50))
    sta_entity_type = Column(String(50))  # Client, Order, Invoice
    sta_color_hex = Column(String(7))
    sta_sort_order = Column(Integer, default=0)
    sta_is_active = Column(Boolean, default=True)
```

---

### 9. TR_CT_ClientType

```python
class ClientType(Base):
    __tablename__ = "TR_CT_ClientType"
    
    cty_id = Column(Integer, primary_key=True)
    cty_code = Column(String(20))
    cty_name = Column(String(50))
    cty_is_active = Column(Boolean, default=True)
```

---

### 10. TR_CAT_Category

```python
class Category(Base):
    __tablename__ = "TR_CAT_Category"
    
    cat_id = Column(Integer, primary_key=True)
    cat_code = Column(String(20))
    cat_name = Column(String(100))
    cat_parent_id = Column(Integer, ForeignKey("TR_CAT_Category.cat_id"))
    cat_is_active = Column(Boolean, default=True)
    
    # Self-referential relationship
    parent = relationship("Category", remote_side=[cat_id])
    children = relationship("Category", back_populates="parent")
```

---

### 11-16. Other Reference Tables

```python
class Brand(Base):
    __tablename__ = "TR_BRA_Brand"
    bra_id = Column(Integer, primary_key=True)
    bra_code = Column(String(20))
    bra_name = Column(String(100))
    bra_is_active = Column(Boolean, default=True)

class UnitOfMeasure(Base):
    __tablename__ = "TR_UOM_UnitOfMeasure"
    uom_id = Column(Integer, primary_key=True)
    uom_code = Column(String(10))
    uom_name = Column(String(50))
    uom_is_active = Column(Boolean, default=True)

class Carrier(Base):
    __tablename__ = "TR_CAR_Carrier"
    car_id = Column(Integer, primary_key=True)
    car_code = Column(String(20))
    car_name = Column(String(100))
    car_tracking_url = Column(String(500))
    car_is_active = Column(Boolean, default=True)

class Warehouse(Base):
    __tablename__ = "TR_WH_Warehouse"
    wh_id = Column(Integer, primary_key=True)
    wh_code = Column(String(20))
    wh_name = Column(String(100))
    wh_address = Column(String(200))
    wh_is_default = Column(Boolean, default=False)
    wh_is_active = Column(Boolean, default=True)

class Role(Base):
    __tablename__ = "TR_ROL_Role"
    rol_id = Column(Integer, primary_key=True)
    rol_code = Column(String(20))
    rol_name = Column(String(50))
    rol_permissions = Column(Text)  # JSON
    rol_is_active = Column(Boolean, default=True)

class Language(Base):
    __tablename__ = "TR_LAN_Language"
    lng_id = Column(Integer, primary_key=True)
    lng_code = Column(String(5))
    lng_name = Column(String(50))
    lng_is_active = Column(Boolean, default=True)
```

---

## Master Tables (TM_*) - Key Tables

### TM_USR_User

```python
class User(Base):
    __tablename__ = "TM_USR_User"
    
    usr_id = Column(Integer, primary_key=True)
    usr_username = Column(String(50), unique=True, nullable=False)
    usr_email = Column(String(100), nullable=False)
    usr_password_hash = Column(String(256), nullable=False)
    usr_first_name = Column(String(50))
    usr_last_name = Column(String(50))
    rol_id = Column(Integer, ForeignKey("TR_ROL_Role.rol_id"))
    bu_id = Column(Integer, ForeignKey("TR_BU_BusinessUnit.bu_id"))
    soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"))
    lng_id = Column(Integer, ForeignKey("TR_LAN_Language.lng_id"))
    usr_last_login = Column(DateTime)
    usr_is_active = Column(Boolean, default=True)
    usr_created_at = Column(DateTime)
    usr_updated_at = Column(DateTime)
    
    role = relationship("Role")
    business_unit = relationship("BusinessUnit")
    society = relationship("Society")
```

---

### TM_CLI_Client

```python
class Client(Base):
    __tablename__ = "TM_CLI_Client"
    
    cli_id = Column(Integer, primary_key=True)
    cli_ref = Column(String(20), unique=True)  # CLI-0001
    cli_company_name = Column(String(200), nullable=False)
    cli_first_name = Column(String(50))
    cli_last_name = Column(String(50))
    cli_email = Column(String(100))
    cli_phone = Column(String(30))
    cli_mobile = Column(String(30))
    cli_address1 = Column(String(200))
    cli_address2 = Column(String(200))
    cli_postcode = Column(String(20))
    cli_city = Column(String(100))
    cou_id = Column(Integer, ForeignKey("TR_COU_Country.cou_id"))
    cli_vat_number = Column(String(50))
    cli_siret = Column(String(50))
    cli_website = Column(String(200))
    cty_id = Column(Integer, ForeignKey("TR_CT_ClientType.cty_id"))
    sta_id = Column(Integer, ForeignKey("TR_STA_Status.sta_id"))
    cur_id = Column(Integer, ForeignKey("TR_CUR_Currency.cur_id"))
    pmo_id = Column(Integer, ForeignKey("TR_PAY_PaymentMode.pmo_id"))
    pco_id = Column(Integer, ForeignKey("TR_PAY_PaymentTerm.pco_id"))
    cli_credit_limit = Column(Numeric(18, 2))
    cli_discount = Column(Numeric(5, 2))
    bu_id = Column(Integer, ForeignKey("TR_BU_BusinessUnit.bu_id"))
    soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"))
    cli_notes = Column(Text)
    cli_is_active = Column(Boolean, default=True)
    cli_created_at = Column(DateTime)
    cli_updated_at = Column(DateTime)
    cli_created_by = Column(Integer, ForeignKey("TM_USR_User.usr_id"))
    
    # Relationships
    country = relationship("Country")
    client_type = relationship("ClientType")
    status = relationship("Status")
    currency = relationship("Currency")
    contacts = relationship("ClientContact", back_populates="client")
```

---

### TM_PRD_Product

```python
class Product(Base):
    __tablename__ = "TM_PRD_Product"
    
    prd_id = Column(Integer, primary_key=True)
    prd_ref = Column(String(50), unique=True)  # SKU
    prd_name = Column(String(200), nullable=False)
    prd_description = Column(Text)
    cat_id = Column(Integer, ForeignKey("TR_CAT_Category.cat_id"))
    bra_id = Column(Integer, ForeignKey("TR_BRA_Brand.bra_id"))
    uom_id = Column(Integer, ForeignKey("TR_UOM_UnitOfMeasure.uom_id"))
    prd_purchase_price = Column(Numeric(18, 4))
    prd_sale_price = Column(Numeric(18, 4))
    vat_id = Column(Integer, ForeignKey("TR_VAT_VatRate.vat_id"))
    prd_weight = Column(Numeric(10, 3))
    prd_image_url = Column(String(500))
    prd_barcode = Column(String(50))
    prd_min_stock = Column(Integer, default=0)
    bu_id = Column(Integer, ForeignKey("TR_BU_BusinessUnit.bu_id"))
    prd_is_serial_tracked = Column(Boolean, default=False)
    prd_is_active = Column(Boolean, default=True)
    prd_created_at = Column(DateTime)
    prd_updated_at = Column(DateTime)
    
    category = relationship("Category")
    brand = relationship("Brand")
    instances = relationship("ProductInstance", back_populates="product")
```

---

### TM_CP_CostPlan (Quote)

```python
class CostPlan(Base):
    __tablename__ = "TM_CP_CostPlan"
    
    cp_id = Column(Integer, primary_key=True)
    cp_ref = Column(String(20), unique=True)  # QUO-0001
    cli_id = Column(Integer, ForeignKey("TM_CLI_Client.cli_id"))
    cp_date = Column(DateTime, nullable=False)
    cp_valid_until = Column(DateTime)
    sta_id = Column(Integer, ForeignKey("TR_STA_Status.sta_id"))
    cur_id = Column(Integer, ForeignKey("TR_CUR_Currency.cur_id"))
    cp_subtotal = Column(Numeric(18, 2))
    cp_total_vat = Column(Numeric(18, 2))
    cp_total = Column(Numeric(18, 2))
    cp_discount = Column(Numeric(5, 2))
    cp_notes = Column(Text)
    bu_id = Column(Integer, ForeignKey("TR_BU_BusinessUnit.bu_id"))
    soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"))
    cp_created_by = Column(Integer, ForeignKey("TM_USR_User.usr_id"))
    cp_created_at = Column(DateTime)
    cp_updated_at = Column(DateTime)
    
    client = relationship("Client")
    status = relationship("Status")
    lines = relationship("CostPlanLine", back_populates="cost_plan")
```

---

### TM_ORD_ClientOrder

```python
class ClientOrder(Base):
    __tablename__ = "TM_ORD_ClientOrder"
    
    ord_id = Column(Integer, primary_key=True)
    ord_ref = Column(String(20), unique=True)  # ORD-0001
    cli_id = Column(Integer, ForeignKey("TM_CLI_Client.cli_id"))
    cp_id = Column(Integer, ForeignKey("TM_CP_CostPlan.cp_id"))  # Linked quote
    ord_date = Column(DateTime, nullable=False)
    ord_required_date = Column(DateTime)
    sta_id = Column(Integer, ForeignKey("TR_STA_Status.sta_id"))
    cur_id = Column(Integer, ForeignKey("TR_CUR_Currency.cur_id"))
    ord_shipping_address = Column(String(200))
    ord_shipping_city = Column(String(100))
    ord_shipping_postcode = Column(String(20))
    ord_subtotal = Column(Numeric(18, 2))
    ord_total_vat = Column(Numeric(18, 2))
    ord_total = Column(Numeric(18, 2))
    ord_paid_amount = Column(Numeric(18, 2), default=0)
    ord_discount = Column(Numeric(5, 2))
    ord_notes = Column(Text)
    bu_id = Column(Integer, ForeignKey("TR_BU_BusinessUnit.bu_id"))
    soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"))
    ord_created_by = Column(Integer, ForeignKey("TM_USR_User.usr_id"))
    ord_created_at = Column(DateTime)
    ord_updated_at = Column(DateTime)
    
    client = relationship("Client")
    quote = relationship("CostPlan")
    status = relationship("Status")
    lines = relationship("ClientOrderLine", back_populates="order")
```

---

### TM_INV_ClientInvoice

```python
class ClientInvoice(Base):
    __tablename__ = "TM_INV_ClientInvoice"
    
    inv_id = Column(Integer, primary_key=True)
    inv_ref = Column(String(20), unique=True)  # INV-0001
    cli_id = Column(Integer, ForeignKey("TM_CLI_Client.cli_id"))
    ord_id = Column(Integer, ForeignKey("TM_ORD_ClientOrder.ord_id"))
    inv_date = Column(DateTime, nullable=False)
    inv_due_date = Column(DateTime, nullable=False)
    sta_id = Column(Integer, ForeignKey("TR_STA_Status.sta_id"))
    cur_id = Column(Integer, ForeignKey("TR_CUR_Currency.cur_id"))
    inv_subtotal = Column(Numeric(18, 2))
    inv_total_vat = Column(Numeric(18, 2))
    inv_total = Column(Numeric(18, 2))
    inv_paid_amount = Column(Numeric(18, 2), default=0)
    inv_notes = Column(Text)
    inv_paid_at = Column(DateTime)
    bu_id = Column(Integer, ForeignKey("TR_BU_BusinessUnit.bu_id"))
    soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"))
    inv_created_by = Column(Integer, ForeignKey("TM_USR_User.usr_id"))
    inv_created_at = Column(DateTime)
    inv_updated_at = Column(DateTime)
    
    client = relationship("Client")
    order = relationship("ClientOrder")
    status = relationship("Status")
    lines = relationship("ClientInvoiceLine", back_populates="invoice")
```

---

## API Response Transformation

Since we use exact column names in models, transform to camelCase for API responses:

```python
# schemas/client.py
from pydantic import BaseModel, Field

class ClientResponse(BaseModel):
    id: int = Field(alias="cli_id")
    reference: str = Field(alias="cli_ref")
    companyName: str = Field(alias="cli_company_name")
    email: str | None = Field(alias="cli_email")
    phone: str | None = Field(alias="cli_phone")
    isActive: bool = Field(alias="cli_is_active")
    
    class Config:
        from_attributes = True
        populate_by_name = True
```

---

## No Migration Required

Since we connect directly to the existing SQL Server:

1. **No Alembic** - Don't use migrations
2. **No schema changes** - Tables already exist
3. **No data transformation** - Read existing data directly
4. **Existing relationships** - Foreign keys already in place

Just map the models and start querying!


