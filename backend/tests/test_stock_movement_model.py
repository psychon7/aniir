"""
Tests for StockMovement and StockMovementLine models.
Verifies the model structure, relationships, enums, and imports.
"""
import pytest
from decimal import Decimal

from app.models.stock_movement import (
    StockMovement,
    StockMovementLine,
    MovementType,
    MovementStatus
)


class TestMovementTypeEnum:
    """Test cases for MovementType enum."""

    def test_movement_type_has_receipt(self):
        """Verify MovementType has RECEIPT value."""
        assert MovementType.RECEIPT.value == "RECEIPT"

    def test_movement_type_has_shipment(self):
        """Verify MovementType has SHIPMENT value."""
        assert MovementType.SHIPMENT.value == "SHIPMENT"

    def test_movement_type_has_transfer(self):
        """Verify MovementType has TRANSFER value."""
        assert MovementType.TRANSFER.value == "TRANSFER"

    def test_movement_type_has_adjustment(self):
        """Verify MovementType has ADJUSTMENT value."""
        assert MovementType.ADJUSTMENT.value == "ADJUSTMENT"

    def test_movement_type_has_return_in(self):
        """Verify MovementType has RETURN_IN value."""
        assert MovementType.RETURN_IN.value == "RETURN_IN"

    def test_movement_type_has_return_out(self):
        """Verify MovementType has RETURN_OUT value."""
        assert MovementType.RETURN_OUT.value == "RETURN_OUT"

    def test_movement_type_has_damage(self):
        """Verify MovementType has DAMAGE value."""
        assert MovementType.DAMAGE.value == "DAMAGE"

    def test_movement_type_has_destroy(self):
        """Verify MovementType has DESTROY value."""
        assert MovementType.DESTROY.value == "DESTROY"

    def test_movement_type_has_loan_out(self):
        """Verify MovementType has LOAN_OUT value."""
        assert MovementType.LOAN_OUT.value == "LOAN_OUT"

    def test_movement_type_has_loan_in(self):
        """Verify MovementType has LOAN_IN value."""
        assert MovementType.LOAN_IN.value == "LOAN_IN"

    def test_movement_type_count(self):
        """Verify MovementType has exactly 10 values."""
        assert len(MovementType) == 10


class TestMovementStatusEnum:
    """Test cases for MovementStatus enum."""

    def test_movement_status_has_draft(self):
        """Verify MovementStatus has DRAFT value."""
        assert MovementStatus.DRAFT.value == "DRAFT"

    def test_movement_status_has_pending(self):
        """Verify MovementStatus has PENDING value."""
        assert MovementStatus.PENDING.value == "PENDING"

    def test_movement_status_has_in_progress(self):
        """Verify MovementStatus has IN_PROGRESS value."""
        assert MovementStatus.IN_PROGRESS.value == "IN_PROGRESS"

    def test_movement_status_has_completed(self):
        """Verify MovementStatus has COMPLETED value."""
        assert MovementStatus.COMPLETED.value == "COMPLETED"

    def test_movement_status_has_cancelled(self):
        """Verify MovementStatus has CANCELLED value."""
        assert MovementStatus.CANCELLED.value == "CANCELLED"

    def test_movement_status_has_partially(self):
        """Verify MovementStatus has PARTIALLY value."""
        assert MovementStatus.PARTIALLY.value == "PARTIALLY"

    def test_movement_status_count(self):
        """Verify MovementStatus has exactly 6 values."""
        assert len(MovementStatus) == 6


class TestStockMovementModel:
    """Test cases for StockMovement model structure."""

    def test_stockmovement_table_name(self):
        """Verify StockMovement maps to correct table."""
        assert StockMovement.__tablename__ == "TM_STK_StockMovement"

    def test_stockmovement_has_primary_key(self):
        """Verify StockMovement has stm_id as primary key."""
        columns = [c.name for c in StockMovement.__table__.columns]
        assert 'stm_id' in columns
        pk_columns = [c.name for c in StockMovement.__table__.primary_key.columns]
        assert pk_columns == ['stm_id']

    def test_stockmovement_has_core_columns(self):
        """Verify StockMovement has core columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        core_columns = [
            'stm_id', 'stm_reference', 'stm_type', 'stm_status',
            'stm_date', 'stm_description'
        ]
        for col in core_columns:
            assert col in columns, f"Missing core column: {col}"

    def test_stockmovement_has_warehouse_columns(self):
        """Verify StockMovement has warehouse columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        warehouse_columns = ['stm_whs_id', 'stm_whs_destination_id']
        for col in warehouse_columns:
            assert col in columns, f"Missing warehouse column: {col}"

    def test_stockmovement_has_party_columns(self):
        """Verify StockMovement has client/supplier columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        party_columns = ['stm_cli_id', 'stm_sup_id', 'stm_external_party']
        for col in party_columns:
            assert col in columns, f"Missing party column: {col}"

    def test_stockmovement_has_loan_columns(self):
        """Verify StockMovement has loan tracking columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        loan_columns = [
            'stm_is_loan', 'stm_loan_return_date',
            'stm_loan_returned', 'stm_loan_return_actual_date'
        ]
        for col in loan_columns:
            assert col in columns, f"Missing loan column: {col}"

    def test_stockmovement_has_return_columns(self):
        """Verify StockMovement has return tracking columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        return_columns = ['stm_is_return', 'stm_return_reason']
        for col in return_columns:
            assert col in columns, f"Missing return column: {col}"

    def test_stockmovement_has_damage_columns(self):
        """Verify StockMovement has damage/destroy columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        damage_columns = ['stm_is_damage', 'stm_is_destroy']
        for col in damage_columns:
            assert col in columns, f"Missing damage column: {col}"

    def test_stockmovement_has_total_columns(self):
        """Verify StockMovement has total/quantity columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        total_columns = [
            'stm_total_quantity', 'stm_total_quantity_actual',
            'stm_total_value', 'stm_total_lines'
        ]
        for col in total_columns:
            assert col in columns, f"Missing total column: {col}"

    def test_stockmovement_has_source_document_columns(self):
        """Verify StockMovement has source document columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        doc_columns = ['stm_source_document', 'stm_source_document_id']
        for col in doc_columns:
            assert col in columns, f"Missing document column: {col}"

    def test_stockmovement_has_shipping_columns(self):
        """Verify StockMovement has shipping/tracking columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        shipping_columns = ['stm_tracking_number', 'stm_carrier']
        for col in shipping_columns:
            assert col in columns, f"Missing shipping column: {col}"

    def test_stockmovement_has_validation_columns(self):
        """Verify StockMovement has validation columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        validation_columns = [
            'stm_is_valid', 'stm_validated_at', 'stm_validated_by'
        ]
        for col in validation_columns:
            assert col in columns, f"Missing validation column: {col}"

    def test_stockmovement_has_audit_columns(self):
        """Verify StockMovement has audit columns."""
        columns = [c.name for c in StockMovement.__table__.columns]
        audit_columns = [
            'stm_soc_id', 'stm_notes',
            'stm_created_by', 'stm_created_at', 'stm_updated_at'
        ]
        for col in audit_columns:
            assert col in columns, f"Missing audit column: {col}"

    def test_stockmovement_has_foreign_key_to_warehouse(self):
        """Verify StockMovement has foreign key to Warehouse."""
        fk_columns = [fk.target_fullname for fk in StockMovement.__table__.foreign_keys]
        assert any('TR_WHS_Warehouse.whs_id' in fk for fk in fk_columns)

    def test_stockmovement_has_foreign_key_to_client(self):
        """Verify StockMovement has foreign key to Client."""
        fk_columns = [fk.target_fullname for fk in StockMovement.__table__.foreign_keys]
        assert any('TM_CLI_Client.cli_id' in fk for fk in fk_columns)

    def test_stockmovement_has_foreign_key_to_user(self):
        """Verify StockMovement has foreign key to User."""
        fk_columns = [fk.target_fullname for fk in StockMovement.__table__.foreign_keys]
        assert any('TM_USR_User.usr_id' in fk for fk in fk_columns)


class TestStockMovementLineModel:
    """Test cases for StockMovementLine model structure."""

    def test_stockmovementline_table_name(self):
        """Verify StockMovementLine maps to correct table."""
        assert StockMovementLine.__tablename__ == "TM_STK_StockMovementLine"

    def test_stockmovementline_has_primary_key(self):
        """Verify StockMovementLine has sml_id as primary key."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        assert 'sml_id' in columns
        pk_columns = [c.name for c in StockMovementLine.__table__.primary_key.columns]
        assert pk_columns == ['sml_id']

    def test_stockmovementline_has_required_columns(self):
        """Verify StockMovementLine has all required columns."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        required_columns = [
            'sml_id', 'sml_stm_id', 'sml_quantity', 'sml_sort_order'
        ]
        for col in required_columns:
            assert col in columns, f"Missing column: {col}"

    def test_stockmovementline_has_product_columns(self):
        """Verify StockMovementLine has product columns."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        product_columns = [
            'sml_prd_id', 'sml_pit_id', 'sml_prd_ref',
            'sml_prd_name', 'sml_description'
        ]
        for col in product_columns:
            assert col in columns, f"Missing product column: {col}"

    def test_stockmovementline_has_quantity_columns(self):
        """Verify StockMovementLine has quantity columns."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        quantity_columns = ['sml_quantity', 'sml_quantity_actual', 'sml_uom_id']
        for col in quantity_columns:
            assert col in columns, f"Missing quantity column: {col}"

    def test_stockmovementline_has_pricing_columns(self):
        """Verify StockMovementLine has pricing columns."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        pricing_columns = [
            'sml_unit_price', 'sml_total_price',
            'sml_unit_cost', 'sml_total_cost'
        ]
        for col in pricing_columns:
            assert col in columns, f"Missing pricing column: {col}"

    def test_stockmovementline_has_location_columns(self):
        """Verify StockMovementLine has location columns."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        location_columns = ['sml_location']
        for col in location_columns:
            assert col in columns, f"Missing location column: {col}"

    def test_stockmovementline_has_batch_columns(self):
        """Verify StockMovementLine has batch/serial columns."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        batch_columns = [
            'sml_batch_number', 'sml_serial_number', 'sml_expiry_date'
        ]
        for col in batch_columns:
            assert col in columns, f"Missing batch column: {col}"

    def test_stockmovementline_has_reference_columns(self):
        """Verify StockMovementLine has reference columns."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        ref_columns = [
            'sml_inv_id', 'sml_source_line_id', 'sml_source_line_type'
        ]
        for col in ref_columns:
            assert col in columns, f"Missing reference column: {col}"

    def test_stockmovementline_has_damage_columns(self):
        """Verify StockMovementLine has damage columns."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        damage_columns = ['sml_is_damaged', 'sml_damage_notes']
        for col in damage_columns:
            assert col in columns, f"Missing damage column: {col}"

    def test_stockmovementline_has_audit_columns(self):
        """Verify StockMovementLine has audit columns."""
        columns = [c.name for c in StockMovementLine.__table__.columns]
        audit_columns = ['sml_created_at', 'sml_updated_at']
        for col in audit_columns:
            assert col in columns, f"Missing audit column: {col}"

    def test_stockmovementline_has_foreign_key_to_movement(self):
        """Verify StockMovementLine has foreign key to StockMovement."""
        fk_columns = [fk.target_fullname for fk in StockMovementLine.__table__.foreign_keys]
        assert any('TM_STK_StockMovement.stm_id' in fk for fk in fk_columns)

    def test_stockmovementline_has_foreign_key_to_product(self):
        """Verify StockMovementLine has foreign key to Product."""
        fk_columns = [fk.target_fullname for fk in StockMovementLine.__table__.foreign_keys]
        assert any('TM_PRD_Product.prd_id' in fk for fk in fk_columns)


class TestModelRelationships:
    """Test model relationship definitions."""

    def test_stockmovement_has_lines_relationship(self):
        """Verify StockMovement has lines relationship."""
        assert hasattr(StockMovement, 'lines')

    def test_stockmovement_has_warehouse_relationship(self):
        """Verify StockMovement has warehouse relationship."""
        assert hasattr(StockMovement, 'warehouse')

    def test_stockmovement_has_destination_warehouse_relationship(self):
        """Verify StockMovement has destination_warehouse relationship."""
        assert hasattr(StockMovement, 'destination_warehouse')

    def test_stockmovement_has_client_relationship(self):
        """Verify StockMovement has client relationship."""
        assert hasattr(StockMovement, 'client')

    def test_stockmovement_has_creator_relationship(self):
        """Verify StockMovement has creator relationship."""
        assert hasattr(StockMovement, 'creator')

    def test_stockmovement_has_validator_relationship(self):
        """Verify StockMovement has validator relationship."""
        assert hasattr(StockMovement, 'validator')

    def test_stockmovementline_has_movement_relationship(self):
        """Verify StockMovementLine has stock_movement relationship."""
        assert hasattr(StockMovementLine, 'stock_movement')

    def test_stockmovementline_has_product_relationship(self):
        """Verify StockMovementLine has product relationship."""
        assert hasattr(StockMovementLine, 'product')

    def test_stockmovementline_has_product_instance_relationship(self):
        """Verify StockMovementLine has product_instance relationship."""
        assert hasattr(StockMovementLine, 'product_instance')


class TestModelImports:
    """Test that models can be imported correctly."""

    def test_import_from_models_module(self):
        """Test importing from app.models."""
        from app.models import (
            StockMovement,
            StockMovementLine,
            MovementType,
            MovementStatus
        )
        assert StockMovement.__tablename__ == "TM_STK_StockMovement"
        assert StockMovementLine.__tablename__ == "TM_STK_StockMovementLine"
        assert MovementType.RECEIPT.value == "RECEIPT"
        assert MovementStatus.DRAFT.value == "DRAFT"

    def test_import_from_stock_movement_module(self):
        """Test importing from app.models.stock_movement."""
        from app.models.stock_movement import (
            StockMovement,
            StockMovementLine,
            MovementType,
            MovementStatus
        )
        assert StockMovement.__tablename__ == "TM_STK_StockMovement"
        assert StockMovementLine.__tablename__ == "TM_STK_StockMovementLine"


class TestModelProperties:
    """Test model property helpers."""

    def test_stockmovement_has_id_property(self):
        """Verify StockMovement has id property."""
        assert hasattr(StockMovement, 'id')

    def test_stockmovement_has_reference_property(self):
        """Verify StockMovement has reference property."""
        assert hasattr(StockMovement, 'reference')

    def test_stockmovement_has_movement_type_property(self):
        """Verify StockMovement has movement_type property."""
        assert hasattr(StockMovement, 'movement_type')

    def test_stockmovement_has_status_property(self):
        """Verify StockMovement has status property."""
        assert hasattr(StockMovement, 'status')

    def test_stockmovement_has_warehouse_id_property(self):
        """Verify StockMovement has warehouse_id property."""
        assert hasattr(StockMovement, 'warehouse_id')

    def test_stockmovement_has_is_inbound_property(self):
        """Verify StockMovement has is_inbound property."""
        assert hasattr(StockMovement, 'is_inbound')

    def test_stockmovement_has_is_outbound_property(self):
        """Verify StockMovement has is_outbound property."""
        assert hasattr(StockMovement, 'is_outbound')

    def test_stockmovement_has_is_transfer_property(self):
        """Verify StockMovement has is_transfer property."""
        assert hasattr(StockMovement, 'is_transfer')

    def test_stockmovement_has_is_completed_property(self):
        """Verify StockMovement has is_completed property."""
        assert hasattr(StockMovement, 'is_completed')

    def test_stockmovement_has_line_count_property(self):
        """Verify StockMovement has line_count property."""
        assert hasattr(StockMovement, 'line_count')

    def test_stockmovement_has_quantity_variance_property(self):
        """Verify StockMovement has quantity_variance property."""
        assert hasattr(StockMovement, 'quantity_variance')

    def test_stockmovementline_has_id_property(self):
        """Verify StockMovementLine has id property."""
        assert hasattr(StockMovementLine, 'id')

    def test_stockmovementline_has_movement_id_property(self):
        """Verify StockMovementLine has movement_id property."""
        assert hasattr(StockMovementLine, 'movement_id')

    def test_stockmovementline_has_product_id_property(self):
        """Verify StockMovementLine has product_id property."""
        assert hasattr(StockMovementLine, 'product_id')

    def test_stockmovementline_has_quantity_property(self):
        """Verify StockMovementLine has quantity property."""
        assert hasattr(StockMovementLine, 'quantity')

    def test_stockmovementline_has_actual_quantity_property(self):
        """Verify StockMovementLine has actual_quantity property."""
        assert hasattr(StockMovementLine, 'actual_quantity')

    def test_stockmovementline_has_quantity_variance_property(self):
        """Verify StockMovementLine has quantity_variance property."""
        assert hasattr(StockMovementLine, 'quantity_variance')

    def test_stockmovementline_has_has_variance_property(self):
        """Verify StockMovementLine has has_variance property."""
        assert hasattr(StockMovementLine, 'has_variance')

    def test_stockmovementline_has_unit_price_property(self):
        """Verify StockMovementLine has unit_price property."""
        assert hasattr(StockMovementLine, 'unit_price')

    def test_stockmovementline_has_total_price_property(self):
        """Verify StockMovementLine has total_price property."""
        assert hasattr(StockMovementLine, 'total_price')

    def test_stockmovementline_has_description_property(self):
        """Verify StockMovementLine has description property."""
        assert hasattr(StockMovementLine, 'description')


class TestModelRepr:
    """Test model __repr__ methods."""

    def test_stockmovement_has_repr(self):
        """Verify StockMovement has __repr__ method."""
        assert hasattr(StockMovement, '__repr__')

    def test_stockmovementline_has_repr(self):
        """Verify StockMovementLine has __repr__ method."""
        assert hasattr(StockMovementLine, '__repr__')
