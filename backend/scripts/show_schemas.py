#!/usr/bin/env python3
"""Quick script to show table schemas for the models we need to fix."""
import json

with open('db_schema.json', 'r') as f:
    d = json.load(f)

tables = [
    'TM_CPL_Cost_Plan',
    'TM_CLN_CostPlan_Lines', 
    'TM_CCO_Client_Contact',
    'TM_DFO_Delivery_Form',
    'TM_DFL_DevlieryForm_Line',
    'TM_CPY_ClientInvoice_Payment',
    'TM_LGS_Logistic',
    'TM_CAT_Category',
    'TM_WHS_WareHouse'
]

for table in tables:
    if table in d:
        print(f'=== {table} ===')
        for col in d[table]['columns']:
            null = 'NULL' if col['nullable'] else 'NOT NULL'
            pk = ' [PK]' if col['primary_key'] else ''
            ml = f"({col['max_length']})" if col['max_length'] else ''
            print(f"  {col['name']}: {col['type']}{ml} {null}{pk}")
        print()
        if d[table]['foreign_keys']:
            print('Foreign Keys:')
            for fk in d[table]['foreign_keys']:
                print(f"  {fk['column']} -> {fk['references_table']}.{fk['references_column']}")
            print()
    else:
        print(f'TABLE NOT FOUND: {table}\n')

