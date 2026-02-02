"""
Tests for the Statement Service.

Verifies:
- Customer statement generation
- Vendor statement generation
- Statement export to CSV, PDF, Excel
- Batch statement generation
- Outstanding balance calculations
- Aging summary calculations
"""
import pytest
import sys
import os
from datetime import datetime, date, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

# Add parent directory to path for direct imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock the problematic imports before importing statement_service
# This allows us to test without all the heavy dependencies
import importlib.util
spec = importlib.util.spec_from_file_location(
    "statement_service",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app/services/statement_service.py")
)
statement_service_module = importlib.util.module_from_spec(spec)

# Mock the models and config before loading
sys.modules['app.models.invoice'] = MagicMock()
sys.modules['app.models.payment'] = MagicMock()
sys.modules['app.models.client'] = MagicMock()
sys.modules['app.models.supplier'] = MagicMock()
sys.modules['app.config.settings'] = MagicMock()

# Create mock InvoiceStatus
mock_invoice_status = MagicMock()
mock_invoice_status.DRAFT = "DRAFT"
mock_invoice_status.SENT = "SENT"
mock_invoice_status.PARTIAL = "PARTIAL"
mock_invoice_status.PAID = "PAID"
mock_invoice_status.OVERDUE = "OVERDUE"
sys.modules['app.config.settings'].InvoiceStatus = mock_invoice_status
sys.modules['app.config.settings'].get_settings = MagicMock(return_value=MagicMock())

spec.loader.exec_module(statement_service_module)

# Now import from the loaded module
StatementService = statement_service_module.StatementService
StatementServiceError = statement_service_module.StatementServiceError
ClientNotFoundError = statement_service_module.ClientNotFoundError
SupplierNotFoundError = statement_service_module.SupplierNotFoundError
InvalidDateRangeError = statement_service_module.InvalidDateRangeError
ExportError = statement_service_module.ExportError
StatementType = statement_service_module.StatementType
ExportFormat = statement_service_module.ExportFormat
TransactionType = statement_service_module.TransactionType
StatementTransaction = statement_service_module.StatementTransaction
get_statement_service = statement_service_module.get_statement_service


# ==========================================================================
# Fixtures
# ==========================================================================

@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = AsyncMock()
    db.execute = AsyncMock()
    db.flush = AsyncMock()
    db.add = MagicMock()
    return db


@pytest.fixture
def statement_service(mock_db):
    """Create a statement service instance with mock db."""
    return StatementService(mock_db)


@pytest.fixture
def sample_client():
    """Create a sample client for testing."""
    client = MagicMock()
    client.cli_id = 100
    client.cli_reference = "CLI-0001"
    client.cli_company_name = "Test Company Ltd"
    client.cli_address = "123 Test Street"
    client.cli_city = "Test City"
    client.cli_postal_code = "12345"
    client.cli_email = "test@example.com"
    client.cli_isactive = True
    return client


@pytest.fixture
def sample_supplier():
    """Create a sample supplier for testing."""
    supplier = MagicMock()
    supplier.sup_id = 200
    supplier.sup_ref = "SUP-0001"
    supplier.sup_company_name = "Test Supplier Inc"
    supplier.sup_address1 = "456 Supplier Ave"
    supplier.sup_city = "Supplier City"
    supplier.sup_postcode = "54321"
    supplier.sup_country = "France"
    supplier.sup_email = "supplier@example.com"
    return supplier


@pytest.fixture
def sample_invoices():
    """Create sample invoices for testing."""
    invoice1 = MagicMock()
    invoice1.inv_id = 1
    invoice1.inv_reference = "INV-2024-0001"
    invoice1.inv_date = datetime.now() - timedelta(days=20)
    invoice1.inv_due_date = datetime.now() + timedelta(days=10)
    invoice1.inv_total_amount = Decimal("1000.00")
    invoice1.inv_amount_paid = Decimal("0.00")

    invoice2 = MagicMock()
    invoice2.inv_id = 2
    invoice2.inv_reference = "INV-2024-0002"
    invoice2.inv_date = datetime.now() - timedelta(days=10)
    invoice2.inv_due_date = datetime.now() + timedelta(days=20)
    invoice2.inv_total_amount = Decimal("500.00")
    invoice2.inv_amount_paid = Decimal("200.00")

    return [invoice1, invoice2]


@pytest.fixture
def sample_payments():
    """Create sample payments for testing."""
    payment1 = MagicMock()
    payment1.pay_id = 1
    payment1.pay_reference = "PAY-2024-0001"
    payment1.pay_date = datetime.now() - timedelta(days=15)
    payment1.pay_amount = Decimal("200.00")
    payment1.pay_method = "TRANSFER"

    return [payment1]


# ==========================================================================
# StatementTransaction Tests
# ==========================================================================

class TestStatementTransaction:
    """Tests for StatementTransaction data class."""

    def test_transaction_creation(self):
        """Test creating a statement transaction."""
        tx = StatementTransaction(
            transaction_date=date.today(),
            transaction_type=TransactionType.INVOICE,
            reference="INV-001",
            description="Test Invoice",
            debit=Decimal("100.00"),
            credit=Decimal("0.00"),
            balance=Decimal("100.00")
        )

        assert tx.transaction_date == date.today()
        assert tx.transaction_type == TransactionType.INVOICE
        assert tx.debit == Decimal("100.00")
        assert tx.credit == Decimal("0.00")

    def test_transaction_to_dict(self):
        """Test converting transaction to dictionary."""
        tx = StatementTransaction(
            transaction_date=date.today(),
            transaction_type=TransactionType.PAYMENT,
            reference="PAY-001",
            description="Test Payment",
            debit=Decimal("0.00"),
            credit=Decimal("50.00"),
            balance=Decimal("50.00"),
            document_id=123
        )

        result = tx.to_dict()

        assert result["type"] == "PAYMENT"
        assert result["reference"] == "PAY-001"
        assert result["credit"] == 50.0
        assert result["document_id"] == 123


# ==========================================================================
# Customer Statement Generation Tests
# ==========================================================================

class TestGenerateCustomerStatement:
    """Tests for generate_customer_statement method."""

    @pytest.mark.asyncio
    async def test_generate_statement_success(
        self, statement_service, sample_client, sample_invoices, sample_payments
    ):
        """Test successful customer statement generation."""
        statement_service._get_client = AsyncMock(return_value=sample_client)
        statement_service._calculate_client_balance_as_of = AsyncMock(return_value=Decimal("0"))
        statement_service._get_client_invoices_in_period = AsyncMock(return_value=sample_invoices)
        statement_service._get_client_payments_in_period = AsyncMock(return_value=sample_payments)
        statement_service._calculate_client_aging_summary = AsyncMock(return_value={
            "current": 1000.0,
            "days_31_60": 0.0,
            "days_61_90": 0.0,
            "over_90": 0.0
        })

        from_date = date.today() - timedelta(days=30)
        to_date = date.today()

        result = await statement_service.generate_customer_statement(
            client_id=100,
            from_date=from_date,
            to_date=to_date
        )

        assert result["statement_type"] == "customer"
        assert result["client"]["id"] == 100
        assert result["client"]["company_name"] == "Test Company Ltd"
        assert result["opening_balance"] == 0.0
        assert len(result["transactions"]) == 3  # 2 invoices + 1 payment
        assert "totals" in result
        assert "aging_summary" in result
        assert "generated_at" in result

    @pytest.mark.asyncio
    async def test_generate_statement_client_not_found(self, statement_service):
        """Test statement generation with non-existent client."""
        statement_service._get_client = AsyncMock(return_value=None)

        with pytest.raises(ClientNotFoundError) as exc:
            await statement_service.generate_customer_statement(
                client_id=999,
                from_date=date.today() - timedelta(days=30),
                to_date=date.today()
            )

        assert "999" in str(exc.value)
        assert exc.value.code == "CLIENT_NOT_FOUND"

    @pytest.mark.asyncio
    async def test_generate_statement_invalid_date_range(self, statement_service):
        """Test statement generation with invalid date range."""
        with pytest.raises(InvalidDateRangeError) as exc:
            await statement_service.generate_customer_statement(
                client_id=100,
                from_date=date.today(),
                to_date=date.today() - timedelta(days=30)
            )

        assert exc.value.code == "INVALID_DATE_RANGE"

    @pytest.mark.asyncio
    async def test_generate_statement_with_filters(
        self, statement_service, sample_client, sample_invoices, sample_payments
    ):
        """Test statement generation with society and BU filters."""
        statement_service._get_client = AsyncMock(return_value=sample_client)
        statement_service._calculate_client_balance_as_of = AsyncMock(return_value=Decimal("500"))
        statement_service._get_client_invoices_in_period = AsyncMock(return_value=sample_invoices)
        statement_service._get_client_payments_in_period = AsyncMock(return_value=sample_payments)
        statement_service._calculate_client_aging_summary = AsyncMock(return_value={
            "current": 0.0,
            "days_31_60": 0.0,
            "days_61_90": 0.0,
            "over_90": 0.0
        })

        result = await statement_service.generate_customer_statement(
            client_id=100,
            from_date=date.today() - timedelta(days=30),
            to_date=date.today(),
            society_id=1,
            bu_id=2
        )

        assert result["filters"]["society_id"] == 1
        assert result["filters"]["business_unit_id"] == 2


# ==========================================================================
# Vendor Statement Tests
# ==========================================================================

class TestGenerateVendorStatement:
    """Tests for generate_vendor_statement method."""

    @pytest.mark.asyncio
    async def test_generate_vendor_statement_success(self, statement_service, sample_supplier):
        """Test successful vendor statement generation."""
        statement_service._get_supplier = AsyncMock(return_value=sample_supplier)

        result = await statement_service.generate_vendor_statement(
            supplier_id=200,
            from_date=date.today() - timedelta(days=30),
            to_date=date.today()
        )

        assert result["statement_type"] == "vendor"
        assert result["supplier"]["id"] == 200
        assert result["supplier"]["company_name"] == "Test Supplier Inc"

    @pytest.mark.asyncio
    async def test_generate_vendor_statement_not_found(self, statement_service):
        """Test vendor statement with non-existent supplier."""
        statement_service._get_supplier = AsyncMock(return_value=None)

        with pytest.raises(SupplierNotFoundError) as exc:
            await statement_service.generate_vendor_statement(
                supplier_id=999,
                from_date=date.today() - timedelta(days=30),
                to_date=date.today()
            )

        assert exc.value.code == "SUPPLIER_NOT_FOUND"

    @pytest.mark.asyncio
    async def test_generate_vendor_statement_invalid_dates(self, statement_service):
        """Test vendor statement with invalid date range."""
        with pytest.raises(InvalidDateRangeError):
            await statement_service.generate_vendor_statement(
                supplier_id=200,
                from_date=date.today(),
                to_date=date.today() - timedelta(days=30)
            )


# ==========================================================================
# Export Tests
# ==========================================================================

class TestExportStatement:
    """Tests for statement export functionality."""

    @pytest.mark.asyncio
    async def test_export_to_csv(
        self, statement_service, sample_client, sample_invoices, sample_payments
    ):
        """Test exporting statement to CSV format."""
        statement_service._get_client = AsyncMock(return_value=sample_client)
        statement_service._calculate_client_balance_as_of = AsyncMock(return_value=Decimal("0"))
        statement_service._get_client_invoices_in_period = AsyncMock(return_value=sample_invoices)
        statement_service._get_client_payments_in_period = AsyncMock(return_value=sample_payments)
        statement_service._calculate_client_aging_summary = AsyncMock(return_value={
            "current": 0.0, "days_31_60": 0.0, "days_61_90": 0.0, "over_90": 0.0
        })

        result = await statement_service.export_customer_statement(
            client_id=100,
            from_date=date.today() - timedelta(days=30),
            to_date=date.today(),
            export_format=ExportFormat.CSV
        )

        assert result["format"] == "csv"
        assert result["content_type"] == "text/csv"
        assert "data" in result
        assert result["filename"].endswith(".csv")
        assert "Customer Statement" in result["data"]

    @pytest.mark.asyncio
    async def test_export_to_json(
        self, statement_service, sample_client, sample_invoices, sample_payments
    ):
        """Test exporting statement to JSON format."""
        statement_service._get_client = AsyncMock(return_value=sample_client)
        statement_service._calculate_client_balance_as_of = AsyncMock(return_value=Decimal("0"))
        statement_service._get_client_invoices_in_period = AsyncMock(return_value=sample_invoices)
        statement_service._get_client_payments_in_period = AsyncMock(return_value=sample_payments)
        statement_service._calculate_client_aging_summary = AsyncMock(return_value={
            "current": 0.0, "days_31_60": 0.0, "days_61_90": 0.0, "over_90": 0.0
        })

        result = await statement_service.export_customer_statement(
            client_id=100,
            from_date=date.today() - timedelta(days=30),
            to_date=date.today(),
            export_format=ExportFormat.JSON
        )

        assert result["format"] == "json"
        assert result["content_type"] == "application/json"
        assert "data" in result
        assert result["data"]["statement_type"] == "customer"

    @pytest.mark.asyncio
    async def test_export_to_pdf(
        self, statement_service, sample_client, sample_invoices, sample_payments
    ):
        """Test exporting statement to PDF format."""
        statement_service._get_client = AsyncMock(return_value=sample_client)
        statement_service._calculate_client_balance_as_of = AsyncMock(return_value=Decimal("0"))
        statement_service._get_client_invoices_in_period = AsyncMock(return_value=sample_invoices)
        statement_service._get_client_payments_in_period = AsyncMock(return_value=sample_payments)
        statement_service._calculate_client_aging_summary = AsyncMock(return_value={
            "current": 0.0, "days_31_60": 0.0, "days_61_90": 0.0, "over_90": 0.0
        })

        result = await statement_service.export_customer_statement(
            client_id=100,
            from_date=date.today() - timedelta(days=30),
            to_date=date.today(),
            export_format=ExportFormat.PDF
        )

        assert result["format"] == "pdf"
        assert result["content_type"] == "application/pdf"
        assert "html_content" in result
        assert result["requires_pdf_service"] is True


# ==========================================================================
# Batch Statement Tests
# ==========================================================================

class TestBatchStatementGeneration:
    """Tests for batch statement generation."""

    @pytest.mark.asyncio
    async def test_batch_generation_success(
        self, statement_service, sample_client, sample_invoices, sample_payments
    ):
        """Test generating statements for multiple clients."""
        statement_service._get_client = AsyncMock(return_value=sample_client)
        statement_service._calculate_client_balance_as_of = AsyncMock(return_value=Decimal("500"))
        statement_service._get_client_invoices_in_period = AsyncMock(return_value=sample_invoices)
        statement_service._get_client_payments_in_period = AsyncMock(return_value=sample_payments)
        statement_service._calculate_client_aging_summary = AsyncMock(return_value={
            "current": 500.0, "days_31_60": 0.0, "days_61_90": 0.0, "over_90": 0.0
        })

        result = await statement_service.generate_batch_customer_statements(
            client_ids=[100, 101, 102],
            from_date=date.today() - timedelta(days=30),
            to_date=date.today()
        )

        assert result["summary"]["total_requested"] == 3
        assert result["summary"]["successful"] == 3
        assert result["summary"]["failed"] == 0
        assert len(result["success"]) == 3

    @pytest.mark.asyncio
    async def test_batch_generation_with_errors(self, statement_service, sample_client):
        """Test batch generation handles errors gracefully."""
        # First client succeeds, second fails
        statement_service._get_client = AsyncMock(side_effect=[sample_client, None])
        statement_service._calculate_client_balance_as_of = AsyncMock(return_value=Decimal("100"))
        statement_service._get_client_invoices_in_period = AsyncMock(return_value=[])
        statement_service._get_client_payments_in_period = AsyncMock(return_value=[])
        statement_service._calculate_client_aging_summary = AsyncMock(return_value={
            "current": 100.0, "days_31_60": 0.0, "days_61_90": 0.0, "over_90": 0.0
        })

        result = await statement_service.generate_batch_customer_statements(
            client_ids=[100, 999],
            from_date=date.today() - timedelta(days=30),
            to_date=date.today()
        )

        assert result["summary"]["successful"] == 1
        assert result["summary"]["failed"] == 1
        assert len(result["errors"]) == 1


# ==========================================================================
# Credit Status Tests
# ==========================================================================

class TestCreditStatus:
    """Tests for credit status determination."""

    def test_credit_status_good(self, statement_service):
        """Test GOOD credit status."""
        status = statement_service._determine_credit_status(
            balance=Decimal("0"),
            aging_summary={"current": 0.0, "days_31_60": 0.0, "days_61_90": 0.0, "over_90": 0.0}
        )
        assert status == "GOOD"

    def test_credit_status_watch(self, statement_service):
        """Test WATCH credit status."""
        status = statement_service._determine_credit_status(
            balance=Decimal("500"),
            aging_summary={"current": 0.0, "days_31_60": 500.0, "days_61_90": 0.0, "over_90": 0.0}
        )
        assert status == "WATCH"

    def test_credit_status_warning(self, statement_service):
        """Test WARNING credit status."""
        status = statement_service._determine_credit_status(
            balance=Decimal("800"),
            aging_summary={"current": 0.0, "days_31_60": 0.0, "days_61_90": 800.0, "over_90": 0.0}
        )
        assert status == "WARNING"

    def test_credit_status_critical(self, statement_service):
        """Test CRITICAL credit status."""
        status = statement_service._determine_credit_status(
            balance=Decimal("1000"),
            aging_summary={"current": 0.0, "days_31_60": 0.0, "days_61_90": 0.0, "over_90": 1000.0}
        )
        assert status == "CRITICAL"


# ==========================================================================
# Factory Function and Integration Tests
# ==========================================================================

class TestStatementServiceIntegration:
    """Integration and factory function tests."""

    def test_service_instantiation(self, mock_db):
        """Test service can be instantiated."""
        service = StatementService(mock_db)
        assert service.db == mock_db

    def test_factory_function(self, mock_db):
        """Test factory function creates service."""
        service = get_statement_service(mock_db)
        assert isinstance(service, StatementService)

    def test_enums_defined(self):
        """Test all enums are properly defined."""
        assert StatementType.CUSTOMER.value == "customer"
        assert StatementType.VENDOR.value == "vendor"
        assert ExportFormat.PDF.value == "pdf"
        assert ExportFormat.CSV.value == "csv"
        assert ExportFormat.EXCEL.value == "xlsx"
        assert TransactionType.INVOICE.value == "INVOICE"
        assert TransactionType.PAYMENT.value == "PAYMENT"
