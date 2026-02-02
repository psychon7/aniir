# Database Schema Reference

> **Source**: Extracted from `frontend/DOCUMENTATION/03-DATABASE-SCHEMA.md`
> **Critical**: This is the EXISTING SQL Server schema. DO NOT MODIFY existing tables.

## Overview

- **Database**: SQL Server (existing, unchanged)
- **Tables**: 65+ total
- **Naming**: `TR_` = Reference/lookup, `TM_` = Master/transactional
- **IDs**: INT IDENTITY (not UUID)

---

## Reference Tables (TR_*) - 16 Tables

These are read-only lookup tables. Map 1:1 in SQLAlchemy.

### TR_BU_BusinessUnit
```sql
CREATE TABLE TR_BU_BusinessUnit (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    ColorHex NVARCHAR(7),          -- Theme color (#3B82F6)
    IsActive BIT DEFAULT 1,
    SortOrder INT DEFAULT 0
)
```
**Sample Data:** LED, DOMOTICS, HVAC, WAVE_CONCEPT, ACCESSORIES

### TR_COU_Country
```sql
CREATE TABLE TR_COU_Country (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(3) NOT NULL,      -- ISO code (FRA, DEU)
    Name NVARCHAR(100) NOT NULL,
    IsActive BIT DEFAULT 1
)
```

### TR_CUR_Currency
```sql
CREATE TABLE TR_CUR_Currency (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(3) NOT NULL,      -- ISO code (EUR, USD, GBP)
    Name NVARCHAR(50) NOT NULL,
    Symbol NVARCHAR(5) NOT NULL,    -- €, $, £
    DecimalPlaces INT DEFAULT 2,
    IsActive BIT DEFAULT 1
)
```

### TR_VAT_VatRate
```sql
CREATE TABLE TR_VAT_VatRate (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,     -- VAT20, VAT10, EXEMPT
    Name NVARCHAR(50) NOT NULL,
    Rate DECIMAL(5,2) NOT NULL,     -- 20.00, 10.00, 0.00
    IsDefault BIT DEFAULT 0,
    IsActive BIT DEFAULT 1
)
```

### TR_PAY_PaymentMode
```sql
CREATE TABLE TR_PAY_PaymentMode (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,     -- BANK, CARD, CHECK, CASH
    Name NVARCHAR(50) NOT NULL,
    IsActive BIT DEFAULT 1
)
```

### TR_PAY_PaymentTerm
```sql
CREATE TABLE TR_PAY_PaymentTerm (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,     -- NET30, NET60, IMMEDIATE
    Name NVARCHAR(50) NOT NULL,
    Days INT NOT NULL,              -- 30, 60, 0
    IsDefault BIT DEFAULT 0,
    IsActive BIT DEFAULT 1
)
```

### TR_STA_Status
```sql
CREATE TABLE TR_STA_Status (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,     -- ACTIVE, INACTIVE, PROSPECT
    Name NVARCHAR(50) NOT NULL,
    EntityType NVARCHAR(50),        -- Client, Order, Invoice (NULL = generic)
    ColorHex NVARCHAR(7),           -- Badge color
    SortOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1
)
```

### TR_CT_ClientType
```sql
CREATE TABLE TR_CT_ClientType (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,     -- RETAIL, WHOLESALE, DISTRIBUTOR
    Name NVARCHAR(50) NOT NULL,
    IsActive BIT DEFAULT 1
)
```

### TR_CAT_Category
```sql
CREATE TABLE TR_CAT_Category (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    ParentId INT NULL,              -- Self-reference for hierarchy
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (ParentId) REFERENCES TR_CAT_Category(Id)
)
```

### TR_BRA_Brand
```sql
CREATE TABLE TR_BRA_Brand (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    LogoUrl NVARCHAR(500),
    IsActive BIT DEFAULT 1
)
```

### TR_UOM_UnitOfMeasure
```sql
CREATE TABLE TR_UOM_UnitOfMeasure (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(10) NOT NULL,     -- PCS, KG, M, BOX
    Name NVARCHAR(50) NOT NULL,
    IsActive BIT DEFAULT 1
)
```

### TR_SOC_Society
```sql
CREATE TABLE TR_SOC_Society (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,
    Name NVARCHAR(100) NOT NULL,    -- ECOLED EUROPE, ECOLED ASIA
    Address NVARCHAR(200),
    City NVARCHAR(100),
    PostalCode NVARCHAR(20),
    CountryId INT,
    VatNumber NVARCHAR(50),
    Siret NVARCHAR(50),
    Phone NVARCHAR(30),
    Email NVARCHAR(100),
    LogoUrl NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (CountryId) REFERENCES TR_COU_Country(Id)
)
```

### TR_LAN_Language
```sql
CREATE TABLE TR_LAN_Language (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(5) NOT NULL,      -- fr, en, zh
    Name NVARCHAR(50) NOT NULL,
    IsActive BIT DEFAULT 1
)
```

### TR_CAR_Carrier
```sql
CREATE TABLE TR_CAR_Carrier (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,     -- DHL, UPS, FEDEX, TNT
    Name NVARCHAR(100) NOT NULL,
    TrackingUrlTemplate NVARCHAR(500), -- https://track.dhl.com/{trackingNumber}
    IsActive BIT DEFAULT 1
)
```

### TR_WH_Warehouse
```sql
CREATE TABLE TR_WH_Warehouse (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Address NVARCHAR(200),
    City NVARCHAR(100),
    CountryId INT,
    IsDefault BIT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (CountryId) REFERENCES TR_COU_Country(Id)
)
```

### TR_ROL_Role
```sql
CREATE TABLE TR_ROL_Role (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(20) NOT NULL,     -- ADMIN, SALES, WAREHOUSE, READONLY
    Name NVARCHAR(50) NOT NULL,
    Permissions NVARCHAR(MAX),      -- JSON array of permissions
    IsActive BIT DEFAULT 1
)
```

---

## Master Tables (TM_*) - 49+ Tables

### TM_USR_User
```sql
CREATE TABLE TM_USR_User (
    Id INT PRIMARY KEY IDENTITY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(256) NOT NULL,
    PasswordSalt NVARCHAR(256),
    FirstName NVARCHAR(50),
    LastName NVARCHAR(50),
    RoleId INT NOT NULL,
    BusinessUnitId INT,
    SocietyId INT,
    LanguageId INT,
    LastLoginAt DATETIME,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME,
    FOREIGN KEY (RoleId) REFERENCES TR_ROL_Role(Id),
    FOREIGN KEY (BusinessUnitId) REFERENCES TR_BU_BusinessUnit(Id),
    FOREIGN KEY (SocietyId) REFERENCES TR_SOC_Society(Id),
    FOREIGN KEY (LanguageId) REFERENCES TR_LAN_Language(Id)
)
```

### TM_USR_RefreshToken
```sql
CREATE TABLE TM_USR_RefreshToken (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL,
    Token NVARCHAR(256) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    RevokedAt DATETIME,
    ReplacedByToken NVARCHAR(256),
    FOREIGN KEY (UserId) REFERENCES TM_USR_User(Id)
)
```

### TM_CLI_Client
```sql
CREATE TABLE TM_CLI_Client (
    Id INT PRIMARY KEY IDENTITY,
    Reference NVARCHAR(20) NOT NULL UNIQUE,  -- CLI-0001
    CompanyName NVARCHAR(200) NOT NULL,
    FirstName NVARCHAR(50),
    LastName NVARCHAR(50),
    Email NVARCHAR(100),
    Phone NVARCHAR(30),
    Mobile NVARCHAR(30),
    Address NVARCHAR(200),
    Address2 NVARCHAR(200),
    PostalCode NVARCHAR(20),
    City NVARCHAR(100),
    CountryId INT,
    VatNumber NVARCHAR(50),
    Siret NVARCHAR(50),
    Website NVARCHAR(200),
    ClientTypeId INT,
    StatusId INT NOT NULL,
    CurrencyId INT,
    PaymentModeId INT,
    PaymentTermId INT,
    CreditLimit DECIMAL(18,2),
    Discount DECIMAL(5,2),
    BusinessUnitId INT,
    SocietyId INT,
    LanguageId INT,
    Notes NVARCHAR(MAX),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME,
    CreatedBy INT,
    UpdatedBy INT,
    -- Foreign Keys omitted for brevity
)
```

### TM_CLI_ClientContact
```sql
CREATE TABLE TM_CLI_ClientContact (
    Id INT PRIMARY KEY IDENTITY,
    ClientId INT NOT NULL,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100),
    Phone NVARCHAR(30),
    Mobile NVARCHAR(30),
    JobTitle NVARCHAR(100),
    Department NVARCHAR(100),
    IsPrimary BIT DEFAULT 0,
    Notes NVARCHAR(MAX),
    FOREIGN KEY (ClientId) REFERENCES TM_CLI_Client(Id) ON DELETE CASCADE
)
```

### TM_SUP_Supplier
```sql
CREATE TABLE TM_SUP_Supplier (
    Id INT PRIMARY KEY IDENTITY,
    Reference NVARCHAR(20) NOT NULL UNIQUE,  -- SUP-0001
    CompanyName NVARCHAR(200) NOT NULL,
    ContactFirstName NVARCHAR(50),
    ContactLastName NVARCHAR(50),
    Email NVARCHAR(100),
    Phone NVARCHAR(30),
    Mobile NVARCHAR(30),
    Address NVARCHAR(200),
    Address2 NVARCHAR(200),
    PostalCode NVARCHAR(20),
    City NVARCHAR(100),
    CountryId INT,
    VatNumber NVARCHAR(50),
    Siret NVARCHAR(50),
    Website NVARCHAR(200),
    CurrencyId INT,
    PaymentTermId INT,
    Notes NVARCHAR(MAX),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
)
```

### TM_PRD_Product
```sql
CREATE TABLE TM_PRD_Product (
    Id INT PRIMARY KEY IDENTITY,
    Reference NVARCHAR(50) NOT NULL UNIQUE,  -- PRD-0001, SKU
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    CategoryId INT,
    BrandId INT,
    UnitOfMeasureId INT,
    PurchasePrice DECIMAL(18,4),
    SalePrice DECIMAL(18,4),
    VatRateId INT,
    Weight DECIMAL(10,3),           -- kg
    Length DECIMAL(10,2),           -- cm
    Width DECIMAL(10,2),
    Height DECIMAL(10,2),
    ImageUrl NVARCHAR(500),
    BarCode NVARCHAR(50),
    MinStockLevel INT DEFAULT 0,
    BusinessUnitId INT,
    IsSerialTracked BIT DEFAULT 0,  -- Track individual instances
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
)
```

### TM_PRD_ProductInstance
```sql
CREATE TABLE TM_PRD_ProductInstance (
    Id INT PRIMARY KEY IDENTITY,
    ProductId INT NOT NULL,
    SerialNumber NVARCHAR(100) NOT NULL,
    BatchNumber NVARCHAR(50),
    WarehouseId INT,
    LocationCode NVARCHAR(50),      -- Shelf/bin location
    StatusId INT,                    -- Available, Reserved, Sold, Defective
    PurchaseDate DATETIME,
    PurchasePrice DECIMAL(18,4),
    SupplierId INT,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
)
```

### TM_CP_CostPlan (Quotes)
```sql
CREATE TABLE TM_CP_CostPlan (
    Id INT PRIMARY KEY IDENTITY,
    Reference NVARCHAR(20) NOT NULL UNIQUE,  -- QUO-0001
    ClientId INT NOT NULL,
    Date DATETIME NOT NULL,
    ValidUntil DATETIME,
    StatusId INT NOT NULL,          -- Draft, Sent, Accepted, Rejected, Expired
    CurrencyId INT NOT NULL,
    SubTotal DECIMAL(18,2),
    TotalVat DECIMAL(18,2),
    TotalAmount DECIMAL(18,2),
    Discount DECIMAL(5,2),
    Notes NVARCHAR(MAX),
    InternalNotes NVARCHAR(MAX),
    BusinessUnitId INT,
    SocietyId INT,
    CreatedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
)
```

### TM_CP_CostPlanLine
```sql
CREATE TABLE TM_CP_CostPlanLine (
    Id INT PRIMARY KEY IDENTITY,
    CostPlanId INT NOT NULL,
    LineNumber INT NOT NULL,
    ProductId INT,
    Description NVARCHAR(500) NOT NULL,
    Quantity DECIMAL(10,2) NOT NULL,
    UnitPrice DECIMAL(18,4) NOT NULL,
    Discount DECIMAL(5,2) DEFAULT 0,
    VatRateId INT NOT NULL,
    VatAmount DECIMAL(18,2),
    LineTotal DECIMAL(18,2),
    SortOrder INT DEFAULT 0,
    FOREIGN KEY (CostPlanId) REFERENCES TM_CP_CostPlan(Id) ON DELETE CASCADE
)
```

### TM_ORD_ClientOrder
```sql
CREATE TABLE TM_ORD_ClientOrder (
    Id INT PRIMARY KEY IDENTITY,
    Reference NVARCHAR(20) NOT NULL UNIQUE,  -- ORD-0001
    ClientId INT NOT NULL,
    CostPlanId INT,                 -- Linked quote (optional)
    OrderDate DATETIME NOT NULL,
    RequiredDate DATETIME,
    StatusId INT NOT NULL,          -- Draft, Confirmed, InProgress, Delivered, Cancelled
    PaymentStatusId INT,            -- Unpaid, PartiallyPaid, Paid
    CurrencyId INT NOT NULL,
    ShippingAddress NVARCHAR(200),
    ShippingCity NVARCHAR(100),
    ShippingPostalCode NVARCHAR(20),
    ShippingCountryId INT,
    SubTotal DECIMAL(18,2),
    TotalVat DECIMAL(18,2),
    TotalAmount DECIMAL(18,2),
    PaidAmount DECIMAL(18,2) DEFAULT 0,
    Discount DECIMAL(5,2),
    Notes NVARCHAR(MAX),
    InternalNotes NVARCHAR(MAX),
    BusinessUnitId INT,
    SocietyId INT,
    CreatedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
)
```

### TM_ORD_ClientOrderLine
```sql
CREATE TABLE TM_ORD_ClientOrderLine (
    Id INT PRIMARY KEY IDENTITY,
    OrderId INT NOT NULL,
    LineNumber INT NOT NULL,
    ProductId INT,
    ProductInstanceId INT,          -- For serial-tracked items
    Description NVARCHAR(500) NOT NULL,
    Quantity DECIMAL(10,2) NOT NULL,
    DeliveredQuantity DECIMAL(10,2) DEFAULT 0,
    UnitPrice DECIMAL(18,4) NOT NULL,
    Discount DECIMAL(5,2) DEFAULT 0,
    VatRateId INT NOT NULL,
    VatAmount DECIMAL(18,2),
    LineTotal DECIMAL(18,2),
    SortOrder INT DEFAULT 0,
    FOREIGN KEY (OrderId) REFERENCES TM_ORD_ClientOrder(Id) ON DELETE CASCADE
)
```

### TM_INV_ClientInvoice
```sql
CREATE TABLE TM_INV_ClientInvoice (
    Id INT PRIMARY KEY IDENTITY,
    Reference NVARCHAR(20) NOT NULL UNIQUE,  -- INV-0001
    ClientId INT NOT NULL,
    OrderId INT,                    -- Linked order (optional)
    InvoiceDate DATETIME NOT NULL,
    DueDate DATETIME NOT NULL,
    StatusId INT NOT NULL,          -- Draft, Sent, Paid, Overdue, Cancelled
    CurrencyId INT NOT NULL,
    BillingAddress NVARCHAR(200),
    BillingCity NVARCHAR(100),
    BillingPostalCode NVARCHAR(20),
    BillingCountryId INT,
    SubTotal DECIMAL(18,2),
    TotalVat DECIMAL(18,2),
    TotalAmount DECIMAL(18,2),
    PaidAmount DECIMAL(18,2) DEFAULT 0,
    Discount DECIMAL(5,2),
    Notes NVARCHAR(MAX),
    PaymentReference NVARCHAR(100), -- Bank reference
    PaidAt DATETIME,
    BusinessUnitId INT,
    SocietyId INT,
    CreatedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
)
```

### TM_INV_ClientInvoiceLine
```sql
CREATE TABLE TM_INV_ClientInvoiceLine (
    Id INT PRIMARY KEY IDENTITY,
    InvoiceId INT NOT NULL,
    LineNumber INT NOT NULL,
    ProductId INT,
    Description NVARCHAR(500) NOT NULL,
    Quantity DECIMAL(10,2) NOT NULL,
    UnitPrice DECIMAL(18,4) NOT NULL,
    Discount DECIMAL(5,2) DEFAULT 0,
    VatRateId INT NOT NULL,
    VatAmount DECIMAL(18,2),
    LineTotal DECIMAL(18,2),
    SortOrder INT DEFAULT 0,
    FOREIGN KEY (InvoiceId) REFERENCES TM_INV_ClientInvoice(Id) ON DELETE CASCADE
)
```

### TM_DEL_DeliveryForm
```sql
CREATE TABLE TM_DEL_DeliveryForm (
    Id INT PRIMARY KEY IDENTITY,
    Reference NVARCHAR(20) NOT NULL UNIQUE,  -- DEL-0001
    OrderId INT NOT NULL,
    ClientId INT NOT NULL,
    DeliveryDate DATETIME NOT NULL,
    StatusId INT NOT NULL,          -- Pending, Shipped, Delivered
    CarrierId INT,
    TrackingNumber NVARCHAR(100),
    ShippingAddress NVARCHAR(200),
    ShippingCity NVARCHAR(100),
    ShippingPostalCode NVARCHAR(20),
    ShippingCountryId INT,
    Weight DECIMAL(10,3),           -- Total weight
    Packages INT DEFAULT 1,         -- Number of packages
    Notes NVARCHAR(MAX),
    ShippedAt DATETIME,
    DeliveredAt DATETIME,
    SignedBy NVARCHAR(100),
    CreatedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE()
)
```

### TM_DEL_DeliveryFormLine
```sql
CREATE TABLE TM_DEL_DeliveryFormLine (
    Id INT PRIMARY KEY IDENTITY,
    DeliveryFormId INT NOT NULL,
    OrderLineId INT NOT NULL,
    ProductId INT,
    ProductInstanceId INT,
    Description NVARCHAR(500),
    Quantity DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (DeliveryFormId) REFERENCES TM_DEL_DeliveryForm(Id) ON DELETE CASCADE
)
```

### TM_STK_Stock
```sql
CREATE TABLE TM_STK_Stock (
    Id INT PRIMARY KEY IDENTITY,
    ProductId INT NOT NULL,
    WarehouseId INT NOT NULL,
    Quantity DECIMAL(10,2) NOT NULL,
    ReservedQuantity DECIMAL(10,2) DEFAULT 0,
    AvailableQuantity AS (Quantity - ReservedQuantity),  -- Computed column
    LastUpdated DATETIME,
    UNIQUE (ProductId, WarehouseId)
)
```

### TM_STK_StockMovement
```sql
CREATE TABLE TM_STK_StockMovement (
    Id INT PRIMARY KEY IDENTITY,
    ProductId INT NOT NULL,
    WarehouseId INT NOT NULL,
    MovementType NVARCHAR(20) NOT NULL,  -- IN, OUT, TRANSFER, ADJUSTMENT
    Quantity DECIMAL(10,2) NOT NULL,     -- Positive or negative
    ReferenceType NVARCHAR(50),          -- Order, Delivery, Adjustment
    ReferenceId INT,                     -- ID of related document
    Notes NVARCHAR(500),
    CreatedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE()
)
```

### TM_LOG_Shipment
```sql
CREATE TABLE TM_LOG_Shipment (
    Id INT PRIMARY KEY IDENTITY,
    Reference NVARCHAR(20) NOT NULL UNIQUE,
    DeliveryFormId INT,
    CarrierId INT NOT NULL,
    TrackingNumber NVARCHAR(100),
    StatusId INT NOT NULL,          -- Pending, InTransit, Delivered, Exception
    OriginAddress NVARCHAR(200),
    OriginCity NVARCHAR(100),
    OriginCountryId INT,
    DestinationAddress NVARCHAR(200),
    DestinationCity NVARCHAR(100),
    DestinationCountryId INT,
    Weight DECIMAL(10,3),
    Packages INT,
    EstimatedDelivery DATETIME,
    ActualDelivery DATETIME,
    Cost DECIMAL(18,2),
    CurrencyId INT,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
)
```

### TM_PRJ_Project
```sql
CREATE TABLE TM_PRJ_Project (
    Id INT PRIMARY KEY IDENTITY,
    Reference NVARCHAR(20) NOT NULL UNIQUE,  -- PRJ-0001
    Name NVARCHAR(200) NOT NULL,
    ClientId INT,
    Description NVARCHAR(MAX),
    StatusId INT NOT NULL,          -- Planning, InProgress, OnHold, Completed, Cancelled
    StartDate DATETIME,
    EndDate DATETIME,
    Budget DECIMAL(18,2),
    CurrencyId INT,
    BusinessUnitId INT,
    ManagerId INT,                  -- Project manager (user)
    Notes NVARCHAR(MAX),
    CreatedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
)
```

### TM_PRJ_ProjectPhase
```sql
CREATE TABLE TM_PRJ_ProjectPhase (
    Id INT PRIMARY KEY IDENTITY,
    ProjectId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    StatusId INT,
    StartDate DATETIME,
    EndDate DATETIME,
    CompletionPercent INT DEFAULT 0,
    SortOrder INT DEFAULT 0,
    FOREIGN KEY (ProjectId) REFERENCES TM_PRJ_Project(Id) ON DELETE CASCADE
)
```

---

## Recommended Indexes

```sql
-- Clients
CREATE INDEX IX_Client_Reference ON TM_CLI_Client(Reference);
CREATE INDEX IX_Client_CompanyName ON TM_CLI_Client(CompanyName);
CREATE INDEX IX_Client_StatusId ON TM_CLI_Client(StatusId);
CREATE INDEX IX_Client_BusinessUnitId ON TM_CLI_Client(BusinessUnitId);

-- Products
CREATE INDEX IX_Product_Reference ON TM_PRD_Product(Reference);
CREATE INDEX IX_Product_Name ON TM_PRD_Product(Name);
CREATE INDEX IX_Product_CategoryId ON TM_PRD_Product(CategoryId);

-- Orders
CREATE INDEX IX_Order_Reference ON TM_ORD_ClientOrder(Reference);
CREATE INDEX IX_Order_ClientId ON TM_ORD_ClientOrder(ClientId);
CREATE INDEX IX_Order_StatusId ON TM_ORD_ClientOrder(StatusId);
CREATE INDEX IX_Order_OrderDate ON TM_ORD_ClientOrder(OrderDate);

-- Invoices
CREATE INDEX IX_Invoice_Reference ON TM_INV_ClientInvoice(Reference);
CREATE INDEX IX_Invoice_ClientId ON TM_INV_ClientInvoice(ClientId);
CREATE INDEX IX_Invoice_StatusId ON TM_INV_ClientInvoice(StatusId);
CREATE INDEX IX_Invoice_DueDate ON TM_INV_ClientInvoice(DueDate);

-- Stock
CREATE INDEX IX_Stock_ProductWarehouse ON TM_STK_Stock(ProductId, WarehouseId);
CREATE INDEX IX_StockMovement_CreatedAt ON TM_STK_StockMovement(CreatedAt);
```

---

## Entity Relationship Diagram

```
TR_BU_BusinessUnit ────┬────── TM_CLI_Client ────── TM_CLI_ClientContact
TR_COU_Country ────────┤           │
TR_CUR_Currency ───────┤           │
TR_STA_Status ─────────┤           ├────── TM_CP_CostPlan ────── TM_CP_CostPlanLine
TR_CT_ClientType ──────┘           │              │
                                   │              └────── TM_PRD_Product
                                   │                          │
                                   ├────── TM_ORD_ClientOrder ─┼── TM_ORD_ClientOrderLine
                                   │              │            │
                                   │              │      TM_PRD_ProductInstance
                                   │              │
                                   │              ├────── TM_DEL_DeliveryForm ── TM_DEL_DeliveryFormLine
                                   │              │
                                   │              └────── TM_INV_ClientInvoice ── TM_INV_ClientInvoiceLine
                                   │
TM_SUP_Supplier ───────────────────┴────── TM_PRD_Product ────── TM_STK_Stock
                                                  │
                                           TM_STK_StockMovement
```

---

## Data Migration Notes

1. **No schema changes required** - Use existing tables as-is
2. **Reference data** - TR_* tables already populated
3. **User passwords** - Keep existing hash format for compatibility
4. **Sequences** - SQL Server IDENTITY columns handle auto-increment
5. **Timestamps** - Use GETDATE() default for CreatedAt columns
