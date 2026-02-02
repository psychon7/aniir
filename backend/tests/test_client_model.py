"""
Test Client model, schemas, and API router.
This test verifies the Client SQLAlchemy model and API routes work correctly.
"""
import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, AsyncMock


class TestClientModel:
    """Test suite for Client model."""

    def test_model_class_exists(self):
        """Test that Client model class exists and can be imported."""
        from app.models.client import Client
        assert Client is not None
        assert hasattr(Client, '__tablename__')

    def test_model_has_expected_attributes(self):
        """Test that Client model has expected attribute definitions."""
        from app.models.client import Client

        # Check that the class has the expected mapped columns
        assert hasattr(Client, 'cli_id')
        assert hasattr(Client, 'cli_reference')
        assert hasattr(Client, 'cli_company_name')
        assert hasattr(Client, 'cli_first_name')
        assert hasattr(Client, 'cli_last_name')
        assert hasattr(Client, 'cli_email')
        assert hasattr(Client, 'cli_phone')
        assert hasattr(Client, 'cli_is_active')

    def test_model_tablename(self):
        """Test that Client maps to correct table."""
        from app.models.client import Client
        assert Client.__tablename__ == "TM_CLI_Client"

    def test_model_columns(self):
        """Test that Client has expected core columns."""
        from app.models.client import Client
        columns = list(Client.__table__.columns.keys())

        # Core identification columns
        assert "cli_id" in columns
        assert "cli_reference" in columns
        assert "cli_company_name" in columns

        # Contact columns
        assert "cli_first_name" in columns
        assert "cli_last_name" in columns
        assert "cli_email" in columns
        assert "cli_phone" in columns
        assert "cli_mobile" in columns

        # Address columns
        assert "cli_address" in columns
        assert "cli_address2" in columns
        assert "cli_postal_code" in columns
        assert "cli_city" in columns
        assert "cli_country_id" in columns

        # Tax columns
        assert "cli_vat_number" in columns
        assert "cli_siret" in columns

        # Classification columns
        assert "cli_type_id" in columns
        assert "cli_sta_id" in columns

        # Financial columns
        assert "cli_cur_id" in columns
        assert "cli_credit_limit" in columns
        assert "cli_discount" in columns

        # Status column
        assert "cli_is_active" in columns

        # Audit columns
        assert "cli_created_at" in columns
        assert "cli_updated_at" in columns
        assert "cli_created_by" in columns
        assert "cli_updated_by" in columns

    def test_primary_key(self):
        """Test that cli_id is configured as primary key."""
        from app.models.client import Client
        pk_columns = [col.name for col in Client.__table__.primary_key.columns]
        assert "cli_id" in pk_columns
        assert len(pk_columns) == 1

    def test_unique_reference(self):
        """Test that cli_reference has unique constraint."""
        from app.models.client import Client
        ref_column = Client.__table__.columns["cli_reference"]
        assert ref_column.unique is True


class TestClientSchemas:
    """Test suite for Client Pydantic schemas."""

    def test_client_base_schema(self):
        """Test ClientBase schema with required fields."""
        from app.schemas.client import ClientBase

        data = ClientBase(
            cli_company_name="Test Company",
            cli_sta_id=1
        )
        assert data.cli_company_name == "Test Company"
        assert data.cli_sta_id == 1

    def test_client_create_schema(self):
        """Test ClientCreate schema."""
        from app.schemas.client import ClientCreate

        data = ClientCreate(
            cli_company_name="Test Company",
            cli_first_name="John",
            cli_last_name="Doe",
            cli_email="john@example.com",
            cli_sta_id=1,
            cli_is_active=True
        )
        assert data.cli_company_name == "Test Company"
        assert data.cli_first_name == "John"
        assert data.cli_email == "john@example.com"
        assert data.cli_sta_id == 1

    def test_client_update_schema(self):
        """Test ClientUpdate schema with optional fields."""
        from app.schemas.client import ClientUpdate

        # All fields optional
        data = ClientUpdate()
        assert data.cli_company_name is None
        assert data.cli_email is None

        # Partial update
        data = ClientUpdate(cli_company_name="Updated Company")
        assert data.cli_company_name == "Updated Company"
        assert data.cli_email is None

    def test_client_response_schema(self):
        """Test ClientResponse schema."""
        from app.schemas.client import ClientResponse

        data = ClientResponse(
            cli_id=1,
            cli_reference="CLI-20250131-0001",
            cli_company_name="Test Company",
            cli_first_name="John",
            cli_last_name="Doe",
            cli_email="john@example.com",
            cli_sta_id=1,
            cli_is_active=True,
            cli_created_at=datetime.now(),
            cli_updated_at=None
        )
        assert data.cli_id == 1
        assert data.cli_reference == "CLI-20250131-0001"
        assert data.display_name == "Test Company"
        assert data.full_contact_name == "John Doe"

    def test_client_response_computed_fields(self):
        """Test ClientResponse computed fields."""
        from app.schemas.client import ClientResponse

        # Test full_contact_name variations
        data = ClientResponse(
            cli_id=1,
            cli_reference="CLI-20250131-0001",
            cli_company_name="Test Company",
            cli_first_name="John",
            cli_last_name=None,
            cli_sta_id=1,
            cli_is_active=True,
            cli_created_at=datetime.now()
        )
        assert data.full_contact_name == "John"

        data = ClientResponse(
            cli_id=2,
            cli_reference="CLI-20250131-0002",
            cli_company_name="Test Company 2",
            cli_first_name=None,
            cli_last_name="Doe",
            cli_sta_id=1,
            cli_is_active=True,
            cli_created_at=datetime.now()
        )
        assert data.full_contact_name == "Doe"

        data = ClientResponse(
            cli_id=3,
            cli_reference="CLI-20250131-0003",
            cli_company_name="Test Company 3",
            cli_first_name=None,
            cli_last_name=None,
            cli_sta_id=1,
            cli_is_active=True,
            cli_created_at=datetime.now()
        )
        assert data.full_contact_name is None

    def test_client_response_full_address(self):
        """Test ClientResponse full_address computed field."""
        from app.schemas.client import ClientResponse

        data = ClientResponse(
            cli_id=1,
            cli_reference="CLI-20250131-0001",
            cli_company_name="Test Company",
            cli_address="123 Test Street",
            cli_address2="Building A",
            cli_postal_code="75001",
            cli_city="Paris",
            cli_sta_id=1,
            cli_is_active=True,
            cli_created_at=datetime.now()
        )
        assert data.full_address == "123 Test Street, Building A, 75001 Paris"

        # Partial address
        data = ClientResponse(
            cli_id=2,
            cli_reference="CLI-20250131-0002",
            cli_company_name="Test Company 2",
            cli_address="456 Other Street",
            cli_city="Lyon",
            cli_sta_id=1,
            cli_is_active=True,
            cli_created_at=datetime.now()
        )
        assert data.full_address == "456 Other Street, Lyon"

    def test_client_list_response_schema(self):
        """Test ClientListResponse schema."""
        from app.schemas.client import ClientListResponse

        data = ClientListResponse(
            cli_id=1,
            cli_reference="CLI-20250131-0001",
            cli_company_name="Test Company",
            cli_email="test@example.com",
            cli_sta_id=1,
            cli_is_active=True,
            cli_created_at=datetime.now()
        )
        assert data.cli_id == 1
        assert data.display_name == "Test Company"

    def test_client_search_params_schema(self):
        """Test ClientSearchParams schema."""
        from app.schemas.client import ClientSearchParams

        params = ClientSearchParams(
            search="test",
            status_id=1,
            client_type_id=2,
            is_active=True
        )
        assert params.search == "test"
        assert params.status_id == 1
        assert params.client_type_id == 2
        assert params.is_active is True

    def test_client_paginated_response_schema(self):
        """Test ClientListPaginatedResponse schema."""
        from app.schemas.client import (
            ClientListPaginatedResponse,
            ClientListResponse
        )

        items = [
            ClientListResponse(
                cli_id=1,
                cli_reference="CLI-20250131-0001",
                cli_company_name="Company 1",
                cli_sta_id=1,
                cli_is_active=True,
                cli_created_at=datetime.now()
            ),
            ClientListResponse(
                cli_id=2,
                cli_reference="CLI-20250131-0002",
                cli_company_name="Company 2",
                cli_sta_id=1,
                cli_is_active=True,
                cli_created_at=datetime.now()
            )
        ]

        response = ClientListPaginatedResponse(
            items=items,
            total=2,
            skip=0,
            limit=100
        )

        assert len(response.items) == 2
        assert response.total == 2
        assert response.skip == 0
        assert response.limit == 100


class TestClientService:
    """Test suite for Client service."""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session."""
        session = MagicMock()
        session.execute = AsyncMock()
        session.add = MagicMock()
        session.flush = AsyncMock()
        session.refresh = AsyncMock()
        session.delete = AsyncMock()
        session.get = AsyncMock()
        return session

    @pytest.mark.asyncio
    async def test_service_instantiation(self, mock_db_session):
        """Test that service can be instantiated with mock session."""
        from app.services.client_service import ClientService

        service = ClientService(mock_db_session)
        assert service is not None
        assert service.db == mock_db_session

    def test_service_exceptions(self):
        """Test that service exceptions are properly defined."""
        from app.services.client_service import (
            ClientServiceError,
            ClientNotFoundError,
            ClientReferenceNotFoundError,
            ClientValidationError,
            DuplicateClientError
        )

        # Test base exception
        error = ClientServiceError("CODE", "message", {"key": "value"})
        assert error.code == "CODE"
        assert error.message == "message"
        assert error.details == {"key": "value"}

        # Test ClientNotFoundError
        error = ClientNotFoundError(123)
        assert error.code == "CLIENT_NOT_FOUND"
        assert "123" in error.message
        assert error.details["client_id"] == 123

        # Test ClientReferenceNotFoundError
        error = ClientReferenceNotFoundError("CLI-123")
        assert error.code == "CLIENT_REFERENCE_NOT_FOUND"
        assert "CLI-123" in error.message
        assert error.details["reference"] == "CLI-123"

        # Test ClientValidationError
        error = ClientValidationError("Invalid data", {"field": "value"})
        assert error.code == "CLIENT_VALIDATION_ERROR"
        assert error.message == "Invalid data"

        # Test DuplicateClientError
        error = DuplicateClientError("email", "test@example.com")
        assert error.code == "DUPLICATE_CLIENT"
        assert "email" in error.message
        assert error.details["field"] == "email"
        assert error.details["value"] == "test@example.com"


class TestClientAPI:
    """Test suite for Client API router."""

    def test_router_prefix(self):
        """Test that router has correct prefix."""
        from app.api.v1.clients import router
        assert router.prefix == "/clients"

    def test_router_tags(self):
        """Test that router has correct tags."""
        from app.api.v1.clients import router
        assert "Clients" in router.tags

    def test_router_routes(self):
        """Test that router has expected routes."""
        from app.api.v1.clients import router

        paths = [route.path for route in router.routes if hasattr(route, 'path')]
        methods = {}
        for route in router.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                methods[route.path] = list(route.methods)

        # CRUD routes
        assert "/clients" in paths  # list and create
        assert "/clients/{client_id}" in paths  # get, update, delete
        assert "/clients/by-reference/{reference}" in paths  # get by reference
        assert "/clients/{client_id}/details" in paths  # get with relations
        assert "/clients/{client_id}/permanent" in paths  # hard delete
        assert "/clients/{client_id}/activate" in paths  # activate
        assert "/clients/{client_id}/deactivate" in paths  # deactivate

    def test_router_methods(self):
        """Test that routes have correct HTTP methods."""
        from app.api.v1.clients import router

        route_methods = {}
        for route in router.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                key = route.path
                if key not in route_methods:
                    route_methods[key] = []
                route_methods[key].extend(list(route.methods))

        # Check main CRUD route methods
        assert "GET" in route_methods.get("/clients", [])
        assert "POST" in route_methods.get("/clients", [])
        assert "GET" in route_methods.get("/clients/{client_id}", [])
        assert "PUT" in route_methods.get("/clients/{client_id}", [])
        assert "DELETE" in route_methods.get("/clients/{client_id}", [])

        # Check additional route methods
        assert "DELETE" in route_methods.get("/clients/{client_id}/permanent", [])
        assert "PATCH" in route_methods.get("/clients/{client_id}/activate", [])
        assert "PATCH" in route_methods.get("/clients/{client_id}/deactivate", [])

    def test_error_handler_function(self):
        """Test the error handler function."""
        from fastapi import status
        from app.api.v1.clients import handle_client_error
        from app.services.client_service import (
            ClientNotFoundError,
            ClientReferenceNotFoundError,
            ClientValidationError,
            DuplicateClientError,
            ClientServiceError
        )

        # Test 404 for ClientNotFoundError
        error = ClientNotFoundError(123)
        http_exc = handle_client_error(error)
        assert http_exc.status_code == status.HTTP_404_NOT_FOUND
        assert http_exc.detail["error"]["code"] == "CLIENT_NOT_FOUND"

        # Test 404 for ClientReferenceNotFoundError
        error = ClientReferenceNotFoundError("CLI-123")
        http_exc = handle_client_error(error)
        assert http_exc.status_code == status.HTTP_404_NOT_FOUND

        # Test 422 for ClientValidationError
        error = ClientValidationError("Invalid", {})
        http_exc = handle_client_error(error)
        assert http_exc.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Test 409 for DuplicateClientError
        error = DuplicateClientError("email", "test@example.com")
        http_exc = handle_client_error(error)
        assert http_exc.status_code == status.HTTP_409_CONFLICT

        # Test default 400 for generic error
        error = ClientServiceError("GENERIC", "Generic error", {})
        http_exc = handle_client_error(error)
        assert http_exc.status_code == status.HTTP_400_BAD_REQUEST


class TestClientIntegration:
    """Integration test for Client module imports."""

    def test_model_import_from_init(self):
        """Test that Client can be imported from models __init__."""
        from app.models import Client
        assert Client is not None
        assert Client.__tablename__ == "TM_CLI_Client"

    def test_schemas_import(self):
        """Test that all schemas can be imported."""
        from app.schemas.client import (
            ClientBase,
            ClientCreate,
            ClientUpdate,
            ClientResponse,
            ClientListResponse,
            ClientListPaginatedResponse,
            ClientSearchParams,
            ClientAPIResponse,
            ClientErrorResponse
        )

        assert ClientBase is not None
        assert ClientCreate is not None
        assert ClientUpdate is not None
        assert ClientResponse is not None
        assert ClientListResponse is not None
        assert ClientListPaginatedResponse is not None
        assert ClientSearchParams is not None
        assert ClientAPIResponse is not None
        assert ClientErrorResponse is not None

    def test_service_import(self):
        """Test that service can be imported."""
        from app.services.client_service import (
            ClientService,
            get_client_service,
            ClientServiceError,
            ClientNotFoundError,
            ClientReferenceNotFoundError,
            ClientValidationError,
            DuplicateClientError
        )

        assert ClientService is not None
        assert get_client_service is not None
        assert ClientServiceError is not None
        assert ClientNotFoundError is not None
        assert ClientReferenceNotFoundError is not None
        assert ClientValidationError is not None
        assert DuplicateClientError is not None

    def test_api_router_import(self):
        """Test that API router can be imported."""
        from app.api.v1.clients import router

        assert router is not None
        assert router.prefix == "/clients"

    def test_router_registered_in_api_v1(self):
        """Test that clients router is registered in api v1."""
        from app.api.v1 import api_router

        # Check that /clients routes are accessible
        all_paths = []
        for route in api_router.routes:
            if hasattr(route, 'path'):
                all_paths.append(route.path)
            if hasattr(route, 'routes'):
                for sub_route in route.routes:
                    if hasattr(sub_route, 'path'):
                        all_paths.append(sub_route.path)

        # The routes should be included under the clients prefix
        client_routes = [p for p in all_paths if 'client' in p.lower()]
        assert len(client_routes) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
