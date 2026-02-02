#!/usr/bin/env python3
"""
End-to-End Verification Script

This script verifies the complete data flow:
1. Database connectivity
2. API endpoints working
3. Data retrieval from actual MSSQL database

Run from backend directory:
    python scripts/verify_e2e.py
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def get_database_url():
    """Get database URL from environment or config."""
    # Try direct DATABASE_URL first
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return db_url
    
    # Build from components
    server = os.getenv("DB_SERVER", "localhost")
    port = os.getenv("DB_PORT", "1433")
    name = os.getenv("DB_NAME", "ERP_DB")
    user = os.getenv("DB_USER", "sa")
    password = os.getenv("DB_PASSWORD", "")
    driver = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server").replace(" ", "+")
    
    return f"mssql+pyodbc://{user}:{password}@{server}:{port}/{name}?driver={driver}&TrustServerCertificate=yes"


def test_direct_pyodbc():
    """Test connection using pyodbc directly with full driver path."""
    import pyodbc
    
    # Connection parameters
    server = "47.254.130.238"
    database = "ERP_ECOLED"
    username = "administrator"
    password = "2@24Courtry"
    
    # Try different driver paths
    driver_paths = [
        "ODBC Driver 18 for SQL Server",
        "/opt/homebrew/lib/libmsodbcsql.18.dylib",
        "/opt/homebrew/Cellar/msodbcsql18/18.6.1.1/lib/libmsodbcsql.18.dylib",
    ]
    
    for driver in driver_paths:
        print(f"\nTrying driver: {driver}")
        try:
            conn_str = (
                f"DRIVER={{{driver}}};"
                f"SERVER={server};"
                f"DATABASE={database};"
                f"UID={username};"
                f"PWD={password};"
                f"TrustServerCertificate=yes;"
                f"Encrypt=yes;"
            )
            conn = pyodbc.connect(conn_str, timeout=10)
            cursor = conn.cursor()
            cursor.execute("SELECT @@SERVERNAME, DB_NAME()")
            row = cursor.fetchone()
            print(f"✅ SUCCESS! Server: {row[0]}, Database: {row[1]}")
            conn.close()
            return driver
        except Exception as e:
            print(f"❌ Failed: {e}")


def test_database_connection():
    """Test basic database connectivity."""
    print("\n" + "="*60)
    print("STEP 1: Testing Database Connection")
    print("="*60)
    
    db_url = get_database_url()
    # Mask password in output
    safe_url = db_url.split("@")[1] if "@" in db_url else db_url
    print(f"Connecting to: ...@{safe_url}")
    
    try:
        engine = create_engine(db_url, echo=False)
        with engine.connect() as conn:
            # Test basic query
            result = conn.execute(text("SELECT @@SERVERNAME as server, DB_NAME() as database"))
            row = result.fetchone()
            print(f"✅ Connected successfully!")
            print(f"   Server: {row[0]}")
            print(f"   Database: {row[1]}")
            return engine
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None


def test_table_existence(engine):
    """Check if expected ERP tables exist."""
    print("\n" + "="*60)
    print("STEP 2: Checking ERP Tables")
    print("="*60)
    
    # Key tables from the original .NET ERP
    expected_tables = [
        "TM_CLI_Client",           # Clients
        "TM_PRD_Product",          # Products
        "TM_SUP_Supplier",         # Suppliers
        "TM_QUO_Quote",            # Quotes
        "TM_ORD_Order",            # Orders
        "TM_INV_Invoice",          # Invoices
        "TR_STA_Status",           # Status lookup
        "TR_BU_BusinessUnit",      # Business units
        "TR_CUR_Currency",         # Currencies
        "TR_CTY_Country",          # Countries
    ]
    
    found = []
    missing = []
    
    with engine.connect() as conn:
        for table in expected_tables:
            result = conn.execute(text(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = :table"
            ), {"table": table})
            count = result.fetchone()[0]
            
            if count > 0:
                found.append(table)
                # Get row count
                try:
                    row_result = conn.execute(text(f"SELECT COUNT(*) FROM [{table}]"))
                    row_count = row_result.fetchone()[0]
                    print(f"✅ {table}: {row_count} rows")
                except Exception as e:
                    print(f"✅ {table}: exists (count error: {e})")
            else:
                missing.append(table)
                print(f"❌ {table}: NOT FOUND")
    
    print(f"\nSummary: {len(found)}/{len(expected_tables)} tables found")
    return found, missing


def test_sample_data(engine):
    """Fetch sample data from key tables."""
    print("\n" + "="*60)
    print("STEP 3: Fetching Sample Data")
    print("="*60)
    
    queries = {
        "Clients": "SELECT TOP 5 CLI_ID, CLI_Reference, CLI_CompanyName FROM TM_CLI_Client ORDER BY CLI_ID",
        "Products": "SELECT TOP 5 PRD_ID, PRD_Reference, PRD_Name FROM TM_PRD_Product ORDER BY PRD_ID",
        "Statuses": "SELECT TOP 5 STA_ID, STA_Name FROM TR_STA_Status ORDER BY STA_ID",
    }
    
    with engine.connect() as conn:
        for name, query in queries.items():
            print(f"\n--- {name} ---")
            try:
                result = conn.execute(text(query))
                rows = result.fetchall()
                if rows:
                    for row in rows:
                        print(f"  {row}")
                else:
                    print("  (no data)")
            except Exception as e:
                print(f"  Error: {e}")


def test_api_endpoints():
    """Test FastAPI endpoints (requires server running)."""
    print("\n" + "="*60)
    print("STEP 4: Testing API Endpoints")
    print("="*60)
    print("Note: This requires the FastAPI server to be running on port 8000")
    
    try:
        import httpx
    except ImportError:
        print("⚠️  httpx not installed. Install with: pip install httpx")
        return
    
    base_url = "http://localhost:8000"
    
    endpoints = [
        ("/health", "Health Check"),
        ("/api/v1/health", "API Health"),
        ("/api/v1/health/db", "Database Health"),
        ("/api/v1/clients?limit=5", "Clients List"),
    ]
    
    for endpoint, name in endpoints:
        try:
            response = httpx.get(f"{base_url}{endpoint}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: OK")
                # Show sample of response
                if isinstance(data, dict):
                    keys = list(data.keys())[:3]
                    print(f"   Response keys: {keys}")
            else:
                print(f"⚠️  {name}: HTTP {response.status_code}")
        except httpx.ConnectError:
            print(f"❌ {name}: Server not running at {base_url}")
            break
        except Exception as e:
            print(f"❌ {name}: {e}")


def main():
    print("\n" + "#"*60)
    print("# ERP End-to-End Verification")
    print("#"*60)
    
    # Step 0: Test direct pyodbc connection first
    print("\n" + "="*60)
    print("STEP 0: Testing Direct pyodbc Connection")
    print("="*60)
    working_driver = test_direct_pyodbc()
    if not working_driver:
        print("\n❌ No working driver found. Check ODBC installation.")
        return
    
    # Step 1: Database connection
    engine = test_database_connection()
    if not engine:
        print("\n❌ Cannot proceed without database connection.")
        print("\nTroubleshooting:")
        print("1. Check if SQL Server is running")
        print("2. Verify credentials in backend/.env")
        print("3. Ensure ODBC Driver 18 is installed")
        sys.exit(1)
    
    # Step 2: Check tables
    found, missing = test_table_existence(engine)
    
    # Step 3: Sample data
    if found:
        test_sample_data(engine)
    
    # Step 4: API endpoints
    test_api_endpoints()
    
    print("\n" + "#"*60)
    print("# Verification Complete")
    print("#"*60)
    
    if missing:
        print(f"\n⚠️  {len(missing)} tables missing - some features may not work")
    else:
        print("\n✅ All expected tables found!")
    
    print("\nNext Steps:")
    print("1. Start backend: cd backend && uvicorn app.main:app --reload")
    print("2. Start frontend: cd frontend && npm run dev")
    print("3. Open http://localhost:5173 in browser")
    print("4. Navigate to Clients page to see real data")


if __name__ == "__main__":
    main()
