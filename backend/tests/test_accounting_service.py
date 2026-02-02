"""
Tests for the Accounting Service.

Verifies:
- Payment allocation to invoices
- Auto-allocation using FIFO
- Invoice status calculation
- Receivables aging report
- Customer statement generation
"""
import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.accounting_service import AccountingService
from app.models.invoice import ClientInvoice
from app.models.payment import Payment, PaymentAllocation
from app.models.client import Client
from app.config.settings import InvoiceStatus, AgingBucket
from app.utils.exceptions import (
    EntityNotFoundError,
    InsufficientFundsError,
    AllocationError,
    InvoiceAlreadyPaidError,
    ValidationError
)


# ==========================================================================
# Fixtures
# ==========================================================================

@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = AsyncMock(spec=AsyncSession)
    db.execute = AsyncMock()
    db.flush = AsyncMock()
    db.add = MagicMock()
    return db


@pytest.fixture
def accounting_service(mock_db):
    """Create an accounting service instance with mock db."""
    return AccountingService(mock_db)


@pytest.fixture
def sample_payment():
    """Create a sample payment for testing."""
    payment = MagicMock(spec=Payment)
    payment.pay_id = 1
    payment.pay_cli_id = 100
    payment.pay_amount = Decimal("1000.00")
    payment.pay_allocated_amount = Decimal("0.00")
    payment.allocations = []
    return payment


@pytest.fixture
def sample_invoice():
    """Create a sample invoice for testing."""
    invoice = MagicMock(spec=ClientInvoice)
    invoice.inv_id = 1
    invoice.inv_cli_id = 100
    invoice.inv_reference = "INV-2024-0001"
    invoice.inv_date = datetime.now() - timedelta(days=30)
    invoice.inv_due_date = datetime.now() + timedelta(days=30)
    invoice.inv_total_amount = Decimal("500.00")
    invoice.inv_amount_paid = Decimal("0.00")
    invoice.inv_sta_id = 1  # DRAFT
    return invoice


@pytest.fixture
def sample_client():
    """Create a sample client for testing."""
    client = MagicMock(spec=Client)
    client.cli_id = 100
    client.cli_reference = "CLI-0001"
    client.cli_company_name = "Test Company"
    client.cli_address = "123 Test St"
    client.cli_city = "Test City"
    client.cli_postal_code = "12345"
    client.cli_email = "test@example.com"
    return client


# ==========================================================================
# Payment Allocation Tests
# ==========================================================================

class TestAllocatePayment:
    """Tests for allocate_payment method."""

    @pytest.mark.asyncio
    async def test_allocate_payment_success(self, accounting_service, mock_db, sample_payment, sample_invoice):
        """Test successful payment allocation to single invoice."""
        # Setup
        accounting_service._get_payment = AsyncMock(return_value=sample_payment)
        accounting_service._get_invoice = AsyncMock(return_value=sample_invoice)
        accounting_service._get_status_id = AsyncMock(return_value=3)  # PARTIAL

        allocations = [{"invoice_id": 1, "amount": Decimal("300.00")}]

        # Execute
        result = await accounting_service.allocate_payment(
            payment_id=1,
            allocations=allocations,
            user_id=1
        )

        # Verify
        assert result["payment_id"] == 1
        assert result["total_allocated"] == 300.0
        assert result["remaining_unallocated"] == 700.0
        assert len(result["allocations"]) == 1
        assert result["allocations"][0]["invoice_id"] == 1
        assert result["allocations"][0]["allocated_amount"] == 300.0

    @pytest.mark.asyncio
    async def test_allocate_payment_multiple_invoices(self, accounting_service, sample_payment):
        """Test allocation to multiple invoices."""
        invoice1 = MagicMock(spec=ClientInvoice)
        invoice1.inv_id = 1
        invoice1.inv_total_amount = Decimal("300.00")
        invoice1.inv_amount_paid = Decimal("0.00")

        invoice2 = MagicMock(spec=ClientInvoice)
        invoice2.inv_id = 2
        invoice2.inv_total_amount = Decimal("400.00")
        invoice2.inv_amount_paid = Decimal("0.00")

        accounting_service._get_payment = AsyncMock(return_value=sample_payment)
        accounting_service._get_invoice = AsyncMock(side_effect=[invoice1, invoice2])
        accounting_service._get_status_id = AsyncMock(return_value=4)  # PAID

        allocations = [
            {"invoice_id": 1, "amount": Decimal("300.00")},
            {"invoice_id": 2, "amount": Decimal("400.00")}
        ]

        result = await accounting_service.allocate_payment(
            payment_id=1,
            allocations=allocations
        )

        assert result["total_allocated"] == 700.0
        assert len(result["allocations"]) == 2

    @pytest.mark.asyncio
    async def test_allocate_payment_not_found(self, accounting_service):
        """Test allocation when payment not found."""
        accounting_service._get_payment = AsyncMock(return_value=None)

        with pytest.raises(EntityNotFoundError) as exc:
            await accounting_service.allocate_payment(
                payment_id=999,
                allocations=[{"invoice_id": 1, "amount": Decimal("100.00")}]
            )

        assert "Payment" in str(exc.value)

    @pytest.mark.asyncio
    async def test_allocate_payment_insufficient_funds(self, accounting_service, sample_payment):
        """Test allocation when exceeding available funds."""
        sample_payment.pay_amount = Decimal("100.00")
        accounting_service._get_payment = AsyncMock(return_value=sample_payment)

        with pytest.raises(InsufficientFundsError):
            await accounting_service.allocate_payment(
                payment_id=1,
                allocations=[{"invoice_id": 1, "amount": Decimal("500.00")}]
            )

    @pytest.mark.asyncio
    async def test_allocate_payment_invoice_already_paid(self, accounting_service, sample_payment, sample_invoice):
        """Test allocation to already paid invoice."""
        sample_invoice.inv_amount_paid = sample_invoice.inv_total_amount  # Fully paid
        accounting_service._get_payment = AsyncMock(return_value=sample_payment)
        accounting_service._get_invoice = AsyncMock(return_value=sample_invoice)

        with pytest.raises(InvoiceAlreadyPaidError):
            await accounting_service.allocate_payment(
                payment_id=1,
                allocations=[{"invoice_id": 1, "amount": Decimal("100.00")}]
            )

    @pytest.mark.asyncio
    async def test_allocate_payment_exceeds_balance(self, accounting_service, sample_payment, sample_invoice):
        """Test allocation exceeding invoice balance."""
        sample_invoice.inv_total_amount = Decimal("100.00")
        sample_invoice.inv_amount_paid = Decimal("50.00")  # Balance = 50
        accounting_service._get_payment = AsyncMock(return_value=sample_payment)
        accounting_service._get_invoice = AsyncMock(return_value=sample_invoice)

        with pytest.raises(AllocationError):
            await accounting_service.allocate_payment(
                payment_id=1,
                allocations=[{"invoice_id": 1, "amount": Decimal("100.00")}]  # More than balance
            )

    @pytest.mark.asyncio
    async def test_allocate_payment_zero_amount(self, accounting_service, sample_payment, sample_invoice):
        """Test allocation with zero amount."""
        accounting_service._get_payment = AsyncMock(return_value=sample_payment)
        accounting_service._get_invoice = AsyncMock(return_value=sample_invoice)

        with pytest.raises(ValidationError):
            await accounting_service.allocate_payment(
                payment_id=1,
                allocations=[{"invoice_id": 1, "amount": Decimal("0.00")}]
            )


# ==========================================================================
# Auto-Allocation Tests
# ==========================================================================

class TestAutoAllocatePayment:
    """Tests for auto_allocate_payment method."""

    @pytest.mark.asyncio
    async def test_auto_allocate_fifo(self, accounting_service, mock_db, sample_payment):
        """Test auto-allocation uses FIFO order."""
        # Create invoices with different dates
        invoice1 = MagicMock()
        invoice1.inv_id = 1
        invoice1.inv_date = datetime.now() - timedelta(days=60)  # Oldest
        invoice1.inv_total_amount = Decimal("400.00")
        invoice1.inv_amount_paid = Decimal("0.00")

        invoice2 = MagicMock()
        invoice2.inv_id = 2
        invoice2.inv_date = datetime.now() - timedelta(days=30)  # Newer
        invoice2.inv_total_amount = Decimal("300.00")
        invoice2.inv_amount_paid = Decimal("0.00")

        # Mock to return invoices in FIFO order
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [invoice1, invoice2]
        mock_db.execute.return_value = mock_result

        accounting_service._get_payment = AsyncMock(return_value=sample_payment)
        accounting_service.allocate_payment = AsyncMock(return_value={
            "payment_id": 1,
            "total_allocated": 700.0,
            "remaining_unallocated": 300.0,
            "allocations": []
        })

        result = await accounting_service.auto_allocate_payment(payment_id=1)

        # Verify allocate_payment was called
        accounting_service.allocate_payment.assert_called_once()
        call_args = accounting_service.allocate_payment.call_args
        allocations = call_args.kwargs.get("allocations") or call_args.args[1]

        # First allocation should be for oldest invoice
        assert allocations[0]["invoice_id"] == 1

    @pytest.mark.asyncio
    async def test_auto_allocate_already_allocated(self, accounting_service, sample_payment):
        """Test auto-allocation when payment fully allocated."""
        sample_payment.pay_allocated_amount = sample_payment.pay_amount
        accounting_service._get_payment = AsyncMock(return_value=sample_payment)

        result = await accounting_service.auto_allocate_payment(payment_id=1)

        assert result["total_allocated"] == 0
        assert "fully allocated" in result["message"]


# ==========================================================================
# Invoice Status Tests
# ==========================================================================

class TestCalculateInvoiceStatus:
    """Tests for calculate_invoice_status method."""

    @pytest.mark.asyncio
    async def test_status_paid(self, accounting_service, sample_invoice):
        """Test PAID status when fully paid."""
        sample_invoice.inv_amount_paid = sample_invoice.inv_total_amount
        accounting_service._get_invoice = AsyncMock(return_value=sample_invoice)

        status = await accounting_service.calculate_invoice_status(1)
        assert status == InvoiceStatus.PAID

    @pytest.mark.asyncio
    async def test_status_overdue(self, accounting_service, sample_invoice):
        """Test OVERDUE status when past due."""
        sample_invoice.inv_due_date = datetime.now() - timedelta(days=1)
        sample_invoice.inv_amount_paid = Decimal("0.00")
        accounting_service._get_invoice = AsyncMock(return_value=sample_invoice)
        accounting_service._get_status_code = AsyncMock(return_value=InvoiceStatus.SENT)

        status = await accounting_service.calculate_invoice_status(1)
        assert status == InvoiceStatus.OVERDUE

    @pytest.mark.asyncio
    async def test_status_partial(self, accounting_service, sample_invoice):
        """Test PARTIAL status when partially paid."""
        sample_invoice.inv_amount_paid = Decimal("100.00")  # Less than total
        sample_invoice.inv_due_date = datetime.now() + timedelta(days=30)  # Not overdue
        accounting_service._get_invoice = AsyncMock(return_value=sample_invoice)
        accounting_service._get_status_code = AsyncMock(return_value=InvoiceStatus.SENT)

        status = await accounting_service.calculate_invoice_status(1)
        assert status == InvoiceStatus.PARTIAL

    @pytest.mark.asyncio
    async def test_status_draft(self, accounting_service, sample_invoice):
        """Test DRAFT status remains for unpaid draft."""
        sample_invoice.inv_amount_paid = Decimal("0.00")
        sample_invoice.inv_due_date = datetime.now() + timedelta(days=30)
        accounting_service._get_invoice = AsyncMock(return_value=sample_invoice)
        accounting_service._get_status_code = AsyncMock(return_value=InvoiceStatus.DRAFT)

        status = await accounting_service.calculate_invoice_status(1)
        assert status == InvoiceStatus.DRAFT


# ==========================================================================
# Receivables Aging Tests
# ==========================================================================

class TestReceivablesAging:
    """Tests for get_receivables_aging method."""

    @pytest.mark.asyncio
    async def test_aging_buckets(self, accounting_service, mock_db):
        """Test aging report calculates correct buckets."""
        # Create mock invoices in different aging buckets
        from collections import namedtuple
        MockRow = namedtuple('MockRow', [
            'inv_cli_id', 'cli_reference', 'cli_company_name',
            'inv_id', 'inv_reference', 'inv_date', 'inv_due_date',
            'inv_total_amount', 'inv_amount_paid', 'balance_due'
        ])

        today = date.today()
        invoices = [
            # Current (0-30 days)
            MockRow(1, 'CLI-001', 'Client A', 1, 'INV-001',
                    datetime.now() - timedelta(days=10),
                    datetime.now() + timedelta(days=20),
                    Decimal("1000"), Decimal("0"), Decimal("1000")),
            # 31-60 days
            MockRow(1, 'CLI-001', 'Client A', 2, 'INV-002',
                    datetime.now() - timedelta(days=50),
                    datetime.now() - timedelta(days=40),
                    Decimal("500"), Decimal("0"), Decimal("500")),
            # 61-90 days
            MockRow(2, 'CLI-002', 'Client B', 3, 'INV-003',
                    datetime.now() - timedelta(days=80),
                    datetime.now() - timedelta(days=70),
                    Decimal("300"), Decimal("0"), Decimal("300")),
            # Over 90 days
            MockRow(2, 'CLI-002', 'Client B', 4, 'INV-004',
                    datetime.now() - timedelta(days=120),
                    datetime.now() - timedelta(days=100),
                    Decimal("200"), Decimal("0"), Decimal("200")),
        ]

        mock_result = MagicMock()
        mock_result.all.return_value = invoices
        mock_db.execute.return_value = mock_result

        result = await accounting_service.get_receivables_aging()

        assert result["total_receivables"] == 2000.0
        assert result["summary"][AgingBucket.CURRENT] == 1000.0
        assert result["summary"][AgingBucket.DAYS_31_60] == 500.0
        assert result["summary"][AgingBucket.DAYS_61_90] == 300.0
        assert result["summary"][AgingBucket.OVER_90] == 200.0
        assert len(result["by_client"]) == 2


# ==========================================================================
# Customer Statement Tests
# ==========================================================================

class TestCustomerStatement:
    """Tests for get_customer_statement method."""

    @pytest.mark.asyncio
    async def test_statement_generation(self, accounting_service, mock_db, sample_client):
        """Test statement includes invoices and payments."""
        accounting_service._get_client = AsyncMock(return_value=sample_client)
        accounting_service._calculate_balance_as_of = AsyncMock(return_value=Decimal("0"))

        # Mock invoices
        invoice = MagicMock()
        invoice.inv_date = datetime.now()
        invoice.inv_reference = "INV-001"
        invoice.inv_total_amount = Decimal("500")
        invoice.inv_due_date = datetime.now() + timedelta(days=30)

        # Mock payments
        payment = MagicMock()
        payment.pay_date = datetime.now()
        payment.pay_reference = "PAY-001"
        payment.pay_amount = Decimal("200")
        payment.pay_method = "TRANSFER"

        mock_inv_result = MagicMock()
        mock_inv_result.scalars.return_value.all.return_value = [invoice]

        mock_pay_result = MagicMock()
        mock_pay_result.scalars.return_value.all.return_value = [payment]

        mock_db.execute.side_effect = [mock_inv_result, mock_pay_result]

        from_date = date.today() - timedelta(days=30)
        to_date = date.today()

        result = await accounting_service.get_customer_statement(
            client_id=100,
            from_date=from_date,
            to_date=to_date
        )

        assert result["client"]["id"] == 100
        assert result["opening_balance"] == 0.0
        assert len(result["transactions"]) == 2  # 1 invoice + 1 payment
        assert result["closing_balance"] == 300.0  # 500 - 200

    @pytest.mark.asyncio
    async def test_statement_client_not_found(self, accounting_service):
        """Test statement with non-existent client."""
        accounting_service._get_client = AsyncMock(return_value=None)

        with pytest.raises(EntityNotFoundError):
            await accounting_service.get_customer_statement(
                client_id=999,
                from_date=date.today() - timedelta(days=30),
                to_date=date.today()
            )


# ==========================================================================
# Accounting Summary Tests
# ==========================================================================

class TestAccountingSummary:
    """Tests for get_accounting_summary method."""

    @pytest.mark.asyncio
    async def test_summary_metrics(self, accounting_service, mock_db):
        """Test summary returns correct metrics."""
        from collections import namedtuple
        MockCounts = namedtuple('MockCounts', ['total', 'paid', 'partial', 'overdue'])

        # Mock outstanding total
        mock_db.execute.side_effect = [
            MagicMock(scalar=MagicMock(return_value=Decimal("5000"))),  # outstanding
            MagicMock(scalar=MagicMock(return_value=Decimal("1000"))),  # overdue
            MagicMock(one=MagicMock(return_value=MockCounts(100, 80, 10, 10))),  # counts
            MagicMock(scalar=MagicMock(return_value=Decimal("500")))   # unallocated
        ]

        result = await accounting_service.get_accounting_summary()

        assert result["total_outstanding"] == 5000.0
        assert result["total_overdue"] == 1000.0
        assert result["invoice_counts"]["total"] == 100
        assert result["collection_rate"] == 80.0


# ==========================================================================
# Integration Verification Test
# ==========================================================================

class TestAccountingServiceIntegration:
    """Verification tests for accounting service integration."""

    def test_service_instantiation(self, mock_db):
        """Test service can be instantiated."""
        service = AccountingService(mock_db)
        assert service.db == mock_db

    def test_factory_function(self, mock_db):
        """Test factory function creates service."""
        from app.services.accounting_service import get_accounting_service
        service = get_accounting_service(mock_db)
        assert isinstance(service, AccountingService)
