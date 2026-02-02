"""
Tests for X3 Export Service.

Tests the X3 export operations including:
- Invoice transformation to X3 format
- Customer transformation to X3 format
- Batch export processing
- Error handling
"""
import pytest
import sys
from decimal import Decimal
from datetime import datetime, timedelta, date
from unittest.mock import AsyncMock, MagicMock, patch

# Mock the database module before importing anything else
sys.modules['app.database'] = MagicMock()
sys.modules['app.database'].Base = MagicMock()
sys.modules['app.database'].get_db = MagicMock()

# Mock models module
sys.modules['app.models'] = MagicMock()
sys.modules['app.models.user'] = MagicMock()
sys.modules['app.models.drive'] = MagicMock()
sys.modules['app.models.invoice'] = MagicMock()
sys.modules['app.models.payment'] = MagicMock()
sys.modules['app.models.client'] = MagicMock()
sys.modules['app.models.chat'] = MagicMock()
sys.modules['app.models.landed_cost'] = MagicMock()
sys.modules['app.models.quote'] = MagicMock()

# Now import the schemas (they don't depend on models)
from app.schemas.x3_export import (
    X3ExportRequest, X3ExportJobResponse, X3ExportItemResult,
    X3ExportStatus, X3ExportType, X3DocumentType,
    X3InvoiceExport, X3InvoiceLineExport,
    X3CustomerExport, X3PaymentExport,
    X3MappingConfig, X3VatMapping, X3CurrencyMapping
)


@pytest.fixture
def mock_invoice():
    """Create a mock invoice for testing."""
    invoice = MagicMock()
    invoice.inv_id = 1
    invoice.inv_reference = "INV-2025-00001"
    invoice.inv_cli_id = 100
    invoice.inv_ord_id = None
    invoice.inv_date = datetime.now()
    invoice.inv_due_date = datetime.now() + timedelta(days=30)
    invoice.inv_sta_id = 2  # SENT
    invoice.inv_cur_id = 1  # EUR
    invoice.inv_billing_address = "123 Main St"
    invoice.inv_billing_city = "Paris"
    invoice.inv_billing_postal_code = "75001"
    invoice.inv_billing_country_id = 1
    invoice.inv_sub_total = Decimal("1000.00")
    invoice.inv_total_vat = Decimal("200.00")
    invoice.inv_total_amount = Decimal("1200.00")
    invoice.inv_discount = Decimal("0")
    invoice.inv_notes = "Test invoice"
    invoice.inv_soc_id = 1
    invoice.inv_bu_id = 1
    invoice.lines = []
    return invoice


@pytest.fixture
def mock_invoice_lines():
    """Create mock invoice lines."""
    lines = []

    line1 = MagicMock()
    line1.inl_id = 1
    line1.inl_inv_id = 1
    line1.inl_line_number = 1
    line1.inl_prd_id = 101
    line1.inl_description = "Product A - Description"
    line1.inl_quantity = Decimal("10")
    line1.inl_unit_price = Decimal("50.00")
    line1.inl_discount = Decimal("0")
    line1.inl_vat_id = 1
    line1.inl_vat_amount = Decimal("100.00")
    line1.inl_line_total = Decimal("600.00")
    line1.inl_sort_order = 1
    lines.append(line1)

    line2 = MagicMock()
    line2.inl_id = 2
    line2.inl_inv_id = 1
    line2.inl_line_number = 2
    line2.inl_prd_id = 102
    line2.inl_description = "Product B - Description"
    line2.inl_quantity = Decimal("5")
    line2.inl_unit_price = Decimal("100.00")
    line2.inl_discount = Decimal("10")
    line2.inl_vat_id = 1
    line2.inl_vat_amount = Decimal("90.00")
    line2.inl_line_total = Decimal("540.00")
    line2.inl_sort_order = 2
    lines.append(line2)

    return lines


@pytest.fixture
def mock_client():
    """Create a mock client for testing."""
    client = MagicMock()
    client.cli_id = 100
    client.cli_reference = "CLI-00100"
    client.cli_company_name = "Test Company SARL"
    client.cli_first_name = "John"
    client.cli_last_name = "Doe"
    client.cli_email = "john.doe@example.com"
    client.cli_phone = "+33 1 23 45 67 89"
    client.cli_mobile = "+33 6 12 34 56 78"
    client.cli_address = "123 Business Avenue"
    client.cli_address2 = "Building B"
    client.cli_postal_code = "75001"
    client.cli_city = "Paris"
    client.cli_country_id = 1
    client.cli_vat_number = "FR12345678901"
    client.cli_siret = "12345678901234"
    client.cli_website = "https://www.testcompany.com"
    client.cli_cur_id = 1
    client.cli_pay_term_id = 1
    client.cli_pay_mode_id = 1
    client.cli_credit_limit = Decimal("50000.00")
    client.cli_discount = Decimal("5")
    client.cli_is_active = True
    client.cli_soc_id = 1
    client.cli_bu_id = 1
    return client


class TestX3ExportSchemas:
    """Tests for X3 export schemas."""

    def test_x3_invoice_export_creation(self, mock_invoice, mock_invoice_lines):
        """Test creating an X3 invoice export object."""
        x3_invoice = X3InvoiceExport(
            document_type=X3DocumentType.INVOICE,
            document_number=mock_invoice.inv_reference,
            company_code="001",
            site_code="MAIN",
            customer_code="CLI-00100",
            customer_name="Test Company",
            invoice_date=mock_invoice.inv_date.date(),
            due_date=mock_invoice.inv_due_date.date(),
            currency_code="EUR",
            total_excl_vat=mock_invoice.inv_sub_total,
            total_vat=mock_invoice.inv_total_vat,
            total_incl_vat=mock_invoice.inv_total_amount,
            erp_invoice_id=mock_invoice.inv_id,
            lines=[]
        )

        assert x3_invoice.document_number == "INV-2025-00001"
        assert x3_invoice.company_code == "001"
        assert x3_invoice.currency_code == "EUR"
        assert x3_invoice.total_incl_vat == Decimal("1200.00")

    def test_x3_invoice_line_export_creation(self, mock_invoice_lines):
        """Test creating X3 invoice line export objects."""
        line = mock_invoice_lines[0]

        x3_line = X3InvoiceLineExport(
            line_number=line.inl_line_number,
            description=line.inl_description,
            quantity=line.inl_quantity,
            unit_price=line.inl_unit_price,
            discount_percent=line.inl_discount,
            vat_code="NOR",
            vat_rate=Decimal("20"),
            vat_amount=line.inl_vat_amount,
            net_amount=line.inl_line_total - line.inl_vat_amount,
            gross_amount=line.inl_line_total
        )

        assert x3_line.line_number == 1
        assert x3_line.quantity == Decimal("10")
        assert x3_line.vat_code == "NOR"

    def test_x3_customer_export_creation(self, mock_client):
        """Test creating an X3 customer export object."""
        x3_customer = X3CustomerExport(
            customer_code=mock_client.cli_reference,
            company_code="001",
            company_name=mock_client.cli_company_name,
            contact_first_name=mock_client.cli_first_name,
            contact_last_name=mock_client.cli_last_name,
            email=mock_client.cli_email,
            phone=mock_client.cli_phone,
            address_line_1=mock_client.cli_address,
            postal_code=mock_client.cli_postal_code,
            city=mock_client.cli_city,
            vat_number=mock_client.cli_vat_number,
            currency_code="EUR",
            credit_limit=mock_client.cli_credit_limit,
            is_active=mock_client.cli_is_active,
            erp_client_id=mock_client.cli_id
        )

        assert x3_customer.customer_code == "CLI-00100"
        assert x3_customer.company_name == "Test Company SARL"
        assert x3_customer.credit_limit == Decimal("50000.00")
        assert x3_customer.is_active is True


class TestX3ExportRequest:
    """Tests for X3 export request handling."""

    def test_export_request_creation(self):
        """Test creating an export request."""
        request = X3ExportRequest(
            export_type=X3ExportType.INVOICE,
            date_from=date(2025, 1, 1),
            date_to=date(2025, 1, 31),
            dry_run=True
        )

        assert request.export_type == X3ExportType.INVOICE
        assert request.dry_run is True
        assert request.batch_size is None

    def test_export_request_with_entity_ids(self):
        """Test export request with specific entity IDs."""
        request = X3ExportRequest(
            export_type=X3ExportType.CUSTOMER,
            entity_ids=[1, 2, 3, 4, 5],
            batch_size=10
        )

        assert len(request.entity_ids) == 5
        assert request.batch_size == 10

    def test_export_request_with_filters(self):
        """Test export request with multiple filters."""
        request = X3ExportRequest(
            export_type=X3ExportType.INVOICE,
            client_id=100,
            status_ids=[2, 3, 4],
            society_id=1,
            bu_id=1,
            include_exported=False,
            output_format="json"
        )

        assert request.client_id == 100
        assert len(request.status_ids) == 3
        assert request.output_format == "json"


class TestX3ExportJobResponse:
    """Tests for X3 export job response."""

    def test_job_response_creation(self):
        """Test creating a job response."""
        job = X3ExportJobResponse(
            job_id="test-job-123",
            export_type=X3ExportType.INVOICE,
            status=X3ExportStatus.COMPLETED,
            total_records=10,
            processed_records=10,
            successful_records=8,
            failed_records=2,
            started_at=datetime.now() - timedelta(minutes=5),
            completed_at=datetime.now()
        )

        assert job.job_id == "test-job-123"
        assert job.status == X3ExportStatus.COMPLETED
        assert job.successful_records == 8
        assert job.failed_records == 2

    def test_job_response_with_results(self):
        """Test job response with individual item results."""
        results = [
            X3ExportItemResult(
                erp_id=1,
                erp_reference="INV-2025-00001",
                x3_reference="X3-INV-001",
                status="SUCCESS"
            ),
            X3ExportItemResult(
                erp_id=2,
                erp_reference="INV-2025-00002",
                status="FAILED",
                error_message="Validation error",
                error_code="X3_VALIDATION_ERROR"
            )
        ]

        job = X3ExportJobResponse(
            job_id="test-job-456",
            export_type=X3ExportType.INVOICE,
            status=X3ExportStatus.PARTIAL,
            total_records=2,
            processed_records=2,
            successful_records=1,
            failed_records=1,
            results=results
        )

        assert len(job.results) == 2
        assert job.results[0].status == "SUCCESS"
        assert job.results[1].error_code == "X3_VALIDATION_ERROR"


class TestX3MappingConfig:
    """Tests for X3 mapping configuration."""

    def test_vat_mapping(self):
        """Test VAT code mapping."""
        mapping = X3VatMapping(
            erp_vat_id=1,
            x3_vat_code="NOR",
            vat_rate=Decimal("20")
        )

        assert mapping.erp_vat_id == 1
        assert mapping.x3_vat_code == "NOR"
        assert mapping.vat_rate == Decimal("20")

    def test_currency_mapping(self):
        """Test currency code mapping."""
        mapping = X3CurrencyMapping(
            erp_currency_id=1,
            x3_currency_code="EUR"
        )

        assert mapping.erp_currency_id == 1
        assert mapping.x3_currency_code == "EUR"

    def test_full_mapping_config(self):
        """Test complete mapping configuration."""
        config = X3MappingConfig(
            vat_mappings=[
                X3VatMapping(erp_vat_id=1, x3_vat_code="NOR", vat_rate=Decimal("20")),
                X3VatMapping(erp_vat_id=2, x3_vat_code="RED", vat_rate=Decimal("5.5")),
            ],
            currency_mappings=[
                X3CurrencyMapping(erp_currency_id=1, x3_currency_code="EUR"),
                X3CurrencyMapping(erp_currency_id=2, x3_currency_code="USD"),
            ],
            default_vat_code="NOR",
            default_currency_code="EUR"
        )

        assert len(config.vat_mappings) == 2
        assert len(config.currency_mappings) == 2
        assert config.default_vat_code == "NOR"


class TestX3ExportStatusWorkflow:
    """Tests for X3 export status workflow."""

    def test_status_transitions(self):
        """Test valid status transitions."""
        # Initial status
        job = X3ExportJobResponse(
            job_id="test",
            export_type=X3ExportType.INVOICE,
            status=X3ExportStatus.PENDING
        )
        assert job.status == X3ExportStatus.PENDING

        # Transition to in progress
        job.status = X3ExportStatus.IN_PROGRESS
        assert job.status == X3ExportStatus.IN_PROGRESS

        # Transition to completed
        job.status = X3ExportStatus.COMPLETED
        assert job.status == X3ExportStatus.COMPLETED

    def test_partial_status(self):
        """Test partial completion status."""
        job = X3ExportJobResponse(
            job_id="test",
            export_type=X3ExportType.INVOICE,
            status=X3ExportStatus.PARTIAL,
            total_records=10,
            successful_records=7,
            failed_records=3
        )

        assert job.status == X3ExportStatus.PARTIAL
        assert job.successful_records + job.failed_records == job.total_records


class TestX3DocumentTypes:
    """Tests for X3 document type handling."""

    def test_invoice_document_type(self):
        """Test invoice document type."""
        assert X3DocumentType.INVOICE.value == "SIH"

    def test_credit_note_document_type(self):
        """Test credit note document type."""
        assert X3DocumentType.CREDIT_NOTE.value == "SCN"

    def test_proforma_document_type(self):
        """Test proforma invoice document type."""
        assert X3DocumentType.PROFORMA.value == "SPF"

    def test_document_type_in_export(self):
        """Test using document type in export object."""
        x3_invoice = X3InvoiceExport(
            document_type=X3DocumentType.CREDIT_NOTE,
            document_number="CN-2025-00001",
            company_code="001",
            site_code="MAIN",
            customer_code="CLI-001",
            customer_name="Test",
            invoice_date=date.today(),
            due_date=date.today(),
            currency_code="EUR",
            total_excl_vat=Decimal("100"),
            total_vat=Decimal("20"),
            total_incl_vat=Decimal("120"),
            erp_invoice_id=1
        )

        assert x3_invoice.document_type == X3DocumentType.CREDIT_NOTE


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
