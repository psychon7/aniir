# ERP System - Quick Reference Guide

## Database Quick Reference

### Main Entity Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **TM_CLI_Client** | Customers | cli_id, cli_ref, cli_company_name |
| **TM_CCO_Client_Contact** | Customer contacts | cco_id, cli_id, cco_firstname, cco_lastname |
| **TM_SUP_Supplier** | Suppliers | sup_id, sup_ref, sup_company_name |
| **TM_SCO_Supplier_Contact** | Supplier contacts | sco_id, sup_id, sco_firstname, sco_lastname |
| **TM_PRD_Product** | Products | prd_id, prd_ref, prd_name, pty_id |
| **TM_PIT_Product_Instance** | Product variants | pit_id, prd_id, pit_ref, pit_price |
| **TM_PRJ_Project** | Projects | prj_id, prj_code, prj_name, cli_id |
| **TM_CPL_Cost_Plan** | Quotations | cpl_id, cpl_code, prj_id, cli_id |
| **TM_COD_Client_Order** | Orders | cod_id, cod_code, prj_id, cli_id |
| **TM_DFO_Delivery_Form** | Deliveries | dfo_id, dfo_code, cod_id |
| **TM_CIN_Client_Invoice** | Invoices | cin_id, cin_code, cli_id, cod_id |
| **TM_SOD_Supplier_Order** | Purchase orders | sod_id, sod_code, sup_id |
| **TM_SIN_Supplier_Invoice** | Supplier invoices | sin_id, sin_code, sup_id |
| **TM_LGS_Logistic** | Shipments | lgs_id, lgs_code, lgs_is_purchase |
| **TM_WHS_WareHouse** | Warehouses | whs_id, whs_name, whs_code |

---

## Document Flow

### Sales Cycle
```
1. TM_PRJ_Project (Project)
   ↓
2. TM_CPL_Cost_Plan (Quotation/Devis)
   ├── TM_CLN_CostPlan_Lines
   ↓
3. TM_COD_Client_Order (Order)
   ├── TM_COL_ClientOrder_Lines
   ↓
4. TM_DFO_Delivery_Form (Delivery)
   ├── TM_DFL_DevlieryForm_Line
   ↓
5. TM_CIN_Client_Invoice (Invoice)
   ├── TM_CII_ClientInvoice_Line
   ↓
6. TM_CPY_ClientInvoice_Payment (Payment)
```

### Purchase Cycle
```
1. TM_PIN_Purchase_Intent (Intent)
   ├── TM_PIL_PurchaseIntent_Lines
   ↓
2. TM_SOD_Supplier_Order (Order)
   ├── TM_SOL_SupplierOrder_Lines
   ↓
3. TM_SIN_Supplier_Invoice (Invoice)
   ├── TM_SIL_SupplierInvoice_Lines
   ↓
4. TM_LGS_Logistic (Shipment)
   ├── TM_LGL_Logistic_Lines
   ↓
5. Warehouse Receipt
```

---

## Common Field Patterns

### Audit Fields
- `*_d_creation` - Creation date
- `*_d_update` - Last update date
- `usr_creator_id` - Creator user ID

### Status Fields
- `*_isactive` / `*_is_actived` - Active/Inactive
- `*_isblocked` - Blocked status
- `*_closed` - Closed status

### Reference Fields
- `*_ref` - Reference number
- `*_code` - System-generated code
- `*_name` - Name/Title

### Financial Fields
- `*_price` - Sale price
- `*_purchase_price` - Purchase price
- `*_unit_price` - Unit price
- `*_total_price` - Total price
- `*_discount_percentage` - Discount %
- `*_discount_amount` - Discount amount
- `*_margin` - Profit margin

### Contact Fields (Snapshot Pattern)
Documents store contact information snapshots:
- `*_inv_cco_*` - Invoicing contact fields
- `*_dlv_cco_*` - Delivery contact fields

---

## Key Relationships

### Client Hierarchy
```
TM_CLI_Client
├── TM_CCO_Client_Contact (Contacts)
├── TM_PRJ_Project (Projects)
│   ├── TM_CPL_Cost_Plan (Quotations)
│   ├── TM_COD_Client_Order (Orders)
│   └── TM_CIN_Client_Invoice (Invoices)
└── TM_DFO_Delivery_Form (Deliveries)
```

### Product Hierarchy
```
TM_PTY_Product_Type (Type)
├── TM_PRD_Product (Product)
│   ├── TM_PIT_Product_Instance (Variants)
│   ├── TI_PIM_Product_Image (Images)
│   └── TI_PIC_Product_In_Catelogue (Categories)
└── TM_PTM_Product_Type_Matrix (Attribute Matrix)
```

---

## Web Services Endpoints

### Admin (ERPWebServices.asmx)
- **Authentication:** Required
- **Base URL:** `/Services/ERPWebServices.asmx`

**Common Methods:**
- `GetClientType()` - Get client types
- `GetAllCommuneNameByPostcode(postcode)` - Lookup cities
- `GetDocumentList(dtpName, forId)` - Get documents

### Public Site (SiteWebService.asmx)
- **Authentication:** Optional
- **Base URL:** `/Service/SiteWebService.asmx`

**Public Methods:**
- `GetCategory()` - Product categories
- `GetPrdByCatid(input)` - Products by category
- `GetPrdDetail(prdId)` - Product details
- `GetProjectList()` - Project gallery
- `SendEmail(email)` - Contact form

**Authenticated Methods:**
- `AddCartShopping(...)` - Add to cart
- `CreateOrder(shpcartList)` - Place order
- `AddWishLine(prdId)` - Add to wishlist

---

## File Paths

### Upload Directories
```
D:\SiteFilesFolder\ERP\Files\
├── UpLoadFiles\
│   ├── Product\
│   │   ├── Photo\      # Product images
│   │   └── File\       # Product files
│   ├── Album\          # Album photos
│   ├── TempFile\       # Temporary files
│   └── General\        # General uploads
├── EmailAttchmt\       # Email attachments
└── EmailSender\        # Outgoing emails
```

### Log Files
```
D:\AppLog\ERPApp\
├── Logs.txt           # Application logs
├── AppErrors.txt      # Application errors
├── ExportErrors.txt   # Export errors
├── ImportErrors.txt   # Import errors
└── MailErrors.txt     # Email errors
```

---

## Configuration Keys

### Web.config (ERP.Web)
```xml
<add key="PageSize" value="20"/>
<add key="ResultLimit" value="100"/>
<add key="CodeType" value="1"/>
<add key="CompanyName" value="ECOLED EUROPE"/>
<add key="FontForPdf" value="Arial"/>
```

### Web.config (ERP.SiteNC202310)
```xml
<add key="jsVersion" value="1.0.1"/>
<add key="softwareV" value="1.0.0.1"/>
<add key="PageSize" value="20"/>
<add key="WithTechSheet" value="True"/>
```

---

## Common Queries

### Get Active Clients
```sql
SELECT cli_id, cli_ref, cli_company_name
FROM TM_CLI_Client
WHERE cli_isactive = 1 AND cli_isblocked = 0
ORDER BY cli_company_name
```

### Get Products by Category
```sql
SELECT p.prd_id, p.prd_ref, p.prd_name, p.prd_price
FROM TM_PRD_Product p
INNER JOIN TI_PIC_Product_In_Catelogue pic ON p.prd_id = pic.prd_id
WHERE pic.pct_id = @CategoryId
ORDER BY p.prd_name
```

### Get Project with Quotations
```sql
SELECT prj.*, cpl.cpl_code, cpl.cpl_name
FROM TM_PRJ_Project prj
LEFT JOIN TM_CPL_Cost_Plan cpl ON prj.prj_id = cpl.prj_id
WHERE prj.cli_id = @ClientId
ORDER BY prj.prj_d_creation DESC
```

### Get Unpaid Invoices
```sql
SELECT cin_id, cin_code, cin_rest_to_pay
FROM TM_CIN_Client_Invoice
WHERE cin_rest_to_pay > 0
  AND cin_isinvoice = 1
ORDER BY cin_d_term
```

---

## User Roles & Permissions

### Permission Flags
- **rit_read** - View records
- **rit_create** - Create new records
- **rit_modifiy** - Edit existing records
- **rit_delete** - Delete records
- **rit_valid** - Validate/Approve
- **rit_active** - Activate/Deactivate
- **rit_cancel** - Cancel documents

### Super User
- `usr_super_right = 1` - Bypass all permissions

---

## Product Types

### Standard Types
- **LED** - LED products
- **DRIVER** - LED drivers
- **ACCESSOIRE** - Accessories
- **OPTION** - Optional items

### Type-Specific Features
- LED products have technical sheets
- Drivers have specifications
- Accessories may not have technical sheets

---

## Status Values

### Cost Plan Status (cst_id)
- Draft
- Sent
- Accepted
- Rejected
- Expired

### Line Types (ltp_id)
- Product
- Service
- Comment
- Discount
- Shipping

### Client Types (cty_id)
- 1 = Client
- 2 = Prospect

### Supplier Types (sty_id)
- Supplier
- Freight Forwarder
- Manufacturer

---

## Naming Conventions

### Table Prefixes
- **TR_** - Reference tables
- **TM_** - Master tables
- **TI_** - Intermediate/Junction tables
- **TS_** - Site-specific tables

### Column Naming
- `[abbr]_id` - Primary key
- `[abbr]_[field]` - Regular column
- `d_[event]` - Date field
- `is_[status]` - Boolean field

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2026-01-31


