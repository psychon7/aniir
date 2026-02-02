#!/usr/bin/env python3
"""Show schema for key tables."""
import json

with open('db_schema.json') as f:
    d = json.load(f)

key_tables = [
    'TM_CLI_CLient',
    'TM_CCO_Client_Contact', 
    'TM_CIN_Client_Invoice',
    'TM_CII_ClientInvoice_Line',
    'TM_CPY_ClientInvoice_Payment',
    'TM_COD_Client_Order',
    'TM_COL_ClientOrder_Lines',
    'TM_PRD_Product',
    'TM_PRJ_Project',
    'TM_SUP_Supplier',
    'TM_SCO_Supplier_Contact',
    'TM_SIN_Supplier_Invoice',
    'TM_SIL_SupplierInvoice_Lines',
    'TM_SOD_Supplier_Order',
    'TM_SOL_SupplierOrder_Lines',
    'TM_DFO_Delivery_Form',
    'TM_DFL_DevlieryForm_Line',
    'TM_LGS_Logistic',
    'TM_LGL_Logistic_Lines',
    'TM_WHS_WareHouse',
    'TM_INV_Inventory',
    'TM_USR_User',
    'TR_CUR_Currency',
    'TR_CTY_Client_Type',
    'TR_STT_Status',
    'TR_VAT_Vat',
    'TR_PMO_Payment_Mode',
    'TR_PCO_Payment_Condition',
    'TR_ROL_Role',
    'TR_SOC_Society',
    'TM_CAT_Category',
    'TR_COU_Country',
]

for table in key_tables:
    if table in d:
        print(f'\n=== {table} ===')
        for col in d[table]['columns']:
            pk = ' [PK]' if col['primary_key'] else ''
            null = 'NULL' if col['nullable'] else 'NOT NULL'
            length = f"({col['max_length']})" if col['max_length'] else ''
            print(f"  {col['name']}: {col['type']}{length} {null}{pk}")
        if 'foreign_keys' in d[table]:
            print('  Foreign Keys:')
            for fk in d[table]['foreign_keys']:
                print(f"    {fk['column']} -> {fk['references_table']}.{fk['references_column']}")
    else:
        print(f'TABLE NOT FOUND: {table}')

