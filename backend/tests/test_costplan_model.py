"""
Tests for CostPlan and CostPlanLine models.
Verifies the model structure, relationships, and schemas.
"""
import pytest
from datetime import datetime, timedelta
from decimal import Decimal

from app.models.costplan import CostPlan, CostPlanLine
from app.schemas.costplan import (
    CostPlanStatus,
    CostPlanBase, CostPlanCreate, CostPlanUpdate, CostPlanResponse,
    CostPlanLineBase, CostPlanLineCreate, CostPlanLineUpdate, CostPlanLineResponse,
    CostPlanSearchParams, CostPlanDetailResponse,
    CostPlanConvertRequest, CostPlanDuplicateRequest,
    CostPlanSummary
)


class TestCostPlanModel:
    """Test cases for CostPlan model structure."""

    def test_costplan_table_name(self):
        """Verify CostPlan maps to correct table."""
        assert CostPlan.__tablename__ == "TM_CP_CostPlan"

    def test_costplan_has_required_columns(self):
        """Verify CostPlan has all required columns."""
        columns = [c.name for c in CostPlan.__table__.columns]
        required_columns = [
            'cp_id', 'cp_reference', 'cp_cli_id', 'cp_date', 'cp_valid_until',
            'cp_sta_id', 'cp_cur_id', 'cp_sub_total', 'cp_total_vat',
            'cp_total_amount', 'cp_discount', 'cp_notes', 'cp_internal_notes',
            'cp_created_at', 'cp_updated_at'
        ]
        for col in required_columns:
            assert col in columns, f"Missing column: {col}"

    def test_costplan_has_shipping_columns(self):
        """Verify CostPlan has shipping address columns."""
        columns = [c.name for c in CostPlan.__table__.columns]
        shipping_columns = [
            'cp_shipping_address', 'cp_shipping_city',
            'cp_shipping_postal_code', 'cp_shipping_country_id'
        ]
        for col in shipping_columns:
            assert col in columns, f"Missing shipping column: {col}"

    def test_costplan_has_billing_columns(self):
        """Verify CostPlan has billing address columns."""
        columns = [c.name for c in CostPlan.__table__.columns]
        billing_columns = [
            'cp_billing_address', 'cp_billing_city',
            'cp_billing_postal_code', 'cp_billing_country_id'
        ]
        for col in billing_columns:
            assert col in columns, f"Missing billing column: {col}"

    def test_costplan_has_conversion_tracking_columns(self):
        """Verify CostPlan has conversion tracking columns."""
        columns = [c.name for c in CostPlan.__table__.columns]
        conversion_columns = [
            'cp_converted_to_order', 'cp_ord_id', 'cp_converted_at'
        ]
        for col in conversion_columns:
            assert col in columns, f"Missing conversion column: {col}"

    def test_costplan_has_pdf_tracking_columns(self):
        """Verify CostPlan has PDF tracking columns."""
        columns = [c.name for c in CostPlan.__table__.columns]
        pdf_columns = ['cp_pdf_url', 'cp_pdf_generated_at']
        for col in pdf_columns:
            assert col in columns, f"Missing PDF column: {col}"

    def test_costplan_has_organization_columns(self):
        """Verify CostPlan has organization columns."""
        columns = [c.name for c in CostPlan.__table__.columns]
        org_columns = ['cp_bu_id', 'cp_soc_id', 'cp_created_by']
        for col in org_columns:
            assert col in columns, f"Missing org column: {col}"

    def test_costplan_has_terms_conditions_column(self):
        """Verify CostPlan has terms and conditions column."""
        columns = [c.name for c in CostPlan.__table__.columns]
        assert 'cp_terms_conditions' in columns

    def test_costplan_primary_key(self):
        """Verify CostPlan primary key is cp_id."""
        pk_columns = [c.name for c in CostPlan.__table__.primary_key.columns]
        assert pk_columns == ['cp_id']


class TestCostPlanLineModel:
    """Test cases for CostPlanLine model structure."""

    def test_costplanline_table_name(self):
        """Verify CostPlanLine maps to correct table."""
        assert CostPlanLine.__tablename__ == "TM_CP_CostPlanLine"

    def test_costplanline_has_required_columns(self):
        """Verify CostPlanLine has all required columns."""
        columns = [c.name for c in CostPlanLine.__table__.columns]
        required_columns = [
            'cpl_id', 'cpl_cp_id', 'cpl_line_number', 'cpl_prd_id',
            'cpl_description', 'cpl_quantity', 'cpl_unit_price',
            'cpl_discount', 'cpl_vat_id', 'cpl_vat_amount',
            'cpl_line_total', 'cpl_sort_order'
        ]
        for col in required_columns:
            assert col in columns, f"Missing column: {col}"

    def test_costplanline_primary_key(self):
        """Verify CostPlanLine primary key is cpl_id."""
        pk_columns = [c.name for c in CostPlanLine.__table__.primary_key.columns]
        assert pk_columns == ['cpl_id']

    def test_costplanline_has_foreign_key_to_costplan(self):
        """Verify CostPlanLine has foreign key to CostPlan."""
        fk_columns = [fk.target_fullname for fk in CostPlanLine.__table__.foreign_keys]
        assert any('TM_CP_CostPlan.cp_id' in fk for fk in fk_columns)

    def test_costplanline_has_foreign_key_to_vat_rate(self):
        """Verify CostPlanLine has foreign key to VatRate."""
        fk_columns = [fk.target_fullname for fk in CostPlanLine.__table__.foreign_keys]
        assert any('TR_VAT_VatRate.vat_id' in fk for fk in fk_columns)


class TestCostPlanSchemas:
    """Test cases for CostPlan Pydantic schemas."""

    def test_costplan_status_enum(self):
        """Test CostPlanStatus enum values."""
        assert CostPlanStatus.DRAFT == "DRAFT"
        assert CostPlanStatus.SENT == "SENT"
        assert CostPlanStatus.ACCEPTED == "ACCEPTED"
        assert CostPlanStatus.REJECTED == "REJECTED"
        assert CostPlanStatus.EXPIRED == "EXPIRED"
        assert CostPlanStatus.CONVERTED == "CONVERTED"
        assert CostPlanStatus.CANCELLED == "CANCELLED"

    def test_costplan_create_schema_required_fields(self):
        """Test CostPlanCreate schema requires correct fields."""
        data = {
            "cp_cli_id": 1,
            "cp_date": datetime.now(),
            "cp_sta_id": 1,
            "cp_cur_id": 1
        }
        schema = CostPlanCreate(**data)
        assert schema.cp_cli_id == 1

    def test_costplan_create_schema_with_lines(self):
        """Test CostPlanCreate schema with lines."""
        data = {
            "cp_cli_id": 1,
            "cp_date": datetime.now(),
            "cp_sta_id": 1,
            "cp_cur_id": 1,
            "lines": [
                {
                    "cpl_description": "Test Line",
                    "cpl_quantity": Decimal("2"),
                    "cpl_unit_price": Decimal("50.00"),
                    "cpl_vat_id": 1
                }
            ]
        }
        schema = CostPlanCreate(**data)
        assert len(schema.lines) == 1
        assert schema.lines[0].cpl_description == "Test Line"

    def test_costplan_update_schema_optional_fields(self):
        """Test CostPlanUpdate schema has all optional fields."""
        # Empty update should work
        schema = CostPlanUpdate()
        assert schema.cp_cli_id is None
        assert schema.cp_date is None

    def test_costplan_line_create_schema(self):
        """Test CostPlanLineCreate schema."""
        data = {
            "cpl_description": "Test Line",
            "cpl_quantity": Decimal("2"),
            "cpl_unit_price": Decimal("50.00"),
            "cpl_vat_id": 1
        }
        schema = CostPlanLineCreate(**data)
        assert schema.cpl_description == "Test Line"
        assert schema.cpl_quantity == Decimal("2")

    def test_costplan_line_create_schema_with_product(self):
        """Test CostPlanLineCreate schema with product reference."""
        data = {
            "cpl_prd_id": 123,
            "cpl_description": "Product Line",
            "cpl_quantity": Decimal("1"),
            "cpl_unit_price": Decimal("100.00"),
            "cpl_vat_id": 1
        }
        schema = CostPlanLineCreate(**data)
        assert schema.cpl_prd_id == 123

    def test_costplan_search_params_defaults(self):
        """Test CostPlanSearchParams default values."""
        params = CostPlanSearchParams()
        assert params.page == 1
        assert params.page_size == 20
        assert params.sort_by == "cp_created_at"
        assert params.sort_order == "desc"

    def test_costplan_search_params_with_filters(self):
        """Test CostPlanSearchParams with filter values."""
        params = CostPlanSearchParams(
            client_id=1,
            status_id=2,
            converted_to_order=False,
            min_amount=Decimal("100"),
            max_amount=Decimal("1000")
        )
        assert params.client_id == 1
        assert params.status_id == 2
        assert params.min_amount == Decimal("100")

    def test_costplan_duplicate_request(self):
        """Test CostPlanDuplicateRequest schema."""
        data = {
            "new_valid_until": datetime.now() + timedelta(days=30),
            "new_client_id": 2,
            "include_lines": True
        }
        schema = CostPlanDuplicateRequest(**data)
        assert schema.new_client_id == 2
        assert schema.include_lines is True

    def test_costplan_convert_request(self):
        """Test CostPlanConvertRequest schema."""
        data = {
            "include_all_lines": True,
            "order_date": datetime.now(),
            "notes": "Converted from quote"
        }
        schema = CostPlanConvertRequest(**data)
        assert schema.include_all_lines is True
        assert schema.notes == "Converted from quote"

    def test_costplan_convert_request_with_specific_lines(self):
        """Test CostPlanConvertRequest with specific line IDs."""
        data = {
            "include_all_lines": False,
            "line_ids": [1, 2, 3]
        }
        schema = CostPlanConvertRequest(**data)
        assert schema.include_all_lines is False
        assert schema.line_ids == [1, 2, 3]

    def test_costplan_summary_schema(self):
        """Test CostPlanSummary schema."""
        data = {
            "total_count": 100,
            "draft_count": 20,
            "sent_count": 30,
            "accepted_count": 25,
            "rejected_count": 10,
            "expired_count": 5,
            "converted_count": 10,
            "total_value": Decimal("50000.00"),
            "average_value": Decimal("500.00"),
            "conversion_rate": Decimal("25.00")
        }
        schema = CostPlanSummary(**data)
        assert schema.total_count == 100
        assert schema.conversion_rate == Decimal("25.00")

    def test_costplan_line_update_all_optional(self):
        """Test CostPlanLineUpdate has all optional fields."""
        schema = CostPlanLineUpdate()
        assert schema.cpl_description is None
        assert schema.cpl_quantity is None


class TestModelRelationships:
    """Test model relationship definitions."""

    def test_costplan_has_lines_relationship(self):
        """Verify CostPlan has lines relationship."""
        assert hasattr(CostPlan, 'lines')

    def test_costplan_has_client_relationship(self):
        """Verify CostPlan has client relationship."""
        assert hasattr(CostPlan, 'client')

    def test_costplan_has_status_relationship(self):
        """Verify CostPlan has status relationship."""
        assert hasattr(CostPlan, 'status')

    def test_costplan_has_currency_relationship(self):
        """Verify CostPlan has currency relationship."""
        assert hasattr(CostPlan, 'currency')

    def test_costplan_has_business_unit_relationship(self):
        """Verify CostPlan has business_unit relationship."""
        assert hasattr(CostPlan, 'business_unit')

    def test_costplan_has_society_relationship(self):
        """Verify CostPlan has society relationship."""
        assert hasattr(CostPlan, 'society')

    def test_costplan_has_created_by_user_relationship(self):
        """Verify CostPlan has created_by_user relationship."""
        assert hasattr(CostPlan, 'created_by_user')

    def test_costplan_has_converted_order_relationship(self):
        """Verify CostPlan has converted_order relationship."""
        assert hasattr(CostPlan, 'converted_order')

    def test_costplanline_has_costplan_relationship(self):
        """Verify CostPlanLine has cost_plan relationship."""
        assert hasattr(CostPlanLine, 'cost_plan')

    def test_costplanline_has_vatrate_relationship(self):
        """Verify CostPlanLine has vat_rate relationship."""
        assert hasattr(CostPlanLine, 'vat_rate')


class TestModelImports:
    """Test that models can be imported correctly."""

    def test_import_from_models_module(self):
        """Test importing from app.models."""
        from app.models import CostPlan, CostPlanLine
        assert CostPlan.__tablename__ == "TM_CP_CostPlan"
        assert CostPlanLine.__tablename__ == "TM_CP_CostPlanLine"

    def test_import_from_schemas_module(self):
        """Test importing from app.schemas."""
        from app.schemas import (
            CostPlanStatus, CostPlanCreate, CostPlanResponse,
            CostPlanLineCreate, CostPlanLineResponse
        )
        assert CostPlanStatus.DRAFT == "DRAFT"
