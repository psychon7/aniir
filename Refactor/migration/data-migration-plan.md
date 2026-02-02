# Data Migration Plan: SQL Server → PostgreSQL

## Overview

This document outlines the step-by-step process for migrating data from the existing ASP.NET ERP system (SQL Server) to the new FastAPI system (PostgreSQL).

## Migration Strategy

### Approach: Phased Migration with Parallel Run

1. **Phase 1**: Set up new system alongside old system
2. **Phase 2**: Migrate historical data (read-only)
3. **Phase 3**: Dual-write period (write to both systems)
4. **Phase 4**: Cutover to new system
5. **Phase 5**: Decommission old system

### Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 2 weeks | New system setup and testing |
| Phase 2 | 1 week | Historical data migration |
| Phase 3 | 2 weeks | Dual-write period for validation |
| Phase 4 | 1 day | Cutover weekend |
| Phase 5 | 1 month | Monitoring and old system decommission |

---

## Prerequisites

### Tools Required
- SQL Server Management Studio (SSMS)
- PostgreSQL client (psql or pgAdmin)
- Python 3.11+ with libraries:
  - `pyodbc` (SQL Server connection)
  - `psycopg2` (PostgreSQL connection)
  - `pandas` (data transformation)
  - `sqlalchemy` (ORM)
- Migration scripts (to be created)

### Access Required
- Read access to production SQL Server database
- Write access to new PostgreSQL database
- Backup of SQL Server database (for safety)

---

## Migration Order

**CRITICAL**: Tables must be migrated in dependency order to preserve foreign key relationships.

### Order of Migration

1. **Reference Tables (TR_*)** - No dependencies
   - TR_LNG_Language
   - TR_CUR_Currency
   - TR_MCU_Main_Currency
   - TR_SOC_Society
   - TR_ROL_Role
   - TR_SCR_Screen
   - TR_RIT_Right
   - TR_CIV_Civility
   - TR_PMO_Payment_Mode
   - TR_PCO_Payment_Condition
   - TR_VAT_Vat
   - TR_CTY_Client_Type
   - TR_ACT_Activity
   - TR_COU_Country
   - TR_REG_Region
   - TR_DEP_Department
   - TR_CMU_Commune
   - TR_POS_Position
   - TR_CST_CostPlan_Statut
   - TR_LTP_Line_Type
   - TR_ALB_Album
   - TR_PAL_Photo_Album
   - TR_BAC_Bank_Account
   - TR_STY_Supplier_Type
   - TR_DTP_Document_Type
   - TR_FRE_File_Recycle
   - TR_THF_Text_Header_Footer
   - TR_SPR_Supplier_Product (after TM_SUP_Supplier, TM_PRD_Product)

2. **Master Tables - Level 1** - Depend only on reference tables
   - TM_USR_User
   - TM_CLI_Client
   - TM_SUP_Supplier
   - TM_PTY_Product_Type
   - TM_PCT_Product_Catelogue
   - TM_WHS_WareHouse

3. **Master Tables - Level 2** - Depend on Level 1
   - TM_CCO_Client_Contact
   - TM_SCO_Supplier_Contact
   - TM_PTM_Product_Type_Matrix
   - TM_PRD_Product
   - TM_SHE_Shelves
   - TM_PRJ_Project

4. **Master Tables - Level 3** - Depend on Level 2
   - TM_PIT_Product_Instance
   - TM_CPL_Cost_Plan
   - TM_PIN_Purchase_Intent
   - TM_SOD_Supplier_Order
   - TM_LGS_Logistic

5. **Master Tables - Level 4** - Depend on Level 3
   - TM_CLN_CostPlan_Lines
   - TM_COD_Client_Order
   - TM_PIL_PurchaseIntent_Lines
   - TM_SOL_SupplierOrder_Lines
   - TM_SIN_Supplier_Invoice
   - TM_LGL_Logistic_Lines

6. **Master Tables - Level 5** - Depend on Level 4
   - TM_COL_ClientOrder_Lines
   - TM_DFO_Delivery_Form
   - TM_SIL_SupplierInvoice_Lines

7. **Master Tables - Level 6** - Depend on Level 5
   - TM_DFL_DevlieryForm_Line
   - TM_CIN_Client_Invoice

8. **Master Tables - Level 7** - Depend on Level 6
   - TM_CII_ClientInvoice_Line
   - TM_CPY_ClientInvoice_Payment

9. **Intermediate Tables (TI_*)** - Depend on master tables
   - TI_PIC_Product_In_Catelogue
   - TI_PIM_Product_Image
   - TI_PTI_Product_Instance_Image
   - TI_DOC_Document

10. **Site Tables (TS_*)** - Depend on master tables
    - TS_PRJ_Project
    - TS_PIG_Project_Image
    - TS_PPD_Project_Product
    - TS_TAG_Tags

---

## Migration Scripts

### Script 1: Export from SQL Server

```python
# export_from_sqlserver.py
import pyodbc
import pandas as pd
import json
from pathlib import Path

# Connection string
conn_str = (
    "DRIVER={SQL Server};"
    "SERVER=your_server;"
    "DATABASE=ERP_ECOLED;"
    "UID=your_user;"
    "PWD=your_password;"
)

# Output directory
output_dir = Path("migration_data")
output_dir.mkdir(exist_ok=True)

# Tables to export (in order)
tables = [
    "TR_LNG_Language",
    "TR_CUR_Currency",
    # ... all tables in dependency order
]

def export_table(conn, table_name):
    """Export table to CSV"""
    query = f"SELECT * FROM {table_name}"
    df = pd.read_sql(query, conn)
    
    # Save to CSV
    csv_path = output_dir / f"{table_name}.csv"
    df.to_csv(csv_path, index=False, encoding='utf-8')
    
    # Save metadata
    metadata = {
        "table_name": table_name,
        "row_count": len(df),
        "columns": list(df.columns),
        "exported_at": pd.Timestamp.now().isoformat()
    }
    
    json_path = output_dir / f"{table_name}_metadata.json"
    with open(json_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Exported {table_name}: {len(df)} rows")
    return len(df)

# Main export
with pyodbc.connect(conn_str) as conn:
    total_rows = 0
    for table in tables:
        rows = export_table(conn, table)
        total_rows += rows
    
    print(f"\nTotal rows exported: {total_rows}")
```

### Script 2: Transform and Import to PostgreSQL

```python
# import_to_postgresql.py
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from pathlib import Path
import uuid
from datetime import datetime

# PostgreSQL connection
pg_conn = psycopg2.connect(
    host="localhost",
    database="erp_db",
    user="erp_user",
    password="erp_password"
)

# Mapping of old IDs to new UUIDs
id_mapping = {}

def generate_uuid():
    return str(uuid.uuid4())

def import_table(table_name, model_name, column_mapping):
    """Import table with column mapping"""
    csv_path = Path("migration_data") / f"{table_name}.csv"
    df = pd.read_csv(csv_path)
    
    # Transform data
    transformed_rows = []
    for _, row in df.iterrows():
        new_row = {}
        
        # Generate new UUID
        old_id = row[f"{table_name.split('_')[1].lower()}_id"]
        new_id = generate_uuid()
        id_mapping[f"{table_name}_{old_id}"] = new_id
        
        new_row['id'] = new_id
        new_row['legacy_id'] = old_id
        new_row['migrated_at'] = datetime.now()
        
        # Map columns
        for old_col, new_col in column_mapping.items():
            if old_col in df.columns:
                value = row[old_col]
                # Handle NULL values
                if pd.isna(value):
                    new_row[new_col] = None
                else:
                    new_row[new_col] = value
        
        transformed_rows.append(new_row)
    
    # Insert into PostgreSQL
    if transformed_rows:
        columns = list(transformed_rows[0].keys())
        values = [[row[col] for col in columns] for row in transformed_rows]
        
        insert_query = f"""
            INSERT INTO {model_name.lower()}s ({', '.join(columns)})
            VALUES %s
        """
        
        with pg_conn.cursor() as cursor:
            execute_values(cursor, insert_query, values)
            pg_conn.commit()
        
        print(f"Imported {table_name} → {model_name}: {len(transformed_rows)} rows")

# Example: Import Language table
column_mapping_language = {
    'lng_label': 'label',
    'lng_short_label': 'short_label'
}

import_table('TR_LNG_Language', 'Language', column_mapping_language)

# ... repeat for all tables
```

---

## Validation Queries

After migration, run these queries to validate data integrity:

```sql
-- Check row counts match
SELECT 'languages' as table_name, COUNT(*) as count FROM languages
UNION ALL
SELECT 'currencies', COUNT(*) FROM currencies
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations
-- ... all tables

-- Check foreign key integrity
SELECT COUNT(*) FROM customers WHERE org_id NOT IN (SELECT id FROM organizations);
-- Should return 0

-- Check for NULL legacy_ids (should be none)
SELECT COUNT(*) FROM customers WHERE legacy_id IS NULL;

-- Check for duplicate legacy_ids (should be none)
SELECT legacy_id, COUNT(*) 
FROM customers 
GROUP BY legacy_id 
HAVING COUNT(*) > 1;
```

---

## Rollback Plan

If migration fails:

1. **Stop new system**
2. **Restore PostgreSQL from backup** (if partial migration)
3. **Continue using old system**
4. **Investigate and fix issues**
5. **Retry migration**

---

## Post-Migration Tasks

- [ ] Verify all row counts match
- [ ] Verify all foreign keys resolved correctly
- [ ] Run application smoke tests
- [ ] Test critical workflows (create order, create invoice, etc.)
- [ ] Monitor for errors in logs
- [ ] Keep old system running in read-only mode for 1 month
- [ ] Archive old system data after successful cutover


