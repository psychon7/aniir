"""
Test Role model.
This test verifies the Role SQLAlchemy model works correctly.
"""
import pytest
from app.models.role import Role


class TestRoleModel:
    """Test suite for Role model."""

    def test_model_creation(self):
        """Test that Role model can be instantiated."""
        role = Role()
        assert role is not None

    def test_model_attributes(self):
        """Test that Role has correct attributes."""
        role = Role()
        role.rol_id = 1
        role.rol_name = "Administrator"
        role.rol_active = True

        assert role.rol_id == 1
        assert role.rol_name == "Administrator"
        assert role.rol_active is True

    def test_model_tablename(self):
        """Test that Role maps to correct table."""
        assert Role.__tablename__ == "TR_ROL_Role"

    def test_model_columns(self):
        """Test that Role has correct columns."""
        columns = list(Role.__table__.columns.keys())
        assert "rol_id" in columns
        assert "rol_name" in columns
        assert "rol_active" in columns
        assert len(columns) == 3

    def test_id_property(self):
        """Test the id property alias."""
        role = Role()
        role.rol_id = 42
        assert role.id == 42

    def test_name_property(self):
        """Test the name property."""
        role = Role()
        role.rol_name = "Manager"
        assert role.name == "Manager"

    def test_display_name_property(self):
        """Test the display_name property."""
        role = Role()
        role.rol_name = "Super Admin"
        assert role.display_name == "Super Admin"

    def test_is_active_property(self):
        """Test the is_active property."""
        role = Role()

        role.rol_active = True
        assert role.is_active is True

        role.rol_active = False
        assert role.is_active is False

    def test_is_admin_role_property(self):
        """Test the is_admin_role property for role IDs 1 and 5."""
        role = Role()

        # Test admin role (id=1)
        role.rol_id = 1
        assert role.is_admin_role is True

        # Test manager role (id=5)
        role.rol_id = 5
        assert role.is_admin_role is True

        # Test regular role
        role.rol_id = 2
        assert role.is_admin_role is False

        role.rol_id = 10
        assert role.is_admin_role is False

    def test_repr(self):
        """Test the __repr__ method."""
        role = Role()
        role.rol_id = 1
        role.rol_name = "Admin"
        role.rol_active = True

        expected = "<Role(rol_id=1, name='Admin', active=True)>"
        assert repr(role) == expected

    def test_model_import_from_init(self):
        """Test that Role can be imported from models __init__."""
        from app.models import Role as ImportedRole
        assert ImportedRole is Role

    def test_primary_key(self):
        """Test that rol_id is configured as primary key."""
        pk_columns = [col.name for col in Role.__table__.primary_key.columns]
        assert "rol_id" in pk_columns
        assert len(pk_columns) == 1
