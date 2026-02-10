"""Tests for accounting endpoints."""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.accounting_service import AccountingService


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


@pytest.fixture
def mock_db():
    """Mock database session."""
    return MagicMock()


@pytest.fixture
def mock_current_user():
    """Mock current user."""
    return {"id": 1, "email": "test@example.com"}


class TestAccountingService:
    """Tests for AccountingService."""
    
    def test_calculate_days_overdue_past_due(self):
        """Test days overdue calculation for past due invoice."""
        service = AccountingService(MagicMock())
        due_date = date(2024, 1, 1)
        as_of_date = date(2024, 1, 31)
        
        result = service._calculate_days_overdue(due_date, as_of_date)
        
        assert result == 30
    
    def test_calculate_days_overdue_not_due(self):
        """Test days overdue calculation for invoice not yet due."""
        service = AccountingService(MagicMock())
        due_date = date(2024, 2, 15)
        as_of_date = date(2024, 1, 31)
        
        result = service._calculate_days_overdue(due_date, as_of_date)
        
        assert result == -15
    
    def test_get_aging_bucket_label_current(self):
        """Test aging bucket label for current invoice."""
        service = AccountingService(MagicMock())
        
        assert service._get_aging_bucket_label(-5) == "Current"
        assert service._get_aging_bucket_label(0) == "Current"
    
    def test_get_aging_bucket_label_1_30(self):
        """Test aging bucket label for 1-30 days overdue."""
        service = AccountingService(MagicMock())
        
        assert service._get_aging_bucket_label(1) == "1-30 days"
        assert service._get_aging_bucket_label(15) == "1-30 days"
        assert service._get_aging_bucket_label(30) == "1-30 days"
    
    def test_get_aging_bucket_label_31_60(self):
        """Test aging bucket label for 31-60 days overdue."""
        service = AccountingService(MagicMock())
        
        assert service._get_aging_bucket_label(31) == "31-60 days"
        assert service._get_aging_bucket_label(45) == "31-60 days"
        assert service._get_aging_bucket_label(60) == "31-60 days"
    
    def test_get_aging_bucket_label_61_90(self):
        """Test aging bucket label for 61-90 days overdue."""
        service = AccountingService(MagicMock())
        
        assert service._get_aging_bucket_label(61) == "61-90 days"
        assert service._get_aging_bucket_label(75) == "61-90 days"
        assert service._get_aging_bucket_label(90) == "61-90 days"
    
    def test_get_aging_bucket_label_over_90(self):
        """Test aging bucket label for 90+ days overdue."""
        service = AccountingService(MagicMock())
        
        assert service._get_aging_bucket_label(91) == "90+ days"
        assert service._get_aging_bucket_label(120) == "90+ days"
        assert service._get_aging_bucket_label(365) == "90+ days"


class TestReceivablesAgingEndpoint:
    """Tests for receivables aging endpoint."""

    def test_get_receivables_aging_success(self, client):
        """Test successful receivables aging request."""

        # Mock the service response
        with patch.object(
            AccountingService,
            'get_receivables_aging'
        ) as mock_method:
            mock_method.return_value = {
                "summary": {
                    "as_of_date": date.today(),
                    "total_receivables": Decimal("10000.00"),
                    "total_overdue": Decimal("3000.00"),
                    "total_current": Decimal("7000.00"),
                    "overdue_percentage": Decimal("30.00"),
                    "buckets": [],
                    "average_days_outstanding": Decimal("15.00"),
                    "weighted_average_days": Decimal("20.00")
                },
                "by_client": [],
                "invoices": None
            }
            
            response = client.get(
                "/api/v1/accounting/receivables/aging",
            )
            
            assert response.status_code == 200
    
    def test_get_receivables_aging_with_filters(self, client):
        """Test receivables aging with query filters."""
        # This would test the endpoint with various filter combinations
        pass
    
    def test_get_receivables_aging_public(self, client):
        """Receivables aging endpoint is currently public."""
        with patch.object(AccountingService, 'get_receivables_aging') as mock_method:
            mock_method.return_value = {
                "summary": {
                    "as_of_date": date.today(),
                    "total_receivables": Decimal("0.00"),
                    "total_overdue": Decimal("0.00"),
                    "total_current": Decimal("0.00"),
                    "overdue_percentage": Decimal("0.00"),
                    "buckets": [],
                    "average_days_outstanding": Decimal("0.00"),
                    "weighted_average_days": Decimal("0.00")
                },
                "by_client": [],
                "invoices": None
            }
            response = client.get("/api/v1/accounting/receivables/aging")
            assert response.status_code == 200
