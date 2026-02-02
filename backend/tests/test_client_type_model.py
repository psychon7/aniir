"""
Test ClientType model.
This test verifies the ClientType SQLAlchemy model works correctly.
"""
import pytest
from app.models.client_type import ClientType


class TestClientTypeModel:
    """Test suite for ClientType model."""

    def test_model_creation(self):
        """Test that ClientType model can be instantiated."""
        client_type = ClientType()
        assert client_type is not None

    def test_model_attributes(self):
        """Test that ClientType has correct attributes."""
        client_type = ClientType()
        client_type.ct_id = 1
        client_type.ct_description = "Client"
        client_type.ct_is_active = True

        assert client_type.ct_id == 1
        assert client_type.ct_description == "Client"
        assert client_type.ct_is_active is True

    def test_model_tablename(self):
        """Test that ClientType maps to correct table."""
        assert ClientType.__tablename__ == "TR_CT_ClientType"

    def test_model_columns(self):
        """Test that ClientType has correct columns."""
        columns = list(ClientType.__table__.columns.keys())
        assert "ct_id" in columns
        assert "ct_description" in columns
        assert "ct_is_active" in columns
        assert len(columns) == 3

    def test_display_name_property(self):
        """Test the display_name property."""
        client_type = ClientType()
        client_type.ct_description = "Prospect"
        assert client_type.display_name == "Prospect"

    def test_is_active_property(self):
        """Test the is_active property."""
        client_type = ClientType()

        client_type.ct_is_active = True
        assert client_type.is_active is True

        client_type.ct_is_active = False
        assert client_type.is_active is False

    def test_repr(self):
        """Test the __repr__ method."""
        client_type = ClientType()
        client_type.ct_id = 1
        client_type.ct_description = "Client"

        expected = "<ClientType(ct_id=1, description='Client')>"
        assert repr(client_type) == expected

    def test_model_import_from_init(self):
        """Test that ClientType can be imported from models __init__."""
        from app.models import ClientType as ImportedClientType
        assert ImportedClientType is ClientType

    def test_primary_key(self):
        """Test that ct_id is configured as primary key."""
        pk_columns = [col.name for col in ClientType.__table__.primary_key.columns]
        assert "ct_id" in pk_columns
        assert len(pk_columns) == 1


class TestClientTypeSchema:
    """Test suite for ClientType Pydantic schemas."""

    def test_create_schema(self):
        """Test ClientTypeCreate schema."""
        from app.schemas.client_type import ClientTypeCreate

        data = ClientTypeCreate(
            ct_description="Test Client Type",
            ct_is_active=True
        )
        assert data.ct_description == "Test Client Type"
        assert data.ct_is_active is True

    def test_update_schema(self):
        """Test ClientTypeUpdate schema with optional fields."""
        from app.schemas.client_type import ClientTypeUpdate

        # All fields optional
        data = ClientTypeUpdate()
        assert data.ct_description is None
        assert data.ct_is_active is None

        # Partial update
        data = ClientTypeUpdate(ct_description="Updated")
        assert data.ct_description == "Updated"
        assert data.ct_is_active is None

    def test_response_schema(self):
        """Test ClientTypeResponse schema."""
        from app.schemas.client_type import ClientTypeResponse

        # Test with model_dump simulating DB response
        data = ClientTypeResponse(
            ct_id=1,
            ct_description="Client",
            ct_is_active=True
        )
        assert data.ct_id == 1
        assert data.ct_description == "Client"
        assert data.ct_is_active is True
        assert data.display_name == "Client"

    def test_list_response_schema(self):
        """Test ClientTypeListResponse schema."""
        from app.schemas.client_type import ClientTypeListResponse

        data = ClientTypeListResponse(
            ct_id=1,
            ct_description="Prospect",
            ct_is_active=True
        )
        assert data.ct_id == 1
        assert data.display_name == "Prospect"

    def test_paginated_response_schema(self):
        """Test ClientTypeListPaginatedResponse schema."""
        from app.schemas.client_type import (
            ClientTypeListPaginatedResponse,
            ClientTypeResponse
        )

        items = [
            ClientTypeResponse(
                ct_id=1,
                ct_description="Client",
                ct_is_active=True
            ),
            ClientTypeResponse(
                ct_id=2,
                ct_description="Prospect",
                ct_is_active=True
            )
        ]

        response = ClientTypeListPaginatedResponse(
            items=items,
            total=2,
            skip=0,
            limit=100
        )

        assert len(response.items) == 2
        assert response.total == 2
        assert response.skip == 0
        assert response.limit == 100


class TestClientTypeService:
    """Test suite for ClientType service."""

    @pytest.mark.asyncio
    async def test_service_instantiation(self, mock_db_session):
        """Test that service can be instantiated with mock session."""
        from app.services.client_type_service import ClientTypeService

        service = ClientTypeService(mock_db_session)
        assert service is not None
        assert service.db == mock_db_session


class TestClientTypeAPI:
    """Test suite for ClientType API router."""

    def test_router_prefix(self):
        """Test that router has correct prefix."""
        from app.api.v1.client_types import router
        assert router.prefix == "/client-types"

    def test_router_tags(self):
        """Test that router has correct tags."""
        from app.api.v1.client_types import router
        assert "Client Types" in router.tags

    def test_router_routes(self):
        """Test that router has expected routes."""
        from app.api.v1.client_types import router

        paths = [route.path for route in router.routes if hasattr(route, 'path')]

        assert "/client-types" in paths  # list and create
        assert "/client-types/{client_type_id}" in paths  # get, update, delete
        assert "/client-types/by-description/{description}" in paths  # get by description
