# ERP System - Visual Diagrams & Flowcharts

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
├─────────────────────────────────┬───────────────────────────────────┤
│         ERP.Web (Admin)         │    ERP.SiteNC202310 (Public)     │
│                                 │                                   │
│  • Client Management            │  • Product Catalog                │
│  • Supplier Management          │  • Shopping Cart                  │
│  • Product Management           │  • User Orders                    │
│  • Project/Quotation            │  • Project Gallery                │
│  • Order Management             │  • Contact Form                   │
│  • Invoice Management           │  • Technical Sheets               │
│  • Purchase Management          │  • User Registration              │
│  • Warehouse Management         │                                   │
│  • User Administration          │                                   │
│                                 │                                   │
│  ASP.NET WebForms + jQuery      │  ASP.NET WebForms + Bootstrap     │
└─────────────────────────────────┴───────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │     Web Services (ASMX)    │
                    │  • ERPWebServices.asmx     │
                    │  • SiteWebService.asmx     │
                    └─────────────┬───────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                            │
├─────────────────────────────────┬───────────────────────────────────┤
│      ERP.DataServices           │     ERP.SharedServices            │
│                                 │                                   │
│  • ClientServices               │  • PDF Generation                 │
│  • SupplierServices             │  • Email Services                 │
│  • ProductServices              │  • Barcode Generation             │
│  • ProjectServices              │  • Logging                        │
│  • OrderServices                │  • File Management                │
│  • InvoiceServices              │                                   │
│  • WarehouseServices            │                                   │
│  • UserServices                 │                                   │
└─────────────────────────────────┴───────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                              │
├─────────────────────────────────┬───────────────────────────────────┤
│      ERP.Repositories           │        ERP.Entities               │
│                                 │                                   │
│  • BaseSqlServerRepository      │  • Client                         │
│  • ClientRepository             │  • Supplier                       │
│  • SupplierRepository           │  • Product                        │
│  • ProductRepository            │  • Project                        │
│  • ProjectRepository            │  • Order                          │
│  • OrderRepository              │  • Invoice                        │
│  • InvoiceRepository            │  • User                           │
│  • WarehouseRepository          │  • ... (Domain Models)            │
│                                 │                                   │
│  Entity Framework 4.x           │  POCO Classes                     │
└─────────────────────────────────┴───────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                               │
│                                                                      │
│                    SQL Server (ERP_ECOLED)                          │
│                                                                      │
│  • 28 Reference Tables (TR_*)                                       │
│  • 31 Master Tables (TM_*)                                          │
│  • 4 Intermediate Tables (TI_*)                                     │
│  • 4+ Site Tables (TS_*)                                            │
│                                                                      │
│  Total: ~67+ Tables                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Sales Process Flow

```
┌──────────────────┐
│  Create Client   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Create Project  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│              Create Quotation (Devis)                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │  • Add products/services                           │  │
│  │  • Set prices and quantities                       │  │
│  │  • Apply discounts                                 │  │
│  │  • Set delivery/invoicing contacts                 │  │
│  │  • Generate PDF                                    │  │
│  └────────────────────────────────────────────────────┘  │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│  Client Reviews  │─────▶│  Quotation       │
│  Quotation       │      │  Accepted?       │
└──────────────────┘      └────────┬─────────┘
                                   │ Yes
                                   ▼
                          ┌──────────────────┐
                          │  Create Order    │
                          │  from Quotation  │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Prepare Goods   │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Create Delivery  │
                          │  Form (Bon de    │
                          │   Livraison)     │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Ship Products   │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Create Invoice   │
                          │  from Delivery   │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Track Payment    │
                          │  • Partial       │
                          │  • Full          │
                          └──────────────────┘
```

---

## Purchase Process Flow

```
┌──────────────────┐
│ Identify Need    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│         Create Purchase Intent                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  • List required products                          │  │
│  │  • Specify quantities                              │  │
│  │  • Add notes                                       │  │
│  └────────────────────────────────────────────────────┘  │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ Select Supplier  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│         Create Supplier Order                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │  • Convert from Purchase Intent                    │  │
│  │  • Negotiate prices                                │  │
│  │  • Set payment terms                               │  │
│  │  • Generate PDF                                    │  │
│  └────────────────────────────────────────────────────┘  │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ Receive Supplier │
│    Invoice       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Make Payment    │
│  • Track payment │
│  • Upload proof  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Production Start │
│  (if applicable) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Create Logistics │
│    Shipment      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Track Shipment   │
│  • Departure     │
│  • In transit    │
│  • Arrival       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Warehouse        │
│   Receipt        │
│  • Update stock  │
│  • Assign shelf  │
└──────────────────┘
```

---

## Database Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      TR_SOC_Society                              │
│                    (Company/Organization)                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬──────────────┐
        │               │               │              │
        ▼               ▼               ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  TM_USR_User │ │ TM_CLI_Client│ │TM_SUP_   │ │ TM_PTY_      │
│   (Users)    │ │  (Clients)   │ │Supplier  │ │Product_Type  │
└──────────────┘ └──────┬───────┘ └────┬─────┘ └──────┬───────┘
                        │              │              │
                        │              │              │
        ┌───────────────┼──────┬───────┼──────┐       │
        │               │      │       │      │       │
        ▼               ▼      ▼       ▼      ▼       ▼
┌──────────────┐ ┌──────────┐ │ ┌──────────┐ │ ┌──────────────┐
│  TM_CCO_     │ │TM_PRJ_   │ │ │TM_SCO_   │ │ │  TM_PRD_     │
│Client_Contact│ │ Project  │ │ │Supplier_ │ │ │  Product     │
└──────────────┘ └────┬─────┘ │ │Contact   │ │ └──────┬───────┘
                      │       │ └──────────┘ │        │
        ┌─────────────┼───────┤              │        │
        │             │       │              │        │
        ▼             ▼       ▼              ▼        ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  TM_CPL_     │ │TM_COD_   │ │TM_SOD_   │ │  TM_PIT_     │
│  Cost_Plan   │ │Client_   │ │Supplier_ │ │Product_      │
│ (Quotation)  │ │Order     │ │Order     │ │Instance      │
└──────┬───────┘ └────┬─────┘ └────┬─────┘ └──────────────┘
       │              │            │
       ▼              ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│  TM_CLN_     │ │TM_COL_   │ │TM_SOL_   │
│CostPlan_Lines│ │ClientOrder│ │Supplier  │
└──────────────┘ │_Lines    │ │Order_Lines│
                 └────┬─────┘ └────┬─────┘
                      │            │
                      ▼            ▼
                 ┌──────────┐ ┌──────────┐
                 │TM_DFO_   │ │TM_SIN_   │
                 │Delivery_ │ │Supplier_ │
                 │Form      │ │Invoice   │
                 └────┬─────┘ └────┬─────┘
                      │            │
                      ▼            ▼
                 ┌──────────┐ ┌──────────┐
                 │TM_DFL_   │ │TM_SIL_   │
                 │Delivery  │ │Supplier  │
                 │Form_Line │ │Invoice_  │
                 └────┬─────┘ │Lines     │
                      │       └──────────┘
                      ▼
                 ┌──────────┐
                 │TM_CIN_   │
                 │Client_   │
                 │Invoice   │
                 └────┬─────┘
                      │
                      ▼
                 ┌──────────┐
                 │TM_CII_   │
                 │Client    │
                 │Invoice_  │
                 │Line      │
                 └──────────┘
```


