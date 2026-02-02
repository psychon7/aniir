# Complete Database Tables List

## Reference Tables (TR_) - 26 Tables

| # | Table Name | Purpose |
|---|------------|---------|
| 1 | TR_LNG_Language | Languages |
| 2 | TR_CUR_Currency | Currencies |
| 3 | TR_MCU_Main_Currency | Currency exchange rates |
| 4 | TR_SOC_Society | Companies/Organizations |
| 5 | TR_ROL_Role | User roles |
| 6 | TR_SCR_Screen | Application screens |
| 7 | TR_RIT_Right | Role permissions |
| 8 | TR_CIV_Civility | Titles (Mr., Mrs., etc.) |
| 9 | TR_PMO_Payment_Mode | Payment methods |
| 10 | TR_PCO_Payment_Condition | Payment terms |
| 11 | TR_VAT_Vat | VAT/Tax rates |
| 12 | TR_CTY_Client_Type | Client types |
| 13 | TR_ACT_Activity | Business activities |
| 14 | TR_COU_Country | Countries |
| 15 | TR_REG_Region | Regions/States |
| 16 | TR_DEP_Department | Departments |
| 17 | TR_CMU_Commune | Cities/Communes |
| 18 | TR_POS_Position | Job positions |
| 19 | TR_CST_CostPlan_Statut | Quotation status |
| 20 | TR_LTP_Line_Type | Document line types |
| 21 | TR_ALB_Album | Photo albums |
| 22 | TR_PAL_Photo_Album | Album photos |
| 23 | TR_BAC_Bank_Account | Bank accounts |
| 24 | TR_STY_Supplier_Type | Supplier types |
| 25 | TR_DTP_Document_Type | Document types |
| 26 | TR_FRE_File_Recycle | Deleted files |
| 27 | TR_THF_Text_Header_Footer | Document templates |
| 28 | TR_SPR_Supplier_Product | Supplier product pricing |

---

## Master Tables (TM_) - 35 Tables

### User & Authentication
| # | Table Name | Purpose |
|---|------------|---------|
| 1 | TM_USR_User | System users |

### Client Management
| # | Table Name | Purpose |
|---|------------|---------|
| 2 | TM_CLI_Client | Clients/Customers |
| 3 | TM_CCO_Client_Contact | Client contacts |

### Supplier Management
| # | Table Name | Purpose |
|---|------------|---------|
| 4 | TM_SUP_Supplier | Suppliers |
| 5 | TM_SCO_Supplier_Contact | Supplier contacts |

### Product Management
| # | Table Name | Purpose |
|---|------------|---------|
| 6 | TM_PTY_Product_Type | Product types |
| 7 | TM_PTM_Product_Type_Matrix | Product attribute matrix |
| 8 | TM_PRD_Product | Products |
| 9 | TM_PIT_Product_Instance | Product variants |
| 10 | TM_PCT_Product_Catelogue | Product categories |

### Project & Sales
| # | Table Name | Purpose |
|---|------------|---------|
| 11 | TM_PRJ_Project | Projects |
| 12 | TM_CPL_Cost_Plan | Quotations/Devis |
| 13 | TM_CLN_CostPlan_Lines | Quotation lines |
| 14 | TM_COD_Client_Order | Client orders |
| 15 | TM_COL_ClientOrder_Lines | Order lines |
| 16 | TM_DFO_Delivery_Form | Delivery forms |
| 17 | TM_DFL_DevlieryForm_Line | Delivery lines |
| 18 | TM_CIN_Client_Invoice | Client invoices |
| 19 | TM_CII_ClientInvoice_Line | Invoice lines |
| 20 | TM_CPY_ClientInvoice_Payment | Invoice payments |

### Purchase Management
| # | Table Name | Purpose |
|---|------------|---------|
| 21 | TM_PIN_Purchase_Intent | Purchase intents |
| 22 | TM_PIL_PurchaseIntent_Lines | Purchase intent lines |
| 23 | TM_SOD_Supplier_Order | Supplier orders |
| 24 | TM_SOL_SupplierOrder_Lines | Supplier order lines |
| 25 | TM_SIN_Supplier_Invoice | Supplier invoices |
| 26 | TM_SIL_SupplierInvoice_Lines | Supplier invoice lines |

### Logistics & Warehouse
| # | Table Name | Purpose |
|---|------------|---------|
| 27 | TM_LGS_Logistic | Logistics/Shipments |
| 28 | TM_LGL_Logistic_Lines | Logistics lines |
| 29 | TM_WHS_WareHouse | Warehouses |
| 30 | TM_SHE_Shelves | Warehouse shelves |
| 31 | TR_PIW_Product_In_WareHouse | Warehouse inventory (deprecated) |

---

## Intermediate Tables (TI_) - 5 Tables

| # | Table Name | Purpose |
|---|------------|---------|
| 1 | TI_PIC_Product_In_Catelogue | Product-Category mapping |
| 2 | TI_PIM_Product_Image | Product images |
| 3 | TI_PTI_Product_Instance_Image | Product variant images |
| 4 | TI_DOC_Document | Documents |

---

## Site Tables (TS_) - 4+ Tables

| # | Table Name | Purpose |
|---|------------|---------|
| 1 | TS_PRJ_Project | Site projects/realizations |
| 2 | TS_PIG_Project_Image | Project images |
| 3 | TS_PPD_Project_Product | Project products |
| 4 | TS_TAG_Tags | Tags |
| 5+ | Shopping cart & wishlist tables | E-commerce functionality |

---

## Total Table Count

- **Reference Tables (TR_):** 28 tables
- **Master Tables (TM_):** 31 tables
- **Intermediate Tables (TI_):** 4 tables
- **Site Tables (TS_):** 4+ tables

**Grand Total:** ~67+ tables

---

## Table Relationships Summary

### One-to-Many Relationships
- Society → Users, Clients, Suppliers, Products, Projects
- Client → Contacts, Projects, Orders, Invoices
- Supplier → Contacts, Orders, Invoices
- Product Type → Products
- Product → Product Instances, Images
- Project → Quotations, Orders, Invoices
- Quotation → Quotation Lines
- Order → Order Lines, Delivery Forms
- Delivery Form → Delivery Lines, Invoices
- Invoice → Invoice Lines, Payments

### Many-to-Many Relationships
- Products ↔ Categories (via TI_PIC_Product_In_Catelogue)
- Products ↔ Suppliers (via TR_SPR_Supplier_Product)
- Projects ↔ Products (via TS_PPD_Project_Product)

### Self-Referencing Relationships
- TM_USR_User.usr_creator_id → TM_USR_User.usr_id
- TM_PCT_Product_Catelogue.pct_parent_id → TM_PCT_Product_Catelogue.pct_id
- TM_CIN_Client_Invoice.cin_avoir_id → TM_CIN_Client_Invoice.cin_id

---

## Key Foreign Key Patterns

### Standard References
- `soc_id` → TR_SOC_Society (in most tables)
- `usr_creator_id` → TM_USR_User (in most master tables)
- `vat_id` → TR_VAT_Vat (in financial tables)
- `cur_id` → TR_CUR_Currency (in financial tables)
- `pco_id` → TR_PCO_Payment_Condition (in documents)
- `pmo_id` → TR_PMO_Payment_Mode (in documents)

### Entity References
- `cli_id` → TM_CLI_Client
- `sup_id` → TM_SUP_Supplier
- `prd_id` → TM_PRD_Product
- `pit_id` → TM_PIT_Product_Instance
- `prj_id` → TM_PRJ_Project

### Document Chain
- `cpl_id` → TM_CPL_Cost_Plan (Quotation)
- `cod_id` → TM_COD_Client_Order (Order)
- `dfo_id` → TM_DFO_Delivery_Form (Delivery)
- `cin_id` → TM_CIN_Client_Invoice (Invoice)

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-31


