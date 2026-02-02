"""
Test PaymentMode model.
This test verifies the PaymentMode SQLAlchemy model works correctly.
"""
import pytest
from app.models.payment_mode import PaymentMode


class TestPaymentModeModel:
    """Test suite for PaymentMode model."""

    def test_model_creation(self):
        """Test that PaymentMode model can be instantiated."""
        payment_mode = PaymentMode()
        assert payment_mode is not None

    def test_model_attributes(self):
        """Test that PaymentMode has correct attributes."""
        payment_mode = PaymentMode()
        payment_mode.pmo_id = 1
        payment_mode.pmo_designation = "Virement"
        payment_mode.pmo_isactive = True

        assert payment_mode.pmo_id == 1
        assert payment_mode.pmo_designation == "Virement"
        assert payment_mode.pmo_isactive is True

    def test_model_tablename(self):
        """Test that PaymentMode maps to correct table."""
        assert PaymentMode.__tablename__ == "TR_PMO_Payment_Mode"

    def test_model_columns(self):
        """Test that PaymentMode has correct columns."""
        columns = list(PaymentMode.__table__.columns.keys())
        assert "pmo_id" in columns
        assert "pmo_designation" in columns
        assert "pmo_isactive" in columns
        assert len(columns) == 3

    def test_id_property(self):
        """Test the id property alias."""
        payment_mode = PaymentMode()
        payment_mode.pmo_id = 42
        assert payment_mode.id == 42

    def test_designation_property(self):
        """Test the designation property."""
        payment_mode = PaymentMode()
        payment_mode.pmo_designation = "Cheque"
        assert payment_mode.designation == "Cheque"

    def test_name_property(self):
        """Test the name property alias."""
        payment_mode = PaymentMode()
        payment_mode.pmo_designation = "Espèces"
        assert payment_mode.name == "Espèces"

    def test_display_name_property(self):
        """Test the display_name property."""
        payment_mode = PaymentMode()
        payment_mode.pmo_designation = "Carte Bancaire"
        assert payment_mode.display_name == "Carte Bancaire"

    def test_is_active_property(self):
        """Test the is_active property."""
        payment_mode = PaymentMode()

        payment_mode.pmo_isactive = True
        assert payment_mode.is_active is True

        payment_mode.pmo_isactive = False
        assert payment_mode.is_active is False

    def test_repr(self):
        """Test the __repr__ method."""
        payment_mode = PaymentMode()
        payment_mode.pmo_id = 1
        payment_mode.pmo_designation = "Virement"

        expected = "<PaymentMode(pmo_id=1, designation='Virement')>"
        assert repr(payment_mode) == expected

    def test_model_import_from_init(self):
        """Test that PaymentMode can be imported from models __init__."""
        from app.models import PaymentMode as ImportedPaymentMode
        assert ImportedPaymentMode is PaymentMode

    def test_primary_key(self):
        """Test that pmo_id is configured as primary key."""
        pk_columns = [col.name for col in PaymentMode.__table__.primary_key.columns]
        assert "pmo_id" in pk_columns
        assert len(pk_columns) == 1
