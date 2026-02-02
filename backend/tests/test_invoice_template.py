"""
Invoice Template Verification Test

Tests that the invoice.html Jinja2 template renders correctly with mock data.
"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape


class MockInvoice:
    """Mock invoice data for testing."""
    inv_id = 1
    inv_reference = "INV-2025-00001"
    inv_date = datetime.now()
    inv_due_date = datetime.now() + timedelta(days=30)
    inv_sta_id = 1
    inv_billing_address = "123 Client Street"
    inv_billing_city = "Paris"
    inv_billing_postal_code = "75001"
    inv_billing_country_id = 1
    inv_sub_total = Decimal("1000.00")
    inv_total_vat = Decimal("200.00")
    inv_total_amount = Decimal("1200.00")
    inv_discount = Decimal("0")
    inv_amount_paid = Decimal("0")
    inv_amount_due = Decimal("1200.00")
    inv_notes = "Thank you for your business. Payment is due within 30 days."
    inv_payment_reference = "REF-123456"
    balance_due = Decimal("1200.00")
    is_overdue = False


class MockLine:
    """Mock invoice line for testing."""
    def __init__(self, line_num, desc, qty, price, vat_amt, total):
        self.inl_id = line_num
        self.inl_line_number = line_num
        self.inl_description = desc
        self.inl_quantity = qty
        self.inl_unit_price = price
        self.inl_discount = Decimal("0")
        self.inl_vat_amount = vat_amt
        self.inl_line_total = total
        self.product_code = f"PRD-{line_num:03d}"


class MockClient:
    """Mock client data for testing."""
    cli_company_name = "Acme Corporation"
    cli_first_name = "John"
    cli_last_name = "Doe"
    cli_address = "456 Business Avenue"
    cli_address2 = "Suite 100"
    cli_postal_code = "75008"
    cli_city = "Paris"
    cli_email = "john.doe@acme.com"
    cli_phone = "+33 1 23 45 67 89"
    cli_vat_number = "FR12345678901"


class MockCompany:
    """Mock company/society data for testing."""
    soc_society_name = "Your Company SARL"
    soc_address1 = "789 Corporate Boulevard"
    soc_address2 = None
    soc_postcode = "75016"
    soc_city = "Paris"
    soc_county = "France"
    soc_tel = "+33 1 98 76 54 32"
    soc_email = "contact@yourcompany.com"
    soc_site = "www.yourcompany.com"
    soc_siret = "123 456 789 00012"
    soc_tva_intra = "FR12 123 456 789"
    soc_rcs = "Paris B 123 456 789"
    soc_capital = "10,000 EUR"
    soc_rib_name = "BNP Paribas"
    soc_rib_code_iban = "FR76 1234 5678 9012 3456 7890 123"
    soc_rib_code_bic = "BNPAFRPP"


@pytest.fixture
def jinja_env():
    """Create Jinja2 environment for testing."""
    templates_dir = Path(__file__).parent.parent / "app" / "templates"
    return Environment(
        loader=FileSystemLoader(templates_dir),
        autoescape=select_autoescape(['html', 'xml'])
    )


@pytest.fixture
def mock_lines():
    """Create mock invoice lines."""
    return [
        MockLine(1, "Professional Services - Web Development", Decimal("10"), Decimal("50.00"), Decimal("100.00"), Decimal("600.00")),
        MockLine(2, "Design Services - UI/UX Design", Decimal("5"), Decimal("60.00"), Decimal("60.00"), Decimal("360.00")),
        MockLine(3, "Consulting - Technical Architecture Review", Decimal("2"), Decimal("100.00"), Decimal("40.00"), Decimal("240.00"))
    ]


class TestInvoiceTemplate:
    """Test cases for invoice.html template."""

    def test_template_exists(self, jinja_env):
        """Verify the invoice template file exists."""
        template = jinja_env.get_template("invoice.html")
        assert template is not None

    def test_template_renders_without_errors(self, jinja_env, mock_lines):
        """Verify the template renders without errors."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="\u20ac",
            payment_terms="Net 30 days"
        )
        assert html_content is not None
        assert len(html_content) > 0

    def test_template_contains_valid_html_structure(self, jinja_env, mock_lines):
        """Verify the template produces valid HTML structure."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        # Check HTML document structure
        assert "<!DOCTYPE html>" in html_content
        assert "<html" in html_content
        assert "</html>" in html_content
        assert "<head>" in html_content
        assert "</head>" in html_content
        assert "<body>" in html_content
        assert "</body>" in html_content
        assert '<meta charset="UTF-8">' in html_content
        assert "<title>" in html_content

    def test_template_contains_invoice_header(self, jinja_env, mock_lines):
        """Verify the template contains invoice header information."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "Invoice" in html_content
        assert "INV-2025-00001" in html_content

    def test_template_contains_company_info(self, jinja_env, mock_lines):
        """Verify the template contains company information."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "Your Company SARL" in html_content
        assert "789 Corporate Boulevard" in html_content
        assert "contact@yourcompany.com" in html_content

    def test_template_contains_client_info(self, jinja_env, mock_lines):
        """Verify the template contains client information."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "Acme Corporation" in html_content
        assert "John" in html_content
        assert "Doe" in html_content
        assert "john.doe@acme.com" in html_content

    def test_template_contains_line_items(self, jinja_env, mock_lines):
        """Verify the template contains invoice line items."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "Professional Services - Web Development" in html_content
        assert "Design Services - UI/UX Design" in html_content
        assert "Consulting - Technical Architecture Review" in html_content

    def test_template_contains_totals(self, jinja_env, mock_lines):
        """Verify the template contains totals section."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "Subtotal" in html_content
        assert "VAT" in html_content
        assert "Total" in html_content

    def test_template_contains_payment_info(self, jinja_env, mock_lines):
        """Verify the template contains payment information."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "Payment Information" in html_content
        assert "BNP Paribas" in html_content
        assert "IBAN" in html_content
        assert "BIC/SWIFT" in html_content

    def test_template_contains_footer(self, jinja_env, mock_lines):
        """Verify the template contains footer with legal info."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "SIRET" in html_content
        assert "VAT Number" in html_content
        assert "Thank you for your business" in html_content

    def test_template_contains_css(self, jinja_env, mock_lines):
        """Verify the template contains embedded CSS."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "<style>" in html_content
        assert "</style>" in html_content
        assert ".invoice-container" in html_content
        assert ".invoice-header" in html_content
        assert ".items-table" in html_content
        assert "@media print" in html_content

    def test_template_contains_status_badge(self, jinja_env, mock_lines):
        """Verify the template contains status badge."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "status-badge" in html_content
        assert "DRAFT" in html_content

    def test_template_renders_without_optional_data(self, jinja_env):
        """Verify the template renders correctly with minimal data."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=[],
            client=None,
            company=None,
            status=None,
            currency_symbol="$",
            payment_terms=None
        )

        assert "<!DOCTYPE html>" in html_content
        assert "Invoice" in html_content
        assert "INV-2025-00001" in html_content

    def test_template_handles_notes(self, jinja_env, mock_lines):
        """Verify the template renders notes section when present."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "Notes" in html_content
        assert "Thank you for your business" in html_content

    def test_template_table_structure(self, jinja_env, mock_lines):
        """Verify the template has proper table structure."""
        template = jinja_env.get_template("invoice.html")
        html_content = template.render(
            invoice=MockInvoice(),
            lines=mock_lines,
            client=MockClient(),
            company=MockCompany(),
            status="DRAFT",
            currency_symbol="$",
            payment_terms=None
        )

        assert "<table" in html_content
        assert "<thead>" in html_content
        assert "<tbody>" in html_content
        assert "</table>" in html_content
        assert "Description" in html_content
        assert "Qty" in html_content
        assert "Unit Price" in html_content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
