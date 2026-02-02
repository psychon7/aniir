"""
Tests for the ClientContactService.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.client import Client
from app.models.client_contact import ClientContact
from app.services.client_contact_service import (
    ClientContactService,
    ClientContactNotFoundError,
    ClientNotFoundForContactError,
    ContactNotBelongsToClientError
)
from app.schemas.client_contact import (
    ClientContactBase,
    ClientContactUpdate,
    ClientContactResponse,
    ClientContactListResponse,
    ClientContactListPaginatedResponse
)


@pytest.fixture
def mock_db_session():
    """Create a mock database session."""
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    return session


@pytest.fixture
def mock_client():
    """Create a mock client object."""
    client = MagicMock(spec=Client)
    client.cli_id = 1
    client.cli_reference = "CLI-20250131-0001"
    client.cli_company_name = "Test Company"
    return client


@pytest.fixture
def mock_contact():
    """Create a mock contact object."""
    contact = MagicMock(spec=ClientContact)
    contact.cco_id = 1
    contact.cco_cli_id = 1
    contact.cco_first_name = "John"
    contact.cco_last_name = "Doe"
    contact.cco_email = "john.doe@example.com"
    contact.cco_phone = "+33123456789"
    contact.cco_mobile = "+33611223344"
    contact.cco_job_title = "Manager"
    contact.cco_department = "Sales"
    contact.cco_is_primary = True
    contact.cco_notes = "Test notes"
    return contact


@pytest.fixture
def sample_contacts():
    """Create sample contact objects for testing."""
    contacts = []
    for i in range(5):
        contact = MagicMock(spec=ClientContact)
        contact.cco_id = i + 1
        contact.cco_cli_id = 1
        contact.cco_first_name = f"FirstName{i+1}"
        contact.cco_last_name = f"LastName{i+1}"
        contact.cco_email = f"contact{i+1}@example.com"
        contact.cco_phone = f"+3312345{i:04d}"
        contact.cco_is_primary = i == 0  # First one is primary
        contact.cco_job_title = f"Title {i+1}"
        contact.cco_department = "Sales"
        contact.cco_mobile = None
        contact.cco_notes = None
        contacts.append(contact)
    return contacts


class TestClientContactService:
    """Tests for ClientContactService methods."""

    @pytest.mark.asyncio
    async def test_create_contact_success(self, mock_db_session, mock_client):
        """Test creating a contact successfully - verify service calls."""
        # Arrange
        service = ClientContactService(mock_db_session)
        mock_db_session.get = AsyncMock(return_value=mock_client)

        # Mock execute for primary contact check
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        contact_data = ClientContactBase(
            cco_first_name="Jane",
            cco_last_name="Smith",
            cco_email="jane.smith@example.com",
            cco_is_primary=False
        )

        # Use patch to mock ClientContact creation
        with patch('app.services.client_contact_service.ClientContact') as MockContact:
            mock_new_contact = MagicMock()
            MockContact.return_value = mock_new_contact

            # Act
            contact = await service.create_contact(client_id=1, data=contact_data)

            # Assert
            mock_db_session.add.assert_called_once_with(mock_new_contact)
            mock_db_session.flush.assert_called_once()
            mock_db_session.refresh.assert_called_once_with(mock_new_contact)

    @pytest.mark.asyncio
    async def test_create_contact_client_not_found(self, mock_db_session):
        """Test creating a contact when client doesn't exist."""
        # Arrange
        service = ClientContactService(mock_db_session)
        mock_db_session.get = AsyncMock(return_value=None)

        contact_data = ClientContactBase(
            cco_first_name="Jane",
            cco_last_name="Smith"
        )

        # Act & Assert
        with pytest.raises(ClientNotFoundForContactError) as exc_info:
            await service.create_contact(client_id=999, data=contact_data)

        assert exc_info.value.code == "CLIENT_NOT_FOUND"
        assert "999" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_get_contact_success(self, mock_db_session, mock_client, mock_contact):
        """Test getting a contact successfully."""
        # Arrange
        service = ClientContactService(mock_db_session)
        mock_db_session.get = AsyncMock(side_effect=[mock_client, mock_contact])

        # Act
        contact = await service.get_contact(client_id=1, contact_id=1)

        # Assert
        assert contact == mock_contact

    @pytest.mark.asyncio
    async def test_get_contact_not_found(self, mock_db_session, mock_client):
        """Test getting a contact that doesn't exist."""
        # Arrange
        service = ClientContactService(mock_db_session)
        mock_db_session.get = AsyncMock(side_effect=[mock_client, None])

        # Act & Assert
        with pytest.raises(ClientContactNotFoundError) as exc_info:
            await service.get_contact(client_id=1, contact_id=999)

        assert exc_info.value.code == "CONTACT_NOT_FOUND"

    @pytest.mark.asyncio
    async def test_get_contact_wrong_client(self, mock_db_session, mock_client, mock_contact):
        """Test getting a contact that belongs to a different client."""
        # Arrange
        service = ClientContactService(mock_db_session)
        mock_contact.cco_cli_id = 2  # Different client
        mock_db_session.get = AsyncMock(side_effect=[mock_client, mock_contact])

        # Act & Assert
        with pytest.raises(ContactNotBelongsToClientError) as exc_info:
            await service.get_contact(client_id=1, contact_id=1)

        assert exc_info.value.code == "CONTACT_NOT_BELONGS_TO_CLIENT"

    @pytest.mark.asyncio
    async def test_list_contacts_success(self, mock_db_session, mock_client, sample_contacts):
        """Test listing contacts for a client."""
        # Arrange
        service = ClientContactService(mock_db_session)
        mock_db_session.get = AsyncMock(return_value=mock_client)

        # Mock count query
        count_result = MagicMock()
        count_result.scalar.return_value = 5

        # Mock contacts query
        contacts_result = MagicMock()
        contacts_result.scalars.return_value.all.return_value = sample_contacts

        mock_db_session.execute = AsyncMock(side_effect=[count_result, contacts_result])

        # Act
        contacts, total = await service.list_contacts(client_id=1, skip=0, limit=100)

        # Assert
        assert total == 5
        assert len(contacts) == 5

    @pytest.mark.asyncio
    async def test_list_contacts_with_pagination(self, mock_db_session, mock_client, sample_contacts):
        """Test listing contacts with pagination."""
        # Arrange
        service = ClientContactService(mock_db_session)
        mock_db_session.get = AsyncMock(return_value=mock_client)

        count_result = MagicMock()
        count_result.scalar.return_value = 5

        contacts_result = MagicMock()
        contacts_result.scalars.return_value.all.return_value = sample_contacts[:2]

        mock_db_session.execute = AsyncMock(side_effect=[count_result, contacts_result])

        # Act
        contacts, total = await service.list_contacts(client_id=1, skip=0, limit=2)

        # Assert
        assert total == 5
        assert len(contacts) == 2

    @pytest.mark.asyncio
    async def test_update_contact_success(self, mock_db_session, mock_client, mock_contact):
        """Test updating a contact successfully."""
        # Arrange
        service = ClientContactService(mock_db_session)
        mock_db_session.get = AsyncMock(side_effect=[mock_client, mock_contact])

        update_data = ClientContactUpdate(
            cco_first_name="Updated",
            cco_job_title="Director"
        )

        # Act
        contact = await service.update_contact(client_id=1, contact_id=1, data=update_data)

        # Assert
        assert mock_contact.cco_first_name == "Updated"
        assert mock_contact.cco_job_title == "Director"
        mock_db_session.flush.assert_called_once()
        mock_db_session.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_contact_success(self, mock_db_session, mock_client, mock_contact):
        """Test deleting a contact successfully."""
        # Arrange
        service = ClientContactService(mock_db_session)
        mock_db_session.get = AsyncMock(side_effect=[mock_client, mock_contact])

        # Act
        result = await service.delete_contact(client_id=1, contact_id=1)

        # Assert
        assert result is True
        mock_db_session.delete.assert_called_once_with(mock_contact)
        mock_db_session.flush.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_primary_contact_unsets_existing(self, mock_db_session, mock_client):
        """Test that _handle_primary_contact unsets existing primary contacts."""
        # Arrange
        service = ClientContactService(mock_db_session)

        # Create an existing primary contact
        existing_primary = MagicMock(spec=ClientContact)
        existing_primary.cco_is_primary = True

        # Mock execute to return existing primary contact
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [existing_primary]
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        # Act - call the internal method directly
        await service._handle_primary_contact(client_id=1, is_primary=True)

        # Assert - verify existing primary was unset
        assert existing_primary.cco_is_primary is False

    @pytest.mark.asyncio
    async def test_handle_primary_contact_no_action_when_not_primary(self, mock_db_session):
        """Test that _handle_primary_contact does nothing when is_primary=False."""
        # Arrange
        service = ClientContactService(mock_db_session)

        # Act
        await service._handle_primary_contact(client_id=1, is_primary=False)

        # Assert - execute should not be called
        mock_db_session.execute.assert_not_called()


class TestClientContactSchemas:
    """Tests for ClientContact schemas."""

    def test_contact_response_from_attributes(self, mock_contact):
        """Test that ClientContactResponse validates correctly."""
        response = ClientContactResponse.model_validate(mock_contact)

        assert response.cco_id == mock_contact.cco_id
        assert response.cco_cli_id == mock_contact.cco_cli_id
        assert response.cco_first_name == mock_contact.cco_first_name
        assert response.cco_last_name == mock_contact.cco_last_name
        assert response.full_name == f"{mock_contact.cco_first_name} {mock_contact.cco_last_name}"

    def test_contact_list_response_from_attributes(self, mock_contact):
        """Test that ClientContactListResponse validates correctly."""
        response = ClientContactListResponse.model_validate(mock_contact)

        assert response.cco_id == mock_contact.cco_id
        assert response.full_name == f"{mock_contact.cco_first_name} {mock_contact.cco_last_name}"

    def test_paginated_response_structure(self, sample_contacts):
        """Test that paginated response has correct structure."""
        items = [ClientContactListResponse.model_validate(c) for c in sample_contacts[:2]]

        response = ClientContactListPaginatedResponse(
            items=items,
            total=5,
            skip=0,
            limit=2
        )

        assert len(response.items) == 2
        assert response.total == 5
        assert response.skip == 0
        assert response.limit == 2

    def test_contact_base_validation(self):
        """Test that ClientContactBase validates required fields."""
        # Should work with required fields only
        contact = ClientContactBase(
            cco_first_name="John",
            cco_last_name="Doe"
        )

        assert contact.cco_first_name == "John"
        assert contact.cco_last_name == "Doe"
        assert contact.cco_is_primary is False  # Default value

    def test_contact_update_partial(self):
        """Test that ClientContactUpdate allows partial updates."""
        update = ClientContactUpdate(cco_first_name="Updated")

        data = update.model_dump(exclude_unset=True)
        assert "cco_first_name" in data
        assert "cco_last_name" not in data
