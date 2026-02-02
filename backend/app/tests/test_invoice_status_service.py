"""
Tests for Invoice Status Calculation Service
"""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from app.services.invoice_status_service import (
    calculate_invoice_status_by_values,
    InvoiceStatusCode,
    InvoiceStatusResult
)


class TestCalculateInvoiceStatusByValues:
    """Tests for the calculate_invoice_status_by_values function"""
    
    def test_fully_paid_invoice(self):
        """Test that a fully paid invoice returns PAID status"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("1000.00"),
            due_date=date.today() - timedelta(days=30),  # Past due but paid
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.PAID
        assert is_overdue is False
        assert days_overdue == 0
    
    def test_unpaid_not_overdue(self):
        """Test that an unpaid invoice before due date returns PENDING"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("0.00"),
            due_date=date.today() + timedelta(days=30),
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.PENDING
        assert is_overdue is False
        assert days_overdue == 0
    
    def test_unpaid_overdue(self):
        """Test that an unpaid invoice past due date returns OVERDUE"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("0.00"),
            due_date=date.today() - timedelta(days=15),
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.OVERDUE
        assert is_overdue is True
        assert days_overdue == 15
    
    def test_partially_paid_not_overdue(self):
        """Test that a partially paid invoice before due date returns PARTIALLY_PAID"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("500.00"),
            due_date=date.today() + timedelta(days=30),
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.PARTIALLY_PAID
        assert is_overdue is False
        assert days_overdue == 0
    
    def test_partially_paid_overdue(self):
        """Test that a partially paid invoice past due date returns OVERDUE"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("500.00"),
            due_date=date.today() - timedelta(days=10),
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.OVERDUE
        assert is_overdue is True
        assert days_overdue == 10
    
    def test_cancelled_invoice(self):
        """Test that a cancelled invoice returns CANCELLED regardless of payment"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("0.00"),
            due_date=date.today() - timedelta(days=30),
            current_status_code="CANCELLED",
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.CANCELLED
        assert is_overdue is False
        assert days_overdue == 0
    
    def test_draft_invoice(self):
        """Test that a draft invoice returns DRAFT regardless of due date"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("0.00"),
            due_date=date.today() - timedelta(days=30),
            current_status_code="DRAFT",
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.DRAFT
        assert is_overdue is False
        assert days_overdue == 0
    
    def test_credited_invoice(self):
        """Test that a credited invoice returns CREDITED"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("0.00"),
            due_date=date.today() - timedelta(days=30),
            current_status_code="CREDITED",
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.CREDITED
        assert is_overdue is False
        assert days_overdue == 0
    
    def test_no_due_date(self):
        """Test invoice with no due date is never overdue"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("0.00"),
            due_date=None,
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.PENDING
        assert is_overdue is False
        assert days_overdue == 0
    
    def test_overpaid_invoice(self):
        """Test that an overpaid invoice returns PAID"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("1100.00"),  # Overpaid
            due_date=date.today() - timedelta(days=30),
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.PAID
        assert is_overdue is False
    
    def test_tolerance_handling(self):
        """Test that small differences (< 0.01) are treated as paid"""
        status_code, is_overdue, days_overdue = calculate_invoice_status_by_values(
            total_ttc=Decimal("1000.00"),
            total_paid=Decimal("999.995"),  # Within tolerance
            due_date=date.today() + timedelta(days=30),
            reference_date=date.today()
        )
        
        assert status_code == InvoiceStatusCode.PAID


class TestInvoiceStatusResult:
    """Tests for InvoiceStatusResult class"""
    
    def test_to_dict(self):
        """Test conversion to dictionary"""
        result = InvoiceStatusResult(
            status_code=InvoiceStatusCode.PARTIALLY_PAID,
            status_id=5,
            total_paid=Decimal("500.00"),
            remaining_amount=Decimal("500.00"),
            is_overdue=False,
            days_overdue=0,
            payment_percentage=Decimal("50.00")
        )
        
        result_dict = result.to_dict()
        
        assert result_dict["status_code"] == "PARTIALLY_PAID"
        assert result_dict["status_id"] == 5
        assert result_dict["total_paid"] == 500.00
        assert result_dict["remaining_amount"] == 500.00
        assert result_dict["is_overdue"] is False
        assert result_dict["days_overdue"] == 0
        assert result_dict["payment_percentage"] == 50.00
