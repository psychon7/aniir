"""
SQL Server Connection Test
Tests database connectivity and validates existing schema.
"""
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError, ProgrammingError
from app.core.config import settings


def test_connection():
    """Test basic SQL Server connection."""
    print("=" * 60)
    print("SQL Server Connection Test")
    print("=" * 60)
    
    print(f"\n📡 Connection String: {settings.DATABASE_URL[:50]}...")
    
    try:
        engine = create_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10
        )
        
        with engine.connect() as conn:
            # Test 1: Basic connectivity
            result = conn.execute(text("SELECT 1 AS test"))
            row = result.fetchone()
            assert row[0] == 1
            print("✅ Basic connectivity: PASSED")
            
            # Test 2: Get SQL Server version
            result = conn.execute(text("SELECT @@VERSION"))
            version = result.fetchone()[0]
            print(f"✅ SQL Server Version: {version[:60]}...")
            
            # Test 3: Get database name
            result = conn.execute(text("SELECT DB_NAME()"))
            db_name = result.fetchone()[0]
            print(f"✅ Connected to database: {db_name}")
            
            # Test 4: Get server name
            result = conn.execute(text("SELECT @@SERVERNAME"))
            server_name = result.fetchone()[0]
            print(f"✅ Server name: {server_name}")
            
            return True, engine
            
    except OperationalError as e:
        print(f"❌ Connection failed: {e}")
        return False, None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False, None


def test_schema_exists(engine):
    """Verify expected tables exist in the database."""
    print("\n" + "=" * 60)
    print("Schema Validation")
    print("=" * 60)
    
    # Expected reference tables (TR_*)
    expected_reference_tables = [
        "TR_BU_BusinessUnit",
        "TR_COU_Country",
        "TR_CUR_Currency",
        "TR_VAT_VatRate",
        "TR_PAY_PaymentMode",
        "TR_PAY_PaymentTerm",
        "TR_STA_Status",
        "TR_CT_ClientType",
        "TR_CAT_Category",
        "TR_BRA_Brand",
        "TR_UOM_UnitOfMeasure",
        "TR_SOC_Society",
    ]
    
    # Expected master tables (TM_*)
    expected_master_tables = [
        "TM_CLI_Client",
        "TM_CLI_ClientAddress",
        "TM_CLI_ClientContact",
        "TM_SUP_Supplier",
        "TM_PRD_Product",
        "TM_QUO_Quote",
        "TM_QUO_QuoteLine",
        "TM_ORD_Order",
        "TM_ORD_OrderLine",
        "TM_INV_ClientInvoice",
        "TM_INV_ClientInvoiceLine",
    ]
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    print(f"\n📊 Total tables in database: {len(existing_tables)}")
    
    # Check reference tables
    print("\n📋 Reference Tables (TR_*):")
    ref_found = 0
    ref_missing = []
    for table in expected_reference_tables:
        if table in existing_tables:
            print(f"   ✅ {table}")
            ref_found += 1
        else:
            print(f"   ❌ {table} - MISSING")
            ref_missing.append(table)
    
    # Check master tables
    print("\n📋 Master Tables (TM_*):")
    master_found = 0
    master_missing = []
    for table in expected_master_tables:
        if table in existing_tables:
            print(f"   ✅ {table}")
            master_found += 1
        else:
            print(f"   ❌ {table} - MISSING")
            master_missing.append(table)
    
    # Summary
    print("\n" + "-" * 40)
    print(f"Reference tables: {ref_found}/{len(expected_reference_tables)}")
    print(f"Master tables: {master_found}/{len(expected_master_tables)}")
    
    return ref_missing, master_missing


def test_table_structure(engine, table_name: str):
    """Verify table structure matches expected schema."""
    inspector = inspect(engine)
    
    if table_name not in inspector.get_table_names():
        print(f"❌ Table {table_name} does not exist")
        return False
    
    columns = inspector.get_columns(table_name)
    pk = inspector.get_pk_constraint(table_name)
    fks = inspector.get_foreign_keys(table_name)
    indexes = inspector.get_indexes(table_name)
    
    print(f"\n📊 Table: {table_name}")
    print("-" * 40)
    
    print("Columns:")
    for col in columns:
        nullable = "NULL" if col['nullable'] else "NOT NULL"
        default = f" DEFAULT {col['default']}" if col.get('default') else ""
        print(f"   - {col['name']}: {col['type']} {nullable}{default}")
    
    print(f"\nPrimary Key: {pk.get('constrained_columns', [])}")
    
    if fks:
        print("Foreign Keys:")
        for fk in fks:
            print(f"   - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
    
    if indexes:
        print("Indexes:")
        for idx in indexes:
            unique = "UNIQUE " if idx['unique'] else ""
            print(f"   - {unique}{idx['name']}: {idx['column_names']}")
    
    return True


def test_sample_data(engine):
    """Check if reference tables have sample data."""
    print("\n" + "=" * 60)
    print("Sample Data Check")
    print("=" * 60)
    
    tables_to_check = [
        ("TR_BU_BusinessUnit", "Business Units"),
        ("TR_COU_Country", "Countries"),
        ("TR_CUR_Currency", "Currencies"),
        ("TR_VAT_VatRate", "VAT Rates"),
        ("TR_STA_Status", "Statuses"),
    ]
    
    with engine.connect() as conn:
        for table, label in tables_to_check:
            try:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                status = "✅" if count > 0 else "⚠️"
                print(f"   {status} {label}: {count} records")
            except ProgrammingError:
                print(f"   ❌ {label}: Table not found")
            except Exception as e:
                print(f"   ❌ {label}: Error - {e}")


def run_all_tests():
    """Run all connection and schema tests."""
    print("\n" + "🚀 Starting SQL Server Connection Tests" + "\n")
    
    # Test 1: Connection
    success, engine = test_connection()
    if not success:
        print("\n❌ Connection test failed. Cannot proceed with other tests.")
        return False
    
    # Test 2: Schema validation
    ref_missing, master_missing = test_schema_exists(engine)
    
    # Test 3: Sample table structure (if tables exist)
    if "TR_BU_BusinessUnit" in inspect(engine).get_table_names():
        test_table_structure(engine, "TR_BU_BusinessUnit")
    
    if "TM_CLI_Client" in inspect(engine).get_table_names():
        test_table_structure(engine, "TM_CLI_Client")
    
    # Test 4: Sample data
    test_sample_data(engine)
    
    # Final summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    if not ref_missing and not master_missing:
        print("✅ All expected tables found!")
        return True
    else:
        if ref_missing:
            print(f"⚠️ Missing reference tables: {ref_missing}")
        if master_missing:
            print(f"⚠️ Missing master tables: {master_missing}")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
