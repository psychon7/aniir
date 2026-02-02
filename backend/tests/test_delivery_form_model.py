"""
Tests for DeliveryForm and DeliveryFormLine models.
Verifies the model structure, relationships, and imports.
"""
import pytest
from decimal import Decimal

from app.models.delivery_form import DeliveryForm, DeliveryFormLine


class TestDeliveryFormModel:
    """Test cases for DeliveryForm model structure."""

    def test_deliveryform_table_name(self):
        """Verify DeliveryForm maps to correct table."""
        assert DeliveryForm.__tablename__ == "TM_DEL_DeliveryForm"

    def test_deliveryform_has_required_columns(self):
        """Verify DeliveryForm has all required columns."""
        columns = [c.name for c in DeliveryForm.__table__.columns]
        required_columns = [
            'del_id', 'del_reference', 'del_ord_id', 'del_cli_id',
            'del_delivery_date', 'del_sta_id', 'del_created_at'
        ]
        for col in required_columns:
            assert col in columns, f"Missing column: {col}"

    def test_deliveryform_has_shipping_columns(self):
        """Verify DeliveryForm has shipping address columns."""
        columns = [c.name for c in DeliveryForm.__table__.columns]
        shipping_columns = [
            'del_shipping_address', 'del_shipping_city',
            'del_shipping_postal_code', 'del_shipping_country_id'
        ]
        for col in shipping_columns:
            assert col in columns, f"Missing shipping column: {col}"

    def test_deliveryform_has_carrier_columns(self):
        """Verify DeliveryForm has carrier/tracking columns."""
        columns = [c.name for c in DeliveryForm.__table__.columns]
        carrier_columns = ['del_car_id', 'del_tracking_number']
        for col in carrier_columns:
            assert col in columns, f"Missing carrier column: {col}"

    def test_deliveryform_has_package_columns(self):
        """Verify DeliveryForm has package/weight columns."""
        columns = [c.name for c in DeliveryForm.__table__.columns]
        package_columns = ['del_weight', 'del_packages']
        for col in package_columns:
            assert col in columns, f"Missing package column: {col}"

    def test_deliveryform_has_delivery_tracking_columns(self):
        """Verify DeliveryForm has delivery tracking columns."""
        columns = [c.name for c in DeliveryForm.__table__.columns]
        tracking_columns = [
            'del_shipped_at', 'del_delivered_at', 'del_signed_by'
        ]
        for col in tracking_columns:
            assert col in columns, f"Missing tracking column: {col}"

    def test_deliveryform_has_audit_columns(self):
        """Verify DeliveryForm has audit columns."""
        columns = [c.name for c in DeliveryForm.__table__.columns]
        audit_columns = ['del_created_by', 'del_created_at', 'del_updated_at']
        for col in audit_columns:
            assert col in columns, f"Missing audit column: {col}"

    def test_deliveryform_primary_key(self):
        """Verify DeliveryForm primary key is del_id."""
        pk_columns = [c.name for c in DeliveryForm.__table__.primary_key.columns]
        assert pk_columns == ['del_id']

    def test_deliveryform_has_foreign_key_to_order(self):
        """Verify DeliveryForm has foreign key to ClientOrder."""
        fk_columns = [fk.target_fullname for fk in DeliveryForm.__table__.foreign_keys]
        assert any('TM_ORD_ClientOrder.ord_id' in fk for fk in fk_columns)

    def test_deliveryform_has_foreign_key_to_client(self):
        """Verify DeliveryForm has foreign key to Client."""
        fk_columns = [fk.target_fullname for fk in DeliveryForm.__table__.foreign_keys]
        assert any('TM_CLI_Client.cli_id' in fk for fk in fk_columns)

    def test_deliveryform_has_foreign_key_to_status(self):
        """Verify DeliveryForm has foreign key to Status."""
        fk_columns = [fk.target_fullname for fk in DeliveryForm.__table__.foreign_keys]
        assert any('TR_STA_Status.sta_id' in fk for fk in fk_columns)


class TestDeliveryFormLineModel:
    """Test cases for DeliveryFormLine model structure."""

    def test_deliveryformline_table_name(self):
        """Verify DeliveryFormLine maps to correct table."""
        assert DeliveryFormLine.__tablename__ == "TM_DEL_DeliveryFormLine"

    def test_deliveryformline_has_required_columns(self):
        """Verify DeliveryFormLine has all required columns."""
        columns = [c.name for c in DeliveryFormLine.__table__.columns]
        required_columns = [
            'dfl_id', 'dfl_del_id', 'dfl_orl_id', 'dfl_quantity', 'dfl_sort_order'
        ]
        for col in required_columns:
            assert col in columns, f"Missing column: {col}"

    def test_deliveryformline_has_product_columns(self):
        """Verify DeliveryFormLine has product columns."""
        columns = [c.name for c in DeliveryFormLine.__table__.columns]
        product_columns = ['dfl_prd_id', 'dfl_pit_id', 'dfl_description']
        for col in product_columns:
            assert col in columns, f"Missing product column: {col}"

    def test_deliveryformline_primary_key(self):
        """Verify DeliveryFormLine primary key is dfl_id."""
        pk_columns = [c.name for c in DeliveryFormLine.__table__.primary_key.columns]
        assert pk_columns == ['dfl_id']

    def test_deliveryformline_has_foreign_key_to_deliveryform(self):
        """Verify DeliveryFormLine has foreign key to DeliveryForm."""
        fk_columns = [fk.target_fullname for fk in DeliveryFormLine.__table__.foreign_keys]
        assert any('TM_DEL_DeliveryForm.del_id' in fk for fk in fk_columns)

    def test_deliveryformline_has_foreign_key_to_orderline(self):
        """Verify DeliveryFormLine has foreign key to ClientOrderLine."""
        fk_columns = [fk.target_fullname for fk in DeliveryFormLine.__table__.foreign_keys]
        assert any('TM_ORD_ClientOrderLine.orl_id' in fk for fk in fk_columns)


class TestModelRelationships:
    """Test model relationship definitions."""

    def test_deliveryform_has_lines_relationship(self):
        """Verify DeliveryForm has lines relationship."""
        assert hasattr(DeliveryForm, 'lines')

    def test_deliveryform_has_client_relationship(self):
        """Verify DeliveryForm has client relationship."""
        assert hasattr(DeliveryForm, 'client')

    def test_deliveryform_has_order_relationship(self):
        """Verify DeliveryForm has order relationship."""
        assert hasattr(DeliveryForm, 'order')

    def test_deliveryform_has_status_relationship(self):
        """Verify DeliveryForm has status relationship."""
        assert hasattr(DeliveryForm, 'status')

    def test_deliveryform_has_creator_relationship(self):
        """Verify DeliveryForm has creator relationship."""
        assert hasattr(DeliveryForm, 'creator')

    def test_deliveryformline_has_deliveryform_relationship(self):
        """Verify DeliveryFormLine has delivery_form relationship."""
        assert hasattr(DeliveryFormLine, 'delivery_form')

    def test_deliveryformline_has_orderline_relationship(self):
        """Verify DeliveryFormLine has order_line relationship."""
        assert hasattr(DeliveryFormLine, 'order_line')

    def test_deliveryformline_has_product_relationship(self):
        """Verify DeliveryFormLine has product relationship."""
        assert hasattr(DeliveryFormLine, 'product')

    def test_deliveryformline_has_product_instance_relationship(self):
        """Verify DeliveryFormLine has product_instance relationship."""
        assert hasattr(DeliveryFormLine, 'product_instance')


class TestModelImports:
    """Test that models can be imported correctly."""

    def test_import_from_models_module(self):
        """Test importing from app.models."""
        from app.models import DeliveryForm, DeliveryFormLine
        assert DeliveryForm.__tablename__ == "TM_DEL_DeliveryForm"
        assert DeliveryFormLine.__tablename__ == "TM_DEL_DeliveryFormLine"

    def test_import_from_delivery_form_module(self):
        """Test importing from app.models.delivery_form."""
        from app.models.delivery_form import DeliveryForm, DeliveryFormLine
        assert DeliveryForm.__tablename__ == "TM_DEL_DeliveryForm"
        assert DeliveryFormLine.__tablename__ == "TM_DEL_DeliveryFormLine"


class TestModelProperties:
    """Test model property helpers."""

    def test_deliveryform_has_id_property(self):
        """Verify DeliveryForm has id property."""
        # Check the property exists
        assert hasattr(DeliveryForm, 'id')

    def test_deliveryform_has_reference_property(self):
        """Verify DeliveryForm has reference property."""
        assert hasattr(DeliveryForm, 'reference')

    def test_deliveryform_has_is_shipped_property(self):
        """Verify DeliveryForm has is_shipped property."""
        assert hasattr(DeliveryForm, 'is_shipped')

    def test_deliveryform_has_is_delivered_property(self):
        """Verify DeliveryForm has is_delivered property."""
        assert hasattr(DeliveryForm, 'is_delivered')

    def test_deliveryform_has_line_count_property(self):
        """Verify DeliveryForm has line_count property."""
        assert hasattr(DeliveryForm, 'line_count')

    def test_deliveryform_has_total_quantity_property(self):
        """Verify DeliveryForm has total_quantity property."""
        assert hasattr(DeliveryForm, 'total_quantity')

    def test_deliveryform_has_full_shipping_address_property(self):
        """Verify DeliveryForm has full_shipping_address property."""
        assert hasattr(DeliveryForm, 'full_shipping_address')

    def test_deliveryformline_has_id_property(self):
        """Verify DeliveryFormLine has id property."""
        assert hasattr(DeliveryFormLine, 'id')

    def test_deliveryformline_has_quantity_property(self):
        """Verify DeliveryFormLine has quantity property."""
        assert hasattr(DeliveryFormLine, 'quantity')
