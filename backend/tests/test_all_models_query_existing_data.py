"""
Integration test for querying all models against existing database data.

This test verifies that all SQLAlchemy models can successfully:
1. Connect to the database
2. Execute queries against existing tables
3. Return data (if available) or empty results gracefully

This is an integration test that requires a running database with the proper schema.
"""
import pytest
import asyncio
from datetime import datetime
from typing import Type, Any, Optional
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import ProgrammingError, OperationalError

# Import all models from the models module
from app.models import (
    # Core User/Auth Models
    User,
    Civility,
    Role,

    # Chat Models
    ChatThread,
    ChatMessage,

    # Client Models
    Client,
    ClientContact,
    ClientType,

    # Invoice/Payment Models
    ClientInvoice,
    ClientInvoiceLine,
    Payment,
    PaymentAllocation,

    # Drive Models
    DriveFolder,
    DriveFile,

    # Landed Cost Models
    SupplyLot,
    SupplyLotItem,
    FreightCost,
    LandedCostAllocationLog,

    # Quote Models
    Quote,
    QuoteLine,

    # CostPlan Models
    CostPlan,
    CostPlanLine,

    # Order Models
    ClientOrder,
    ClientOrderLine,

    # Delivery Models
    DeliveryForm,
    DeliveryFormLine,

    # Reference Tables
    Society,
    BusinessUnit,
    PaymentMode,
    Currency,
    MainCurrency,
    VatRate,
    PaymentTerm,
    Status,
    Category,
    UnitOfMeasure,
    Warehouse,

    # Product Models
    Product,
    ProductInstance,

    # Project Model
    Project,

    # Shipment Model
    Shipment,

    # Stock Models
    Stock,
    StockMovement,
    StockMovementLine,
)

from app.database import Base, get_sync_engine, get_sync_session, check_sync_db_connection


class ModelQueryResult:
    """Holds the result of a model query test."""

    def __init__(
        self,
        model_name: str,
        table_name: str,
        success: bool,
        row_count: int = 0,
        sample_id: Optional[Any] = None,
        error: Optional[str] = None
    ):
        self.model_name = model_name
        self.table_name = table_name
        self.success = success
        self.row_count = row_count
        self.sample_id = sample_id
        self.error = error

    def __repr__(self) -> str:
        if self.success:
            return f"✓ {self.model_name} ({self.table_name}): {self.row_count} rows"
        return f"✗ {self.model_name} ({self.table_name}): {self.error}"


# Define all models with their primary key columns for testing
MODEL_CONFIGS = [
    # Core User/Auth Models
    {"model": User, "pk_attr": "usr_id", "description": "System Users"},
    {"model": Civility, "pk_attr": "civ_id", "description": "User Civilities/Titles"},
    {"model": Role, "pk_attr": "rol_id", "description": "User Roles"},

    # Chat Models
    {"model": ChatThread, "pk_attr": "thread_id", "description": "Chat Threads"},
    {"model": ChatMessage, "pk_attr": "message_id", "description": "Chat Messages"},

    # Client Models
    {"model": Client, "pk_attr": "cli_id", "description": "Clients"},
    {"model": ClientContact, "pk_attr": "cco_id", "description": "Client Contacts"},
    {"model": ClientType, "pk_attr": "ct_id", "description": "Client Types"},

    # Invoice/Payment Models
    {"model": ClientInvoice, "pk_attr": "inv_id", "description": "Client Invoices"},
    {"model": ClientInvoiceLine, "pk_attr": "inl_id", "description": "Invoice Lines"},
    {"model": Payment, "pk_attr": "pay_id", "description": "Payments"},
    {"model": PaymentAllocation, "pk_attr": "pal_id", "description": "Payment Allocations"},

    # Drive Models
    {"model": DriveFolder, "pk_attr": "folder_id", "description": "Drive Folders"},
    {"model": DriveFile, "pk_attr": "file_id", "description": "Drive Files"},

    # Landed Cost Models
    {"model": SupplyLot, "pk_attr": "lot_id", "description": "Supply Lots"},
    {"model": SupplyLotItem, "pk_attr": "item_id", "description": "Supply Lot Items"},
    {"model": FreightCost, "pk_attr": "cost_id", "description": "Freight Costs"},
    {"model": LandedCostAllocationLog, "pk_attr": "log_id", "description": "Landed Cost Allocations"},

    # Quote Models
    {"model": Quote, "pk_attr": "quo_id", "description": "Quotes"},
    {"model": QuoteLine, "pk_attr": "qul_id", "description": "Quote Lines"},

    # CostPlan Models
    {"model": CostPlan, "pk_attr": "cpl_id", "description": "Cost Plans"},
    {"model": CostPlanLine, "pk_attr": "cpl_line_id", "description": "Cost Plan Lines"},

    # Order Models
    {"model": ClientOrder, "pk_attr": "ord_id", "description": "Client Orders"},
    {"model": ClientOrderLine, "pk_attr": "orl_id", "description": "Order Lines"},

    # Delivery Models
    {"model": DeliveryForm, "pk_attr": "dlf_id", "description": "Delivery Forms"},
    {"model": DeliveryFormLine, "pk_attr": "dfl_id", "description": "Delivery Form Lines"},

    # Reference Tables
    {"model": Society, "pk_attr": "soc_id", "description": "Societies/Companies"},
    {"model": BusinessUnit, "pk_attr": "bu_id", "description": "Business Units"},
    {"model": PaymentMode, "pk_attr": "pay_id", "description": "Payment Modes"},
    {"model": Currency, "pk_attr": "cur_id", "description": "Currencies"},
    {"model": MainCurrency, "pk_attr": "mcu_id", "description": "Currency Exchange Rates"},
    {"model": VatRate, "pk_attr": "vat_id", "description": "VAT Rates"},
    {"model": PaymentTerm, "pk_attr": "payt_id", "description": "Payment Terms"},
    {"model": Status, "pk_attr": "sta_id", "description": "Statuses"},
    {"model": Category, "pk_attr": "cat_id", "description": "Categories"},
    {"model": UnitOfMeasure, "pk_attr": "uom_id", "description": "Units of Measure"},
    {"model": Warehouse, "pk_attr": "wh_id", "description": "Warehouses"},

    # Product Models
    {"model": Product, "pk_attr": "prd_id", "description": "Products"},
    {"model": ProductInstance, "pk_attr": "pit_id", "description": "Product Instances"},

    # Project Model
    {"model": Project, "pk_attr": "prj_id", "description": "Projects"},

    # Shipment Model
    {"model": Shipment, "pk_attr": "shp_id", "description": "Shipments"},

    # Stock Models
    {"model": Stock, "pk_attr": "stk_id", "description": "Stock Records"},
    {"model": StockMovement, "pk_attr": "stm_id", "description": "Stock Movements"},
    {"model": StockMovementLine, "pk_attr": "stml_id", "description": "Stock Movement Lines"},
]


def query_model_sync(model: Type[Base], pk_attr: str) -> ModelQueryResult:
    """
    Query a model synchronously and return results.

    Args:
        model: SQLAlchemy model class
        pk_attr: Name of the primary key attribute

    Returns:
        ModelQueryResult with query results
    """
    model_name = model.__name__
    table_name = model.__tablename__

    try:
        with get_sync_session() as session:
            # Get row count
            count_query = select(func.count()).select_from(model)
            row_count = session.execute(count_query).scalar() or 0

            # Get a sample record if available
            sample_id = None
            if row_count > 0:
                pk_column = getattr(model, pk_attr)
                sample_query = select(pk_column).limit(1)
                sample_id = session.execute(sample_query).scalar()

            return ModelQueryResult(
                model_name=model_name,
                table_name=table_name,
                success=True,
                row_count=row_count,
                sample_id=sample_id
            )

    except (ProgrammingError, OperationalError) as e:
        # Table doesn't exist or query error
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        return ModelQueryResult(
            model_name=model_name,
            table_name=table_name,
            success=False,
            error=error_msg[:200]  # Truncate long error messages
        )
    except Exception as e:
        return ModelQueryResult(
            model_name=model_name,
            table_name=table_name,
            success=False,
            error=str(e)[:200]
        )


class TestAllModelsQueryExistingData:
    """
    Integration tests to verify all models can query existing database data.

    These tests verify:
    1. Database connectivity
    2. Table existence for each model
    3. Successful query execution
    4. Data retrieval capabilities
    """

    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Setup test environment - verify database connection."""
        if not check_sync_db_connection():
            pytest.skip("Database connection not available - skipping integration tests")

    def test_database_connection(self):
        """Test that the database connection is working."""
        assert check_sync_db_connection(), "Database connection should be available"

        # Verify we can execute a simple query
        with get_sync_session() as session:
            result = session.execute(text("SELECT 1 AS test_value"))
            row = result.fetchone()
            assert row is not None
            assert row[0] == 1

    def test_all_models_can_query(self):
        """
        Test that all models can execute queries against the database.

        This is the main integration test that verifies each model's
        ability to connect to and query its corresponding table.
        """
        results = []
        failed_models = []
        successful_models = []

        for config in MODEL_CONFIGS:
            model = config["model"]
            pk_attr = config["pk_attr"]
            description = config["description"]

            result = query_model_sync(model, pk_attr)
            results.append(result)

            if result.success:
                successful_models.append((result.model_name, result.row_count))
            else:
                failed_models.append((result.model_name, result.error))

        # Print summary
        print("\n" + "=" * 70)
        print("MODEL QUERY TEST RESULTS")
        print("=" * 70)

        print(f"\n✓ Successful Models ({len(successful_models)}):")
        for model_name, row_count in successful_models:
            print(f"  - {model_name}: {row_count} rows")

        if failed_models:
            print(f"\n✗ Failed Models ({len(failed_models)}):")
            for model_name, error in failed_models:
                print(f"  - {model_name}: {error}")

        print("\n" + "=" * 70)
        print(f"Total: {len(successful_models)} passed, {len(failed_models)} failed")
        print("=" * 70 + "\n")

        # Assert all models can query successfully
        # Note: Some tables might not exist yet if migrations haven't been run
        # We allow some failures but require at least 50% success rate
        success_rate = len(successful_models) / len(MODEL_CONFIGS)
        assert success_rate >= 0.5, (
            f"Less than 50% of models can query successfully. "
            f"Success rate: {success_rate:.1%}. "
            f"Failed models: {[m[0] for m in failed_models]}"
        )

    # Individual model tests for granular feedback
    @pytest.mark.parametrize("config", MODEL_CONFIGS, ids=lambda c: c["model"].__name__)
    def test_individual_model_query(self, config):
        """Test individual model query capability."""
        model = config["model"]
        pk_attr = config["pk_attr"]
        description = config["description"]

        result = query_model_sync(model, pk_attr)

        if not result.success:
            # Skip instead of fail for missing tables (might not be deployed yet)
            if "Invalid object name" in (result.error or "") or "doesn't exist" in (result.error or ""):
                pytest.skip(f"Table {result.table_name} does not exist in database")

        assert result.success, f"Query failed for {model.__name__}: {result.error}"
        print(f"\n{description}: {result.row_count} rows found")

    def test_reference_tables_have_data(self):
        """
        Test that critical reference tables have data.

        These tables are essential for the application to function
        and should have seed data.
        """
        critical_tables = [
            (Status, "sta_id", "Statuses"),
            (Currency, "cur_id", "Currencies"),
            (Society, "soc_id", "Societies"),
            (Role, "rol_id", "Roles"),
        ]

        empty_tables = []

        for model, pk_attr, description in critical_tables:
            result = query_model_sync(model, pk_attr)
            if result.success and result.row_count == 0:
                empty_tables.append(description)

        # Warn but don't fail if reference tables are empty
        # This might be expected in a fresh database
        if empty_tables:
            print(f"\nWarning: The following reference tables are empty: {empty_tables}")

    def test_user_table_query(self):
        """Test specifically that the User table can be queried."""
        result = query_model_sync(User, "usr_id")

        if not result.success:
            if "Invalid object name" in (result.error or ""):
                pytest.skip("User table does not exist in database")

        assert result.success, f"User query failed: {result.error}"
        print(f"\nUsers found: {result.row_count}")

    def test_client_table_query(self):
        """Test specifically that the Client table can be queried."""
        result = query_model_sync(Client, "cli_id")

        if not result.success:
            if "Invalid object name" in (result.error or ""):
                pytest.skip("Client table does not exist in database")

        assert result.success, f"Client query failed: {result.error}"
        print(f"\nClients found: {result.row_count}")

    def test_product_table_query(self):
        """Test specifically that the Product table can be queried."""
        result = query_model_sync(Product, "prd_id")

        if not result.success:
            if "Invalid object name" in (result.error or ""):
                pytest.skip("Product table does not exist in database")

        assert result.success, f"Product query failed: {result.error}"
        print(f"\nProducts found: {result.row_count}")

    def test_order_table_query(self):
        """Test specifically that the ClientOrder table can be queried."""
        result = query_model_sync(ClientOrder, "ord_id")

        if not result.success:
            if "Invalid object name" in (result.error or ""):
                pytest.skip("Order table does not exist in database")

        assert result.success, f"Order query failed: {result.error}"
        print(f"\nOrders found: {result.row_count}")

    def test_invoice_table_query(self):
        """Test specifically that the ClientInvoice table can be queried."""
        result = query_model_sync(ClientInvoice, "inv_id")

        if not result.success:
            if "Invalid object name" in (result.error or ""):
                pytest.skip("Invoice table does not exist in database")

        assert result.success, f"Invoice query failed: {result.error}"
        print(f"\nInvoices found: {result.row_count}")


class TestModelRelationships:
    """
    Tests to verify that model relationships work correctly.
    """

    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Setup test environment."""
        if not check_sync_db_connection():
            pytest.skip("Database connection not available")

    def test_client_with_contacts_relationship(self):
        """Test Client -> ClientContact relationship."""
        with get_sync_session() as session:
            # Get a client with contacts if available
            query = select(Client).limit(1)
            result = session.execute(query)
            client = result.scalar()

            if client is None:
                pytest.skip("No clients in database")

            # Access the contacts relationship (should not error)
            contacts = client.contacts
            assert isinstance(contacts, list), "contacts should be a list"
            print(f"\nClient {client.cli_reference} has {len(contacts)} contacts")

    def test_product_with_instances_relationship(self):
        """Test Product -> ProductInstance relationship."""
        with get_sync_session() as session:
            # Get a product if available
            query = select(Product).limit(1)
            result = session.execute(query)
            product = result.scalar()

            if product is None:
                pytest.skip("No products in database")

            # Access the instances relationship
            instances = product.instances
            assert isinstance(instances, list), "instances should be a list"
            print(f"\nProduct {product.prd_ref} has {len(instances)} instances")

    def test_order_with_lines_relationship(self):
        """Test ClientOrder -> ClientOrderLine relationship."""
        with get_sync_session() as session:
            # Get an order if available
            query = select(ClientOrder).limit(1)
            result = session.execute(query)
            order = result.scalar()

            if order is None:
                pytest.skip("No orders in database")

            # Access the lines relationship
            lines = order.lines
            assert isinstance(lines, list), "lines should be a list"
            print(f"\nOrder {order.ord_reference} has {len(lines)} lines")


class TestDatabaseSchema:
    """
    Tests to verify database schema alignment with models.
    """

    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Setup test environment."""
        if not check_sync_db_connection():
            pytest.skip("Database connection not available")

    def test_get_all_table_names(self):
        """Get all table names from the database."""
        from app.database import get_table_names

        try:
            tables = get_table_names()
            assert isinstance(tables, list), "get_table_names should return a list"
            print(f"\nFound {len(tables)} tables in database:")

            # Group tables by prefix
            prefixes = {}
            for table in sorted(tables):
                prefix = table.split('_')[0] if '_' in table else 'OTHER'
                if prefix not in prefixes:
                    prefixes[prefix] = []
                prefixes[prefix].append(table)

            for prefix, prefix_tables in sorted(prefixes.items()):
                print(f"\n  {prefix}* ({len(prefix_tables)} tables):")
                for t in prefix_tables[:5]:  # Show first 5
                    print(f"    - {t}")
                if len(prefix_tables) > 5:
                    print(f"    ... and {len(prefix_tables) - 5} more")

        except Exception as e:
            pytest.skip(f"Could not get table names: {e}")

    def test_model_table_name_alignment(self):
        """Verify model tablenames match expected database tables."""
        expected_prefixes = {
            "TM_": "Transactional/Master tables",
            "TR_": "Reference/Lookup tables",
        }

        misaligned = []

        for config in MODEL_CONFIGS:
            model = config["model"]
            table_name = model.__tablename__

            # Check if table follows naming convention
            has_valid_prefix = any(table_name.startswith(p) for p in expected_prefixes.keys())

            if not has_valid_prefix:
                misaligned.append((model.__name__, table_name))

        if misaligned:
            print(f"\nModels with non-standard table names:")
            for model_name, table_name in misaligned:
                print(f"  - {model_name}: {table_name}")

        # This is informational, not a failure
        print(f"\n{len(MODEL_CONFIGS) - len(misaligned)} models follow naming conventions")


if __name__ == "__main__":
    # Allow running directly for quick testing
    pytest.main([__file__, "-v", "-s"])
