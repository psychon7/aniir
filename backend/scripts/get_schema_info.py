#!/usr/bin/env python3
"""Script to get schema information for specific tables."""
import json

with open('db_schema.json', 'r') as f:
    d = json.load(f)

tables = [
    'TM_CCO_Client_Contact', 
    'TM_DFO_Delivery_Form', 
    'TM_DFL_DevlieryForm_Line', 
    'TM_CPY_ClientInvoice_Payment'
]

for t in tables:
    if t in d:
        print(f'=== {t} ===')
        for col in d[t]['columns']:
            null = 'NULL' if col['nullable'] else 'NOT NULL'
            pk = ' [PK]' if col['primary_key'] else ''
            ml = f"({col['max_length']})" if col.get('max_length') else ''
            print(f"  {col['name']}: {col['type']}{ml} {null}{pk}")
        print('Foreign Keys:')
        for fk in d[t].get('foreign_keys', []):
            print(f"  {fk['column']} -> {fk['references_table']}.{fk['references_column']}")
        print()
    else:
        print(f'TABLE NOT FOUND: {t}')
        print()

