"""
Test SQL Server connection to ECOLED database.
"""
import sys

try:
    import pyodbc
except ImportError:
    print("Installing pyodbc...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyodbc", "-q"])
    import pyodbc

# Connection parameters
SERVER = "47.254.130.238"
USERNAME = "administrator"
PASSWORD = "2@24Courtry"

def test_connection():
    """Test basic connectivity to SQL Server."""
    print("=" * 60)
    print("ECOLED SQL Server Connection Test")
    print("=" * 60)
    print(f"\nServer: {SERVER}")
    print(f"Username: {USERNAME}")
    print("-" * 60)

    # Try different ODBC drivers
    drivers = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "SQL Server Native Client 11.0",
        "SQL Server",
    ]

    # List available drivers
    print("\nAvailable ODBC Drivers:")
    available_drivers = pyodbc.drivers()
    for d in available_drivers:
        print(f"  - {d}")
    print()

    connected = False
    working_driver = None

    for driver in drivers:
        if driver not in available_drivers:
            print(f"Trying driver '{driver}' - NOT INSTALLED, skipping...")
            continue

        print(f"Trying driver '{driver}'...")

        # Build connection string
        conn_str = (
            f"DRIVER={{{driver}}};"
            f"SERVER={SERVER};"
            f"UID={USERNAME};"
            f"PWD={PASSWORD};"
            f"TrustServerCertificate=yes;"
            f"Encrypt=optional;"
            f"Connection Timeout=10;"
        )

        try:
            conn = pyodbc.connect(conn_str, timeout=10)
            print(f"  ✅ SUCCESS! Connected with driver: {driver}")
            connected = True
            working_driver = driver
            break
        except pyodbc.Error as e:
            print(f"  ❌ Failed: {str(e)[:100]}")

    if not connected:
        print("\n❌ Could not connect with any driver")
        return None

    return conn, working_driver


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
            print(f"  - {table_full}")

        print(f"\n  Total: {len(tables)} tables")
        return tables
    except pyodbc.Error as e:
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
    except pyodbc.Error as e:
        print(f"  ❌ Error: {e}")
        return []


def main():
    """Main test function."""
    result = test_connection()

    if result is None:
        print("\n❌ Connection test failed. Please check:")
        print("  1. Server IP is accessible (firewall allows port 1433)")
        print("  2. SQL Server is configured for remote connections")
        print("  3. Credentials are correct")
        print("  4. ODBC Driver is installed")
        return

    conn, driver = result

    # List databases
    databases = list_databases(conn)

    # Look for ERP-related databases
    erp_databases = [db for db in databases if any(
        keyword in db.lower()
        for keyword in ['erp', 'ecoled', 'led', 'axtech', 'tm_', 'trading']
    )]

    print("\n" + "=" * 60)
    print("ERP-related databases found:")
    print("=" * 60)
    if erp_databases:
        for db in erp_databases:
            print(f"  🎯 {db}")
    else:
        print("  (none with ERP-related names)")
        print("\n  Checking all user databases for ERP tables...")

    # Check each database for ERP tables
    user_dbs = [db for db in databases if db not in ['master', 'tempdb', 'model', 'msdb']]

    for db in user_dbs[:5]:  # Check first 5 user databases
        tables = list_tables(conn, db)

        # Look for TM_ prefixed tables (ERP convention)
        tm_tables = [t for t in tables if 'TM_' in t.upper()]
        if tm_tables:
            print(f"\n🎯 Found {len(tm_tables)} TM_* tables in '{db}'!")

            # Fetch sample from first TM table
            if tm_tables:
                fetch_sample_data(conn, db, tm_tables[0])
            break

    # Close connection
    conn.close()
    print("\n" + "=" * 60)
    print("✅ Connection test completed successfully!")
    print("=" * 60)

    # Print connection string for .env
    print("\n📋 Recommended DATABASE_URL for .env:")
    print(f'DATABASE_URL="mssql+pyodbc://{USERNAME}:{PASSWORD}@{SERVER}/YOUR_DB_NAME?driver={driver.replace(" ", "+")}&TrustServerCertificate=yes"')


if __name__ == "__main__":
    main()
