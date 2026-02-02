"""
Tests for payment allocation endpoint.
"""
import pytest
from decimal import Decimal
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.dependencies import get_db, get_current_user
from app.models.payment import Payment, PaymentAllocation
from app.models.invoice import ClientInvoice
from app.services.payment_allocation_service import PaymentAllocationService


# Test fixtures
@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return MagicMock(spec=Session)


@pytest.fixture
def mock_user():
    """Create a mock user."""
    return {"id": 1, "username": "test_user"}


@pytest.fixture
def client(mock_db, mock_user):
    """Create test client with mocked dependencies."""
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def sample_payment():
    """Create a sample payment."""
    payment = MagicMock(spec=Payment)
    payment.pay_id = 1
    payment.pay_reference = "PAY-0001"
    payment.pay_client_id = 100
    payment.pay_amount = Decimal("1000.00")
    payment.pay_is_allocated = False
    return payment


@pytest.fixture
def sample_invoice():
    """Create a sample invoice."""
    invoice = MagicMock(spec=ClientInvoice)
    invoice.inv_id = 1
    invoice.inv_reference = "INV-2024-0001"
    invoice.inv_client_id = 100
    invoice.inv_total_ttc = Decimal("500.00")
    invoice.inv_amount_paid = Decimal("0.00")
    invoice.inv_balance_due = Decimal("500.00")
    return invoice


class TestPaymentAllocationEndpoint:
    """Tests for POST /api/v1/accounting/payments/{id}/allocate"""

    def test_allocate_payment_success(self, client, mock_db, sample_payment, sample_invoice):
        """Test successful payment allocation."""
        with patch.object(PaymentAllocationService, 'get_payment_by_id', return_value=sample_payment):
            with patch.object(PaymentAllocationService, 'get_invoice_by_id', return_value=sample_invoice):
                with patch.object(PaymentAllocationService, 'get_total_allocated_for_payment', return_value=Decimal("0.00")):
                    with patch.object(PaymentAllocationService, 'allocate_payment') as mock_allocate:
                        mock_allocate.return_value = {
                            "payment_id": 1,
                            "payment_reference": "PAY-0001",
                            "total_allocated": Decimal("500.00"),
                            "remaining_unallocated": Decimal("500.00"),
                            "payment_fully_allocated": False,
                            "allocations": [{
                                "invoice_id": 1,
                                "invoice_reference": "INV-2024-0001",
                                "allocated_amount": Decimal("500.00"),
                                "invoice_balance_before": Decimal("500.00"),
                                "invoice_balance_after": Decimal("0.00"),
                                "invoice_fully_paid": True
                            }],
                            "message": "Successfully allocated 500.00 to 1 invoice(s)"
                        }
                        
                        response = client.post(
                            "/api/v1/accounting/payments/1/allocate",
                            json={
                                "allocations": [
                                    {"invoice_id": 1, "amount": 500.00}
                                ]
                            }
                        )
                        
                        assert response.status_code == 200

    def test_allocate_payment_not_found(self, client):
        """Test allocation with non-existent payment."""
        with patch.object(PaymentAllocationService, 'get_payment_by_id', return_value=None):
            response = client.post(
                "/api/v1/accounting/payments/999/allocate",
                json={
                    "allocations": [
                        {"invoice_id": 1, "amount": 100.00}
                    ]
                }
            )
            
            assert response.status_code == 404

    def test_allocate_payment_invalid_amount(self, client):
        """Test allocation with invalid amount."""
        response = client.post(
            "/api/v1/accounting/payments/1/allocate",
            json={
                "allocations": [
                    {"invoice_id": 1, "amount": -100.00}
                ]
            }
        )
        
        assert response.status_code == 422

    def test_allocate_payment_empty_allocations(self, client):
        """Test allocation with empty allocations list."""
        response = client.post(
            "/api/v1/accounting/payments/1/allocate",
            json={
                "allocations": []
            }
        )
        
        assert response.status_code == 422

    def test_allocate_payment_duplicate_invoices(self, client):
        """Test allocation with duplicate invoice IDs."""
        response = client.post(
            "/api/v1/accounting/payments/1/allocate",
            json={
                "allocations": [
                    {"invoice_id": 1, "amount": 100.00},
                    {"invoice_id": 1, "amount": 200.00}
                ]
            }
        )
        
        assert response.status_code == 422


class TestPaymentAllocationService:
    """Unit tests for PaymentAllocationService."""

    def test_validate_allocation_exceeds_payment(self, mock_db, sample_payment):
        """Test validation when allocation exceeds payment amount."""
        service = PaymentAllocationService(mock_db)
        
        with patch.object(service, 'get_total_allocated_for_payment', return_value=Decimal("900.00")):
            from app.schemas.payment_allocation import PaymentAllocationRequest, AllocationItem
            
            request = PaymentAllocationRequest(
                allocations=[AllocationItem(invoice_id=1, amount=Decimal("200.00"))]
            )
            
            from app.services.payment_allocation_service import PaymentAllocationError
            with pytest.raises(PaymentAllocationError) as exc_info:
                service.validate_allocation_request(sample_payment, request)
            
            assert exc_info.value.error_code == "INSUFFICIENT_PAYMENT_AMOUNT"

    def test_validate_allocation_client_mismatch(self, mock_db, sample_payment, sample_invoice):
        """Test validation when invoice belongs to different client."""
        sample_invoice.inv_client_id = 999  # Different client
        service = PaymentAllocationService(mock_db)
        
        with patch.object(service, 'get_total_allocated_for_payment', return_value=Decimal("0.00")):
            with patch.object(service, 'get_invoice_by_id', return_value=sample_invoice):
                from app.schemas.payment_allocation import PaymentAllocationRequest, AllocationItem
                
                request = PaymentAllocationRequest(
                    allocations=[AllocationItem(invoice_id=1, amount=Decimal("100.00"))]
                )
                
                from app.services.payment_allocation_service import PaymentAllocationError
                with pytest.raises(PaymentAllocationError) as exc_info:
                    service.validate_allocation_request(sample_payment, request)
                
                assert exc_info.value.error_code == "CLIENT_MISMATCH"
