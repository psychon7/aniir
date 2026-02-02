#!/usr/bin/env python3
"""Audit backend models against actual database schema."""
import json
import os
import re

def main():
    # Load DB schema
    schema_path = os.path.join(os.path.dirname(__file__), '..', 'db_schema.json')
    with open(schema_path, 'r') as f:
        db_schema = json.load(f)

    actual_tables = set(db_schema.keys())

    # Extract model table names from files
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'models')
    model_tables = {}

    for filename in os.listdir(model_dir):
        if filename.endswith('.py') and not filename.startswith('__'):
            filepath = os.path.join(model_dir, filename)
            with open(filepath, 'r') as f:
                content = f.read()
            # Find all __tablename__ declarations
            matches = re.findall(r'__tablename__\s*=\s*["\']([^"\']+)["\']', content)
            for table in matches:
                if table not in model_tables:
                    model_tables[table] = []
                model_tables[table].append(filename)

    print('=' * 70)
    print('MODEL TABLE AUDIT - COMPARISON WITH ACTUAL DB')
    print('=' * 70)
    print(f'Total actual DB tables: {len(actual_tables)}')
    print(f'Total model tables: {len(model_tables)}')
    print()

    # Categorize tables
    valid = []
    invalid = []

    for table, files in sorted(model_tables.items()):
        if table in actual_tables:
            valid.append((table, files))
        else:
            invalid.append((table, files))

    print(f'VALID TABLES ({len(valid)}):')
    print('-' * 40)
    for table, files in valid:
        print(f'  OK: {table}  <- {", ".join(files)}')

    print()
    print(f'INVALID/FICTIONAL TABLES ({len(invalid)}):')
    print('-' * 40)
    for table, files in invalid:
        # Find similar tables
        # Try to find tables with similar prefixes
        similar = [t for t in actual_tables if table[:3] in t]
        if not similar:
            # Try more relaxed matching
            words = table.replace('_', ' ').split()
            for word in words:
                if len(word) > 3:
                    similar.extend([t for t in actual_tables if word.lower() in t.lower()])
        similar = list(set(similar))[:5]

        print(f'  MISSING: {table}')
        print(f'    Files: {", ".join(files)}')
        if similar:
            print(f'    Possible matches: {similar}')
        print()

if __name__ == '__main__':
    main()

