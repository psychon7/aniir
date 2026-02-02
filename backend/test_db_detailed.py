"""
Detailed SQL Server connection test with multiple authentication methods.
"""
import pymssql

SERVER = "47.254.130.238"
PORT = 1433

# Test different credentials and configurations
test_configs = [
    # Windows auth style with domain
    {"user": "administrator", "password": "2@24Courtry", "desc": "administrator (direct)"},
    {"user": "sa", "password": "2@24Courtry", "desc": "sa user (SQL auth)"},
    {"user": ".\\administrator", "password": "2@24Courtry", "desc": "local admin (.\\)"},
    {"user": "ECOLED\\administrator", "password": "2@24Courtry", "desc": "domain admin"},
]

tds_versions = ["7.4", "7.3", "7.2", "7.1", "7.0"]

print("=" * 70)
print("ECOLED SQL Server Detailed Connection Test")
print("=" * 70)
print(f"Server: {SERVER}:{PORT}")
print("=" * 70)

# First, try basic connection with different TDS versions
print("\n[1] Testing TDS versions with 'administrator' user...")
print("-" * 70)

for tds in tds_versions:
    try:
        print(f"  TDS {tds}: ", end="", flush=True)
        conn = pymssql.connect(
            server=SERVER,
            user="administrator",
            password="2@24Courtry",
            port=PORT,
            login_timeout=10,
            tds_version=tds
        )
        print(f"✅ SUCCESS!")

        # Get server info
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"\n  Server Version: {version[:80]}...")
        conn.close()
        break
    except pymssql.Error as e:
        error_msg = str(e)[:60]
        print(f"❌ {error_msg}")

# Try different user formats
print("\n[2] Testing different user formats...")
print("-" * 70)

for config in test_configs:
    try:
        print(f"  {config['desc']}: ", end="", flush=True)
        conn = pymssql.connect(
            server=SERVER,
            user=config["user"],
            password=config["password"],
            port=PORT,
            login_timeout=10,
            tds_version="7.4"
        )
        print(f"✅ SUCCESS!")
        conn.close()
    except pymssql.Error as e:
        error_code = str(e)[:80]
        print(f"❌ {error_code}")

# Try with database name if we know it
print("\n[3] Testing with common database names...")
print("-" * 70)

common_dbs = ["master", "ECOLED", "EcoLed", "ERP", "TradingManager", "TM"]

for db in common_dbs:
    try:
        print(f"  Database '{db}': ", end="", flush=True)
        conn = pymssql.connect(
            server=SERVER,
            user="administrator",
            password="2@24Courtry",
            database=db,
            port=PORT,
            login_timeout=10,
            tds_version="7.4"
        )
        print(f"✅ SUCCESS!")
        conn.close()
    except pymssql.Error as e:
        error_code = str(e)[:60]
        print(f"❌ {error_code}")

print("\n" + "=" * 70)
print("If all tests fail with authentication errors, please verify:")
print("  1. SQL Server Authentication Mode is set to 'Mixed Mode'")
print("     (SQL Server Management Studio → Server Properties → Security)")
print("  2. The 'administrator' login exists in SQL Server")
print("     (SSMS → Security → Logins)")
print("  3. Or provide the correct SQL Server username (often 'sa')")
print("=" * 70)
