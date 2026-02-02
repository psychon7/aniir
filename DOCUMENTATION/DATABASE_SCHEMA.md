# ERP Database Schema - Complete Reference

**Database Name:** ERP_ECOLED  
**Database Type:** SQL Server  
**Version:** 1.0.0.1+  
**Last Updated:** 2026-01-31

---

## Table of Contents

1. [Reference Tables (TR_)](#reference-tables)
2. [Master Tables (TM_)](#master-tables)
3. [Intermediate Tables (TI_)](#intermediate-tables)
4. [Site Tables (TS_)](#site-tables)
5. [Table Relationships](#table-relationships)
6. [Indexes & Constraints](#indexes--constraints)

---

## Reference Tables (TR_)

### TR_LNG_Language
**Purpose:** System languages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| lng_id | int | PK, IDENTITY | Language ID |
| lng_label | nvarchar(80) | NOT NULL | Language name |
| lng_short_label | nvarchar(20) | NOT NULL | Short code (en, fr, etc.) |

---

### TR_CUR_Currency
**Purpose:** Currencies

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| cur_id | int | PK, IDENTITY | Currency ID |
| cur_designation | nvarchar(20) | NOT NULL | Currency name |
| cur_ci_num | int | NOT NULL | Currency code number |
| cur_symbol | nvarchar(10) | NOT NULL | Symbol (€, $, ¥) |
| lng_id | int | FK → TR_LNG_Language | Language |

---

### TR_MCU_Main_Currency
**Purpose:** Currency exchange rates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| mcu_id | int | PK, IDENTITY | Exchange rate ID |
| cur_id | int | FK → TR_CUR_Currency | From currency |
| cur_id2 | int | FK → TR_CUR_Currency | To currency |
| mcu_rate_in | decimal(10,5) | NOT NULL | Buy rate |
| mcu_rate_out | decimal(10,5) | NOT NULL | Sell rate |
| mcu_rate_date | datetime | NOT NULL | Rate date |
| lng_id | int | FK → TR_LNG_Language | Language |

---

### TR_SOC_Society
**Purpose:** Company/Organization information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| soc_id | int | PK, IDENTITY | Society ID |
| soc_society_name | nvarchar(500) | NOT NULL | Company name |
| soc_is_actived | bit | NOT NULL | Active status |
| cur_id | int | FK → TR_CUR_Currency | Default currency |
| lng_id | int | FK → TR_LNG_Language | Default language |
| soc_datebegin | datetime | NULL | Start date |
| soc_dateend | datetime | NULL | End date |
| soc_client_datebegin | datetime | NULL | Client period start |
| soc_client_dateend | datetime | NULL | Client period end |
| soc_email_auto | bit | NULL | Auto email flag |
| soc_capital | nvarchar(1000) | NULL | Company capital |
| soc_short_label | nvarchar(50) | NULL | Short name |
| soc_rib_name | nvarchar(500) | NULL | Bank name |
| soc_rib_address | nvarchar(1000) | NULL | Bank address |
| soc_rib_code_iban | nvarchar(1000) | NULL | IBAN code |
| soc_rib_code_bic | nvarchar(1000) | NULL | BIC/SWIFT code |
| soc_address1 | nvarchar(400) | NULL | Address line 1 |
| soc_address2 | nvarchar(400) | NULL | Address line 2 |
| soc_postcode | nvarchar(400) | NULL | Postal code |
| soc_city | nvarchar(400) | NULL | City |
| soc_county | nvarchar(400) | NULL | County/State |
| soc_tel | nvarchar(200) | NULL | Telephone |
| soc_fax | nvarchar(100) | NULL | Fax |
| soc_siret | nvarchar(100) | NULL | SIRET number |
| soc_rcs | nvarchar(100) | NULL | RCS number |
| soc_cellphone | nvarchar(200) | NULL | Mobile phone |
| soc_email | nvarchar(1000) | NULL | Email |
| soc_tva_intra | nvarchar(100) | NULL | Intra-community VAT |
| soc_site | nvarchar(200) | NULL | Website |
| soc_mask_commission | bit | NULL | Mask commission flag |

---

### TR_ROL_Role
**Purpose:** User roles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| rol_id | int | PK, IDENTITY | Role ID |
| rol_name | nvarchar(200) | NOT NULL | Role name |
| rol_active | bit | NOT NULL | Active status |

---

### TR_SCR_Screen
**Purpose:** Application screens/pages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| scr_id | int | PK, IDENTITY | Screen ID |
| scr_name | nvarchar(200) | NOT NULL | Screen name |

---

### TR_RIT_Right
**Purpose:** Role permissions per screen

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| rit_id | int | PK, IDENTITY | Right ID |
| scr_id | int | FK → TR_SCR_Screen | Screen |
| rol_id | int | FK → TR_ROL_Role | Role |
| rit_read | bit | NOT NULL | Read permission |
| rit_valid | bit | NOT NULL | Validate permission |
| rit_modifiy | bit | NOT NULL | Modify permission |
| rit_create | bit | NOT NULL | Create permission |
| rit_delete | bit | NOT NULL | Delete permission |
| rit_active | bit | NOT NULL | Activate permission |
| rit_cancel | bit | NOT NULL | Cancel permission |

---

### TR_CIV_Civility
**Purpose:** Titles (Mr., Mrs., Ms., etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| civ_id | int | PK, IDENTITY | Civility ID |
| civ_designation | nvarchar(200) | NOT NULL | Title |
| civ_active | bit | NOT NULL | Active status |

---

### TR_PMO_Payment_Mode
**Purpose:** Payment methods

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| pmo_id | int | PK, IDENTITY | Payment mode ID |
| pmo_designation | nvarchar(60) | NOT NULL | Payment method name |
| pmo_isactive | bit | NOT NULL | Active status |

**Examples:** Cash, Check, Bank Transfer, Credit Card

---

### TR_PCO_Payment_Condition
**Purpose:** Payment terms

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| pco_id | int | PK, IDENTITY | Payment condition ID |
| pco_designation | nvarchar(500) | NOT NULL | Terms description |
| pco_active | bit | NOT NULL | Active status |
| pco_numday | int | NOT NULL | Number of days |
| pco_day_additional | int | NOT NULL | Additional days |
| pco_end_month | bit | NOT NULL | End of month flag |

**Examples:** Net 30, Net 60, Due on receipt, 30 days end of month

---

### TR_VAT_Vat
**Purpose:** VAT/Tax rates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| vat_id | int | PK, IDENTITY | VAT ID |
| vat_designation | nvarchar(200) | NOT NULL | VAT name |
| vat_vat_rate | decimal(16,4) | NOT NULL | Tax rate (20.00, 5.50) |
| vat_description | nvarchar(30) | NOT NULL | Description |

---

### TR_CTY_Client_Type
**Purpose:** Client classification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| cty_id | int | PK, IDENTITY | Client type ID |
| cty_description | nvarchar(20) | NOT NULL | Type name |

**Values:** 1 = Client, 2 = Prospect

---

### TR_ACT_Activity
**Purpose:** Business activity types

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| act_id | int | PK, IDENTITY | Activity ID |
| act_designation | nvarchar(20) | NOT NULL | Activity name |
| act_isactive | bit | NOT NULL | Active status |

---

### TR_COU_Country
**Purpose:** Countries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| cou_id | int | PK, IDENTITY | Country ID |
| cou_name | nvarchar(200) | NOT NULL | Country name |
| cou_code | nvarchar(50) | NULL | Country code |
| cou_iso_code | nvarchar(50) | NULL | ISO code |

---

### TR_REG_Region
**Purpose:** Regions/States

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| reg_id | int | PK, IDENTITY | Region ID |
| reg_code | nvarchar(40) | NOT NULL | Region code |
| reg_name | nvarchar(200) | NOT NULL | Region name |
| cou_id | int | FK → TR_COU_Country | Country |

---

### TR_DEP_Department
**Purpose:** Departments (French administrative division)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| dep_id | int | PK, IDENTITY | Department ID |
| dep_code | nvarchar(40) | NOT NULL | Department code |
| dep_name | nvarchar(200) | NOT NULL | Department name |
| reg_id | int | FK → TR_REG_Region | Region |

---

### TR_CMU_Commune
**Purpose:** Communes/Cities with geographic data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| cmu_id | int | PK, IDENTITY | Commune ID |
| cmu_code | nvarchar(40) | NOT NULL | Commune code |
| cmu_name | nvarchar(200) | NOT NULL | Commune name |
| cmu_postcode | nvarchar(100) | NOT NULL | Postal code |
| cmu_insee | nvarchar(20) | NULL | INSEE code |
| cmu_code_arrondissement | nvarchar(20) | NULL | Arrondissement code |
| cmu_code_canton | nvarchar(20) | NULL | Canton code |
| cmu_code_commune | nvarchar(20) | NULL | Commune code |
| cmu_statut | nvarchar(100) | NULL | Status |
| cmu_altitude_moyenne | decimal(10,4) | NULL | Average altitude |
| cmu_longitude | decimal(19,15) | NULL | Longitude |
| cmu_latitude | decimal(19,15) | NULL | Latitude |
| cmu_superficie | decimal(20,10) | NULL | Area (km²) |
| cmu_population | decimal(10,4) | NULL | Population |
| cmu_geo_shape | ntext | NULL | Geographic shape data |
| cmu_geogla_id | int | NULL | Geographic ID |
| dep_id | int | FK → TR_DEP_Department | Department |

---

### TR_POS_Position
**Purpose:** Job positions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| pos_id | int | PK, IDENTITY | Position ID |
| pos_designation | nvarchar(200) | NOT NULL | Position name |
| pos_active | bit | NOT NULL | Active status |

---

### TR_CST_CostPlan_Statut
**Purpose:** Quotation status

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| cst_id | int | PK, IDENTITY | Status ID |
| cst_designation | nvarchar(50) | NOT NULL | Status name |
| cst_isactive | bit | NOT NULL | Active status |

**Examples:** Draft, Sent, Accepted, Rejected, Expired

---

### TR_LTP_Line_Type
**Purpose:** Line item types for documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| ltp_id | int | PK, IDENTITY | Line type ID |
| ltp_name | nvarchar(100) | NOT NULL | Type name |
| ltp_description | nvarchar(200) | NULL | Description |
| ltp_isactive | bit | NOT NULL | Active status |

**Examples:** Product, Service, Comment, Discount, Shipping

---

### TR_ALB_Album
**Purpose:** Photo albums

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| alb_id | int | PK, IDENTITY | Album ID |
| alb_name | nvarchar(200) | NOT NULL | Album name |
| alb_description | nvarchar(1000) | NULL | Description |
| alb_d_creation | datetime | NOT NULL | Creation date |
| soc_id | int | FK → TR_SOC_Society | Society |

---

### TR_PAL_Photo_Album
**Purpose:** Photos in albums

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| pal_id | int | PK, IDENTITY | Photo ID |
| alb_id | int | FK → TR_ALB_Album | Album |
| pal_description | nvarchar(1000) | NULL | Description |
| pal_path | nvarchar(1000) | NOT NULL | File path |
| pal_d_creation | datetime | NOT NULL | Creation date |
| pal_d_update | datetime | NULL | Update date |

---

### TR_BAC_Bank_Account
**Purpose:** Bank account information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| bac_id | int | PK, IDENTITY | Bank account ID |
| bac_bank_name | nvarchar(200) | NULL | Bank name |
| bac_bank_adr | nvarchar(200) | NULL | Bank address |
| bac_account_number | nvarchar(200) | NULL | Account number |
| bac_bic | nvarchar(50) | NOT NULL | BIC/SWIFT code |
| bac_iban | nvarchar(50) | NULL | IBAN |
| bac_rib_bank_code | nvarchar(20) | NULL | RIB bank code |
| bac_rib_agence_code | nvarchar(20) | NULL | RIB agency code |
| bac_rib_account_number | nvarchar(20) | NULL | RIB account number |
| bac_rib_key | nvarchar(20) | NULL | RIB key |
| bac_rib_agency_adr | nvarchar(200) | NULL | Agency address |
| bac_account_owner | nvarchar(100) | NOT NULL | Account owner |
| bac_type | int | NOT NULL | Account type |
| f_id | int | NULL | Foreign ID |
| soc_id | int | FK → TR_SOC_Society | Society |

**bac_type values:**
- 1 = Client
- 2 = Supplier
- 3 = Client Contact
- 4 = Supplier Contact
- 5 = Enterprise

---

### TR_STY_Supplier_Type
**Purpose:** Supplier classification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| sty_id | int | PK, IDENTITY | Supplier type ID |
| sty_description | nvarchar(100) | NOT NULL | Type description |

**Examples:** Supplier, Freight Forwarder, Manufacturer

---

### TR_DTP_Document_Type
**Purpose:** Document types

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| dtp_id | int | PK, IDENTITY | Document type ID |
| dtp_name | nvarchar(200) | NOT NULL | Type name |

---

### TR_FRE_File_Recycle
**Purpose:** Deleted files tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| fre_id | int | PK, IDENTITY | Recycle ID |
| fre_path | nvarchar(2000) | NOT NULL | File path |
| fre_d_create | datetime | NOT NULL | Deletion date |

---

### TR_THF_Text_Header_Footer
**Purpose:** Document templates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| thf_id | int | PK, IDENTITY | Template ID |
| thf_header | ntext | NULL | Quotation header |
| thf_footer | ntext | NULL | Quotation footer |
| thf_cin_header | ntext | NULL | Invoice header |
| thf_cin_footer | ntext | NULL | Invoice footer |
| thf_dlv_footer_condition | ntext | NULL | Delivery conditions |
| thf_dlv_footer_law | ntext | NULL | Delivery legal text |
| thf_cin_penality | ntext | NULL | Invoice penalty text |
| thf_cin_discount_for_prepayment | ntext | NULL | Prepayment discount text |

---

### TR_SPR_Supplier_Product
**Purpose:** Supplier product pricing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| spr_id | int | PK, IDENTITY | Supplier product ID |
| sup_id | int | FK → TM_SUP_Supplier | Supplier |
| prd_id | int | FK → TM_PRD_Product | Product |
| spr_prd_ref | nvarchar(100) | NULL | Supplier's product ref |
| spr_price_1_100 | decimal(16,4) | NULL | Price for 1-100 units |
| spr_price_100_500 | decimal(16,4) | NULL | Price for 100-500 units |
| spr_price_500_plus | decimal(16,4) | NULL | Price for 500+ units |
| spr_comment | nvarchar(2000) | NULL | Comments |
| soc_id | int | FK → TR_SOC_Society | Society |
| cur_id | int | FK → TR_CUR_Currency | Currency |

---

## Master Tables (TM_)

### TM_USR_User
**Purpose:** System users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| usr_id | int | PK, IDENTITY | User ID |
| rol_id | int | FK → TR_ROL_Role | Role |
| usr_login | nvarchar(200) | NOT NULL | Login username |
| usr_pwd | nvarchar(2000) | NOT NULL | Encrypted password |
| usr_firstname | nvarchar(200) | NULL | First name |
| usr_lastname | nvarchar(200) | NULL | Last name |
| usr_title | nvarchar(200) | NULL | Job title |
| civ_id | int | FK → TR_CIV_Civility | Civility |
| usr_tel | nvarchar(200) | NULL | Telephone |
| usr_cellphone | nvarchar(200) | NULL | Mobile phone |
| usr_fax | nvarchar(200) | NULL | Fax |
| usr_email | nvarchar(200) | NULL | Email |
| usr_code_hr | nvarchar(200) | NULL | HR code |
| usr_d_creation | datetime | NOT NULL | Creation date |
| usr_d_update | datetime | NOT NULL | Update date |
| usr_is_actived | bit | NOT NULL | Active status |
| usr_photo_path | nvarchar(2000) | NULL | Photo path |
| soc_id | int | FK → TR_SOC_Society | Society |
| usr_address1 | nvarchar(400) | NULL | Address line 1 |
| usr_address2 | nvarchar(400) | NULL | Address line 2 |
| usr_postcode | nvarchar(400) | NULL | Postal code |
| usr_city | nvarchar(400) | NULL | City |
| usr_county | nvarchar(400) | NULL | County |
| usr_super_right | bit | NOT NULL | Super admin flag |
| usr_creator_id | int | FK → TM_USR_User | Creator user |


