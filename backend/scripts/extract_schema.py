#!/usr/bin/env python3
"""Extract complete database schema from SQL Server."""
import pymssql
import json

def main():
    conn = pymssql.connect(
        server='47.254.130.238',
        user=r'iZ9x6t9u0t5n8Z\Administrator',
        password='2@24Courtry',
        database='DEV_ERP_ECOLED',
        tds_version='7.0'
    )
    cursor = conn.cursor()

    # Get all columns for all tables
    cursor.execute("""
        SELECT 
            t.TABLE_NAME,
            c.COLUMN_NAME,
            c.DATA_TYPE,
            c.CHARACTER_MAXIMUM_LENGTH,
            c.IS_NULLABLE,
            CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PK' ELSE '' END as IS_PK
        FROM INFORMATION_SCHEMA.TABLES t
        JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
        LEFT JOIN (
            SELECT ku.TABLE_NAME, ku.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
            WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
        ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
        WHERE t.TABLE_TYPE = 'BASE TABLE'
        ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    """)

    schema = {}
    for row in cursor.fetchall():
        table, col, dtype, max_len, nullable, is_pk = row
        if table not in schema:
            schema[table] = {"columns": []}
        
        col_info = {
            "name": col,
            "type": dtype,
            "max_length": max_len,
            "nullable": nullable == "YES",
            "primary_key": is_pk == "PK"
        }
        schema[table]["columns"].append(col_info)

    # Get foreign keys
    cursor.execute("""
        SELECT 
            fk.name AS FK_NAME,
            tp.name AS PARENT_TABLE,
            cp.name AS PARENT_COLUMN,
            tr.name AS REFERENCED_TABLE,
            cr.name AS REFERENCED_COLUMN
        FROM sys.foreign_keys fk
        INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
        INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
        INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
        INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    """)

    for row in cursor.fetchall():
        fk_name, parent_table, parent_col, ref_table, ref_col = row
        if parent_table in schema:
            if "foreign_keys" not in schema[parent_table]:
                schema[parent_table]["foreign_keys"] = []
            schema[parent_table]["foreign_keys"].append({
                "name": fk_name,
                "column": parent_col,
                "references_table": ref_table,
                "references_column": ref_col
            })

    conn.close()

    # Output as JSON
    print(json.dumps(schema, indent=2))

if __name__ == "__main__":
    main()

