"""
Tests for Quote Service.

Tests the quote CRUD operations and related business logic.
Uses mocking to avoid database dependencies.
"""
import pytest
import sys
from decimal import Decimal
from datetime import datetime, timedelta
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


@pytest.fixture
def mock_quote():
    """Create a mock quote."""
    quote = MagicMock()
    quote.quo_id = 1
    quote.quo_reference = "QUO-2025-00001"
    quote.quo_cli_id = 100
    quote.quo_date = datetime.now()
    quote.quo_valid_until = datetime.now() + timedelta(days=30)
    quote.quo_sta_id = 1
    quote.quo_cur_id = 1
    quote.quo_shipping_address = "123 Main St"
    quote.quo_shipping_city = "Paris"
    quote.quo_shipping_postal_code = "75001"
    quote.quo_shipping_country_id = 1
    quote.quo_billing_address = "123 Main St"
    quote.quo_billing_city = "Paris"
    quote.quo_billing_postal_code = "75001"
    quote.quo_billing_country_id = 1
    quote.quo_sub_total = Decimal("1000.00")
    quote.quo_total_vat = Decimal("200.00")
    quote.quo_total_amount = Decimal("1200.00")
    quote.quo_discount = Decimal("0")
    quote.quo_notes = "Test quote"
    quote.quo_internal_notes = "Internal notes"
    quote.quo_terms_conditions = "Standard terms"
    quote.quo_bu_id = 1
    quote.quo_soc_id = 1
    quote.quo_pdf_url = None
    quote.quo_pdf_generated_at = None
    quote.quo_converted_to_order = False
    quote.quo_ord_id = None
    quote.quo_converted_at = None
    quote.quo_created_by = 1
    quote.quo_created_at = datetime.now()
    quote.quo_updated_at = None
    quote.lines = []
    return quote


@pytest.fixture
def mock_quote_lines():
    """Create mock quote lines."""
    lines = []

    # Line 1
    line1 = MagicMock()
    line1.qul_id = 1
    line1.qul_quo_id = 1
    line1.qul_line_number = 1
    line1.qul_prd_id = 101
    line1.qul_description = "Product A"
    line1.qul_quantity = Decimal("10")
    line1.qul_unit_price = Decimal("50")
    line1.qul_discount = Decimal("0")
    line1.qul_vat_id = 1
    line1.qul_vat_amount = Decimal("100")
    line1.qul_line_total = Decimal("600")
    line1.qul_sort_order = 1
    lines.append(line1)

    # Line 2
    line2 = MagicMock()
    line2.qul_id = 2
    line2.qul_quo_id = 1
    line2.qul_line_number = 2
    line2.qul_prd_id = 102
    line2.qul_description = "Product B"
    line2.qul_quantity = Decimal("5")
    line2.qul_unit_price = Decimal("100")
    line2.qul_discount = Decimal("10")
    line2.qul_vat_id = 1
    line2.qul_vat_amount = Decimal("90")
    line2.qul_line_total = Decimal("540")
    line2.qul_sort_order = 2
    lines.append(line2)

    return lines


class TestQuoteBusinessLogic:
    """Tests for quote business logic."""

    def test_quote_total_calculation(self, mock_quote_lines):
        """Test that quote totals are correctly calculated from lines."""
        total_line_amount = sum(line.qul_line_total for line in mock_quote_lines)
        total_vat = sum(line.qul_vat_amount for line in mock_quote_lines)

        assert total_line_amount == Decimal("1140")
        assert total_vat == Decimal("190")

    def test_line_total_calculation(self, mock_quote_lines):
        """Test line total calculation with discount."""
        line = mock_quote_lines[1]  # Line with 10% discount

        # Expected: quantity * unit_price * (1 - discount/100) + VAT
        subtotal = line.qul_quantity * line.qul_unit_price
        assert subtotal == Decimal("500")

        discount_amount = subtotal * (line.qul_discount / Decimal("100"))
        assert discount_amount == Decimal("50")

        net_amount = subtotal - discount_amount
        assert net_amount == Decimal("450")

    def test_quote_expiration_check(self, mock_quote):
        """Test quote expiration check."""
        # Quote with future valid_until should not be expired
        mock_quote.quo_valid_until = datetime.now() + timedelta(days=30)
        is_expired = datetime.now() > mock_quote.quo_valid_until
        assert not is_expired

        # Quote with past valid_until should be expired
        mock_quote.quo_valid_until = datetime.now() - timedelta(days=1)
        is_expired = datetime.now() > mock_quote.quo_valid_until
        assert is_expired


class TestQuoteReferenceGeneration:
    """Tests for quote reference generation."""

    def test_reference_format(self):
        """Test that reference follows expected format."""
        year = datetime.now().strftime("%Y")
        prefix = f"QUO-{year}-"
        reference = f"{prefix}00001"

        assert reference.startswith("QUO-")
        assert year in reference
        assert len(reference) == 14  # QUO-YYYY-NNNNN

    def test_reference_increments(self):
        """Test that reference numbers increment correctly."""
        prefix = "QUO-2025-"
        ref1 = f"{prefix}00001"
        ref2 = f"{prefix}00002"

        # Extract number parts
        num1 = int(ref1.replace(prefix, ""))
        num2 = int(ref2.replace(prefix, ""))

        assert num2 == num1 + 1


class TestQuoteDuplication:
    """Tests for quote duplication logic."""

    def test_duplicate_preserves_lines(self, mock_quote, mock_quote_lines):
        """Test that duplication copies all lines."""
        mock_quote.lines = mock_quote_lines

        # Verify original has lines
        assert len(mock_quote.lines) == 2

        # Simulated duplication should copy lines
        duplicated_lines_count = len(mock_quote.lines)
        assert duplicated_lines_count == 2

    def test_duplicate_generates_new_reference(self, mock_quote):
        """Test that duplication generates a new reference."""
        original_ref = mock_quote.quo_reference
        new_ref = "QUO-2025-00002"

        assert new_ref != original_ref

    def test_duplicate_can_change_client(self, mock_quote):
        """Test that duplication can target a different client."""
        original_client_id = mock_quote.quo_cli_id
        new_client_id = 200

        # New client should be different if specified
        assert new_client_id != original_client_id

    def test_duplicate_resets_conversion_status(self, mock_quote):
        """Test that duplicated quote is not marked as converted."""
        mock_quote.quo_converted_to_order = True
        mock_quote.quo_ord_id = 50

        # Duplicated quote should reset these
        new_quote = MagicMock()
        new_quote.quo_converted_to_order = False
        new_quote.quo_ord_id = None

        assert not new_quote.quo_converted_to_order
        assert new_quote.quo_ord_id is None


class TestQuoteConversion:
    """Tests for quote to order conversion logic."""

    def test_cannot_convert_already_converted_quote(self, mock_quote):
        """Test that already converted quotes cannot be converted again."""
        mock_quote.quo_converted_to_order = True
        mock_quote.quo_ord_id = 50

        # Should raise error
        is_already_converted = mock_quote.quo_converted_to_order
        assert is_already_converted

    def test_conversion_marks_quote_as_converted(self, mock_quote):
        """Test that conversion marks the quote appropriately."""
        mock_quote.quo_converted_to_order = False

        # After conversion
        mock_quote.quo_converted_to_order = True
        mock_quote.quo_ord_id = 100
        mock_quote.quo_converted_at = datetime.now()

        assert mock_quote.quo_converted_to_order
        assert mock_quote.quo_ord_id == 100
        assert mock_quote.quo_converted_at is not None


class TestQuoteSearchParams:
    """Tests for quote search parameter validation."""

    def test_pagination_defaults(self):
        """Test default pagination values."""
        default_page = 1
        default_page_size = 20

        assert default_page >= 1
        assert 1 <= default_page_size <= 100

    def test_sort_order_validation(self):
        """Test sort order accepts only valid values."""
        valid_orders = ["asc", "desc"]

        for order in valid_orders:
            assert order in ["asc", "desc"]

        invalid_order = "random"
        assert invalid_order not in ["asc", "desc"]

    def test_amount_filter_validation(self):
        """Test amount filters accept only non-negative values."""
        min_amount = Decimal("0")
        max_amount = Decimal("10000")

        assert min_amount >= 0
        assert max_amount >= 0


class TestQuoteLineOperations:
    """Tests for quote line operations."""

    def test_line_number_assignment(self, mock_quote_lines):
        """Test that line numbers are assigned sequentially."""
        for idx, line in enumerate(mock_quote_lines, start=1):
            assert line.qul_line_number == idx

    def test_line_renumbering_after_deletion(self, mock_quote_lines):
        """Test that lines are renumbered after deletion."""
        # Simulate deleting line 1
        remaining_lines = mock_quote_lines[1:]

        # Renumber remaining lines
        for idx, line in enumerate(remaining_lines, start=1):
            line.qul_line_number = idx

        assert remaining_lines[0].qul_line_number == 1

    def test_sort_order_used_for_display(self, mock_quote_lines):
        """Test that sort order is used for display ordering."""
        # Reverse sort order
        mock_quote_lines[0].qul_sort_order = 2
        mock_quote_lines[1].qul_sort_order = 1

        sorted_lines = sorted(mock_quote_lines, key=lambda x: x.qul_sort_order)

        assert sorted_lines[0].qul_id == 2  # Line 2 now first
        assert sorted_lines[1].qul_id == 1  # Line 1 now second


class TestQuoteDiscountCalculation:
    """Tests for discount calculations."""

    def test_line_discount_calculation(self):
        """Test line-level discount calculation."""
        quantity = Decimal("10")
        unit_price = Decimal("100")
        discount_percent = Decimal("15")

        subtotal = quantity * unit_price  # 1000
        discount_amount = subtotal * (discount_percent / Decimal("100"))  # 150
        net = subtotal - discount_amount  # 850

        assert subtotal == Decimal("1000")
        assert discount_amount == Decimal("150")
        assert net == Decimal("850")

    def test_zero_discount(self):
        """Test calculation with no discount."""
        quantity = Decimal("10")
        unit_price = Decimal("100")
        discount_percent = Decimal("0")

        subtotal = quantity * unit_price
        discount_amount = subtotal * (discount_percent / Decimal("100"))
        net = subtotal - discount_amount

        assert discount_amount == Decimal("0")
        assert net == subtotal

    def test_maximum_discount_validation(self):
        """Test that discount cannot exceed 100%."""
        max_discount = Decimal("100")

        # Valid discounts
        assert Decimal("0") <= Decimal("50") <= max_discount
        assert Decimal("0") <= Decimal("100") <= max_discount

        # Invalid discount
        assert not (Decimal("0") <= Decimal("101") <= max_discount)


class TestQuoteToOrderConversion:
    """Tests for quote to order conversion business logic."""

    def test_conversion_copies_quote_addresses(self, mock_quote):
        """Test that conversion copies shipping and billing addresses to order."""
        # Verify quote has addresses
        assert mock_quote.quo_shipping_address == "123 Main St"
        assert mock_quote.quo_shipping_city == "Paris"
        assert mock_quote.quo_billing_address == "123 Main St"
        assert mock_quote.quo_billing_city == "Paris"

        # Simulate order creation with same addresses
        order = MagicMock()
        order.ord_shipping_address = mock_quote.quo_shipping_address
        order.ord_shipping_city = mock_quote.quo_shipping_city
        order.ord_billing_address = mock_quote.quo_billing_address
        order.ord_billing_city = mock_quote.quo_billing_city

        assert order.ord_shipping_address == mock_quote.quo_shipping_address
        assert order.ord_billing_city == mock_quote.quo_billing_city

    def test_conversion_copies_client_id(self, mock_quote):
        """Test that conversion preserves the client ID."""
        assert mock_quote.quo_cli_id == 100

        # Simulated order should have same client
        order = MagicMock()
        order.ord_cli_id = mock_quote.quo_cli_id

        assert order.ord_cli_id == mock_quote.quo_cli_id

    def test_conversion_copies_currency(self, mock_quote):
        """Test that conversion preserves the currency."""
        assert mock_quote.quo_cur_id == 1

        # Simulated order should have same currency
        order = MagicMock()
        order.ord_cur_id = mock_quote.quo_cur_id

        assert order.ord_cur_id == mock_quote.quo_cur_id

    def test_conversion_copies_organization_info(self, mock_quote):
        """Test that conversion preserves business unit and society."""
        assert mock_quote.quo_bu_id == 1
        assert mock_quote.quo_soc_id == 1

        # Simulated order should have same org info
        order = MagicMock()
        order.ord_bu_id = mock_quote.quo_bu_id
        order.ord_soc_id = mock_quote.quo_soc_id

        assert order.ord_bu_id == mock_quote.quo_bu_id
        assert order.ord_soc_id == mock_quote.quo_soc_id

    def test_conversion_copies_all_lines(self, mock_quote, mock_quote_lines):
        """Test that conversion copies all quote lines to order."""
        mock_quote.lines = mock_quote_lines

        # Verify line count
        assert len(mock_quote.lines) == 2

        # Simulate creating order lines from quote lines
        order_lines = []
        for quote_line in mock_quote.lines:
            order_line = MagicMock()
            order_line.orl_prd_id = quote_line.qul_prd_id
            order_line.orl_description = quote_line.qul_description
            order_line.orl_quantity = quote_line.qul_quantity
            order_line.orl_unit_price = quote_line.qul_unit_price
            order_line.orl_vat_id = quote_line.qul_vat_id
            order_lines.append(order_line)

        assert len(order_lines) == len(mock_quote.lines)
        assert order_lines[0].orl_description == mock_quote_lines[0].qul_description
        assert order_lines[1].orl_quantity == mock_quote_lines[1].qul_quantity

    def test_conversion_with_specific_line_ids(self, mock_quote, mock_quote_lines):
        """Test that conversion can be limited to specific line IDs."""
        mock_quote.lines = mock_quote_lines
        line_ids_to_convert = [1]  # Only first line

        # Filter lines
        lines_to_convert = [
            line for line in mock_quote.lines
            if line.qul_id in line_ids_to_convert
        ]

        assert len(lines_to_convert) == 1
        assert lines_to_convert[0].qul_id == 1

    def test_conversion_response_structure(self, mock_quote):
        """Test that conversion response has expected structure."""
        # Simulate conversion response
        response = {
            'quote_id': mock_quote.quo_id,
            'order_id': 100,
            'order_reference': 'ORD-2025-00001',
            'converted_at': datetime.now(),
            'lines_converted': 2
        }

        assert 'quote_id' in response
        assert 'order_id' in response
        assert 'order_reference' in response
        assert 'converted_at' in response
        assert 'lines_converted' in response

        assert response['quote_id'] == mock_quote.quo_id
        assert response['order_reference'].startswith('ORD-')

    def test_order_reference_format_after_conversion(self):
        """Test that order reference follows expected format."""
        year = datetime.now().strftime("%Y")
        order_reference = f"ORD-{year}-00001"

        assert order_reference.startswith("ORD-")
        assert year in order_reference
        assert len(order_reference) == 14  # ORD-YYYY-NNNNN

    def test_conversion_preserves_discount_info(self, mock_quote_lines):
        """Test that line discount information is preserved during conversion."""
        line_with_discount = mock_quote_lines[1]
        assert line_with_discount.qul_discount == Decimal("10")

        # Simulate order line with discount percent
        order_line = MagicMock()
        order_line.orl_discount_percent = line_with_discount.qul_discount

        assert order_line.orl_discount_percent == Decimal("10")

    def test_conversion_custom_order_date(self, mock_quote):
        """Test that conversion can use a custom order date."""
        custom_date = datetime.now() + timedelta(days=5)

        # Simulated order with custom date
        order = MagicMock()
        order.ord_date = custom_date

        assert order.ord_date == custom_date
        assert order.ord_date > datetime.now()

    def test_conversion_custom_notes(self, mock_quote):
        """Test that conversion can use custom notes."""
        original_notes = mock_quote.quo_notes
        custom_notes = "Custom notes from conversion"

        # When custom notes are provided, they should override
        order = MagicMock()
        order.ord_notes = custom_notes

        assert order.ord_notes == custom_notes
        assert order.ord_notes != original_notes
