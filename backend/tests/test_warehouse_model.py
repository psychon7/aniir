"""
Test Warehouse model.
This test verifies the Warehouse SQLAlchemy model works correctly.
"""
import pytest
from app.models.warehouse import Warehouse


class TestWarehouseModel:
    """Test suite for Warehouse model."""

    def test_model_creation(self):
        """Test that Warehouse model can be instantiated."""
        warehouse = Warehouse()
        assert warehouse is not None

    def test_model_attributes(self):
        """Test that Warehouse has correct attributes."""
        warehouse = Warehouse()
        warehouse.wh_id = 1
        warehouse.wh_code = "WH001"
        warehouse.wh_name = "Main Warehouse"
        warehouse.wh_address = "123 Industrial Park"
        warehouse.wh_city = "Paris"
        warehouse.wh_is_default = True
        warehouse.wh_is_active = True

        assert warehouse.wh_id == 1
        assert warehouse.wh_code == "WH001"
        assert warehouse.wh_name == "Main Warehouse"
        assert warehouse.wh_address == "123 Industrial Park"
        assert warehouse.wh_city == "Paris"
        assert warehouse.wh_is_default is True
        assert warehouse.wh_is_active is True

    def test_model_tablename(self):
        """Test that Warehouse maps to correct table."""
        assert Warehouse.__tablename__ == "TR_WH_Warehouse"

    def test_model_columns(self):
        """Test that Warehouse has correct columns."""
        columns = list(Warehouse.__table__.columns.keys())
        assert "wh_id" in columns
        assert "wh_code" in columns
        assert "wh_name" in columns
        assert "wh_address" in columns
        assert "wh_city" in columns
        assert "wh_country_id" in columns
        assert "wh_is_default" in columns
        assert "wh_is_active" in columns
        assert len(columns) == 8

    def test_display_name_property(self):
        """Test the display_name property."""
        warehouse = Warehouse()
        warehouse.wh_name = "Secondary Warehouse"
        assert warehouse.display_name == "Secondary Warehouse"

    def test_code_property(self):
        """Test the code property."""
        warehouse = Warehouse()
        warehouse.wh_code = "WH002"
        assert warehouse.code == "WH002"

    def test_name_property(self):
        """Test the name property."""
        warehouse = Warehouse()
        warehouse.wh_name = "Logistics Center"
        assert warehouse.name == "Logistics Center"

    def test_is_active_property(self):
        """Test the is_active property."""
        warehouse = Warehouse()

        warehouse.wh_is_active = True
        assert warehouse.is_active is True

        warehouse.wh_is_active = False
        assert warehouse.is_active is False

    def test_is_default_property(self):
        """Test the is_default property."""
        warehouse = Warehouse()

        warehouse.wh_is_default = True
        assert warehouse.is_default is True

        warehouse.wh_is_default = False
        assert warehouse.is_default is False

    def test_full_address_property(self):
        """Test the full_address property."""
        warehouse = Warehouse()
        warehouse.wh_address = "456 Commerce Road"
        warehouse.wh_city = "Lyon"

        assert warehouse.full_address == "456 Commerce Road, Lyon"

    def test_full_address_with_missing_parts(self):
        """Test full_address property with missing parts."""
        warehouse = Warehouse()
        warehouse.wh_address = "789 Market Street"
        warehouse.wh_city = None

        assert warehouse.full_address == "789 Market Street"

        warehouse.wh_address = None
        warehouse.wh_city = "Marseille"

        assert warehouse.full_address == "Marseille"

    def test_repr(self):
        """Test the __repr__ method."""
        warehouse = Warehouse()
        warehouse.wh_id = 1
        warehouse.wh_code = "WH001"
        warehouse.wh_name = "Main Warehouse"

        expected = "<Warehouse(wh_id=1, code='WH001', name='Main Warehouse')>"
        assert repr(warehouse) == expected

    def test_model_import_from_init(self):
        """Test that Warehouse can be imported from models __init__."""
        from app.models import Warehouse as ImportedWarehouse
        assert ImportedWarehouse is Warehouse

    def test_primary_key(self):
        """Test that wh_id is configured as primary key."""
        pk_columns = [col.name for col in Warehouse.__table__.primary_key.columns]
        assert "wh_id" in pk_columns
        assert len(pk_columns) == 1

    def test_foreign_key_country(self):
        """Test that wh_country_id has foreign key to TR_COU_Country."""
        country_col = Warehouse.__table__.c.wh_country_id
        fk_targets = [fk.target_fullname for fk in country_col.foreign_keys]
        assert "TR_COU_Country.cou_id" in fk_targets

    def test_nullable_fields(self):
        """Test nullable configuration of fields."""
        columns = Warehouse.__table__.columns

        # Required fields
        assert columns['wh_code'].nullable is False
        assert columns['wh_name'].nullable is False
        assert columns['wh_is_default'].nullable is False
        assert columns['wh_is_active'].nullable is False

        # Optional fields
        assert columns['wh_address'].nullable is True
        assert columns['wh_city'].nullable is True
        assert columns['wh_country_id'].nullable is True
