"""
Test SQL Server connection to ECOLED database using pymssql.
"""
import pymssql

# Connection parameters
SERVER = "47.254.130.238"
USERNAME = "administrator"
PASSWORD = "2@24Courtry"
PORT = 1433

def test_connection():
    """Test basic connectivity to SQL Server."""
    print("=" * 60)
    print("ECOLED SQL Server Connection Test (pymssql)")
    print("=" * 60)
    print(f"\nServer: {SERVER}:{PORT}")
    print(f"Username: {USERNAME}")
    print("-" * 60)

    try:
        print("\nConnecting to SQL Server...")
        conn = pymssql.connect(
            server=SERVER,
            user=USERNAME,
            password=PASSWORD,
            port=PORT,
            login_timeout=15,
            tds_version="7.4"
        )
        print("✅ Successfully connected to SQL Server!")
        return conn
    except pymssql.Error as e:
        print(f"❌ Connection failed: {e}")
        return None


def list_databases(conn):
    """List available databases on the server."""
    print("\n" + "=" * 60)
    print("Available Databases:")
    print("=" * 60)

    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sys.databases ORDER BY name")

    databases = []
    for row in cursor.fetchall():
        db_name = row[0]
        databases.append(db_name)
        print(f"  - {db_name}")

    return databases


def list_tables(conn, database):
    """List tables in a specific database."""
    print(f"\n" + "-" * 60)
    print(f"Tables in '{database}':")
    print("-" * 60)

    cursor = conn.cursor()

    try:
        cursor.execute(f"USE [{database}]")
        cursor.execute("""
            SELECT TABLE_SCHEMA, TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        """)

        tables = []
        for row in cursor.fetchall():
            table_full = f"{row[0]}.{row[1]}"
            tables.append(table_full)

        # Print first 30 tables
        for t in tables[:30]:
            print(f"  - {t}")

        if len(tables) > 30:
            print(f"  ... and {len(tables) - 30} more tables")

        print(f"\n  Total: {len(tables)} tables")
        return tables
    except pymssql.Error as e:
        print(f"  ❌ Error accessing database: {e}")
        return []


def fetch_sample_data(conn, database, table_name, limit=5):
    """Fetch sample data from a table."""
    print(f"\n" + "-" * 60)
    print(f"Sample data from '{database}.{table_name}' (limit {limit}):")
    print("-" * 60)

    cursor = conn.cursor()

    try:
        cursor.execute(f"USE [{database}]")
        cursor.execute(f"SELECT TOP {limit} * FROM {table_name}")

        # Get column names
        columns = [column[0] for column in cursor.description]
        print(f"\nColumns: {', '.join(columns[:10])}" + ("..." if len(columns) > 10 else ""))

        rows = cursor.fetchall()
        print(f"Rows fetched: {len(rows)}")

        if rows:
            print("\nFirst row (sample):")
            for i, col in enumerate(columns[:10]):
                value = rows[0][i]
                if value is not None:
                    value_str = str(value)[:50] + ("..." if len(str(value)) > 50 else "")
                else:
                    value_str = "NULL"
                print(f"  {col}: {value_str}")

        return rows
    except pymssql.Error as e:
        print(f"  ❌ Error: {e}")
        return []


def count_records(conn, database, table_name):
    """Count records in a table."""
    cursor = conn.cursor()
    try:
        cursor.execute(f"USE [{database}]")
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        return count
    except:
        return 0


def main():
    """Main test function."""
    conn = test_connection()

    if conn is None:
        print("\n❌ Connection test failed. Please check:")
        print("  1. Server IP is accessible (firewall allows port 1433)")
        print("  2. SQL Server is configured for remote connections")
        print("  3. Credentials are correct")
        print("  4. SQL Server is running")
        return

    # List databases
    databases = list_databases(conn)

    # Look for ERP-related databases
    erp_databases = [db for db in databases if any(
        keyword in db.lower()
        for keyword in ['erp', 'ecoled', 'led', 'axtech', 'tm_', 'trading', 'eco']
    )]

    print("\n" + "=" * 60)
    print("ERP-related databases found:")
    print("=" * 60)
    if erp_databases:
        for db in erp_databases:
            print(f"  🎯 {db}")
    else:
        print("  (none with ERP-related names)")

    # Check user databases for ERP tables
    user_dbs = [db for db in databases if db not in ['master', 'tempdb', 'model', 'msdb']]

    print("\n" + "=" * 60)
    print("Scanning databases for TM_* tables (ERP convention)...")
    print("=" * 60)

    erp_db = None
    erp_tables = []

    for db in user_dbs:
        tables = list_tables(conn, db)

        # Look for TM_ prefixed tables (ERP convention)
        tm_tables = [t for t in tables if 'TM_' in t.upper()]
        if tm_tables:
            print(f"\n🎯 Found {len(tm_tables)} TM_* tables in '{db}'!")
            erp_db = db
            erp_tables = tm_tables

            # Show some key tables
            key_tables = [
                t for t in tm_tables
                if any(kw in t.upper() for kw in ['CLI', 'INV', 'ORD', 'PRO', 'USR', 'SOC'])
            ]
            print("\nKey ERP tables:")
            for t in key_tables[:15]:
                count = count_records(conn, db, t)
                print(f"  - {t} ({count:,} records)")

            break

    if erp_db and erp_tables:
        # Fetch sample from a table with data
        print("\n" + "=" * 60)
        print("Fetching sample data...")
        print("=" * 60)

        # Try to find a table with data
        for table in erp_tables[:10]:
            count = count_records(conn, erp_db, table)
            if count > 0:
                fetch_sample_data(conn, erp_db, table)
                break

    # Close connection
    conn.close()
    print("\n" + "=" * 60)
    print("✅ Connection test completed successfully!")
    print("=" * 60)

    # Print connection string for .env
    if erp_db:
        print("\n📋 Recommended DATABASE_URL for .env:")
        print(f'DATABASE_URL="mssql+pymssql://{USERNAME}:{PASSWORD}@{SERVER}:{PORT}/{erp_db}"')


if __name__ == "__main__":
    main()
