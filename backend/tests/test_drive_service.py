"""
Unit tests for the Drive Service.
Tests folder operations, file operations, entity attachments, and permissions.
"""
import json
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.drive_service import (
    DriveService,
    DriveServiceError,
    FolderNotFoundError,
    FileNotFoundError,
    InvalidEntityTypeError,
    StorageError,
)
from app.models.drive import DriveFolder, DriveFile, EntityType


class TestDriveServiceFolderOperations:
    """Test folder operations in DriveService."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        db = AsyncMock(spec=AsyncSession)
        db.add = MagicMock()
        db.flush = AsyncMock()
        db.refresh = AsyncMock()
        db.delete = AsyncMock()
        return db

    @pytest.fixture
    def drive_service(self, mock_db):
        """Create a DriveService instance with mock database."""
        return DriveService(mock_db)

    @pytest.mark.asyncio
    async def test_create_root_folder(self, drive_service, mock_db):
        """Test creating a root folder."""
        # Setup
        mock_db.execute = AsyncMock()

        # Mock refresh to set the folder ID
        async def mock_refresh(folder):
            folder.fol_id = 1

        mock_db.refresh = mock_refresh

        # Execute
        folder = await drive_service.create_folder(
            name="Documents",
            parent_id=None,
            created_by=1,
            society_id=1
        )

        # Verify
        assert folder.fol_name == "Documents"
        assert folder.fol_path == "/Documents"
        assert folder.fol_parent_id is None
        assert folder.fol_created_by == 1
        assert folder.fol_soc_id == 1
        mock_db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_subfolder(self, drive_service, mock_db):
        """Test creating a subfolder."""
        # Setup - mock parent folder
        parent_folder = DriveFolder(
            fol_id=1,
            fol_name="Documents",
            fol_path="/Documents",
            fol_parent_id=None
        )

        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = parent_folder
            return mock_result

        mock_db.execute = mock_execute

        async def mock_refresh(folder):
            folder.fol_id = 2

        mock_db.refresh = mock_refresh

        # Execute
        folder = await drive_service.create_folder(
            name="Projects",
            parent_id=1,
            created_by=1,
            society_id=1
        )

        # Verify
        assert folder.fol_name == "Projects"
        assert folder.fol_path == "/Documents/Projects"
        assert folder.fol_parent_id == 1

    @pytest.mark.asyncio
    async def test_create_folder_parent_not_found(self, drive_service, mock_db):
        """Test creating a subfolder when parent doesn't exist."""
        # Setup - no parent folder found
        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            return mock_result

        mock_db.execute = mock_execute

        # Execute & Verify
        with pytest.raises(FolderNotFoundError):
            await drive_service.create_folder(
                name="Projects",
                parent_id=999,
                created_by=1
            )

    @pytest.mark.asyncio
    async def test_get_folder_by_id(self, drive_service, mock_db):
        """Test getting a folder by ID."""
        # Setup
        folder = DriveFolder(
            fol_id=1,
            fol_name="Documents",
            fol_path="/Documents"
        )

        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = folder
            return mock_result

        mock_db.execute = mock_execute

        # Execute
        result = await drive_service.get_folder_by_id(1)

        # Verify
        assert result.fol_id == 1
        assert result.fol_name == "Documents"

    @pytest.mark.asyncio
    async def test_delete_folder_soft(self, drive_service, mock_db):
        """Test soft deleting a folder."""
        # Setup
        folder = DriveFolder(
            fol_id=1,
            fol_name="Documents",
            fol_path="/Documents"
        )

        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = folder
            mock_result.scalars.return_value.all.return_value = []
            return mock_result

        mock_db.execute = mock_execute

        # Execute
        result = await drive_service.delete_folder(1, hard_delete=False)

        # Verify
        assert result is True
        assert folder.fol_deleted_at is not None


class TestDriveServiceFileOperations:
    """Test file operations in DriveService."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        db = AsyncMock(spec=AsyncSession)
        db.add = MagicMock()
        db.flush = AsyncMock()
        db.refresh = AsyncMock()
        db.delete = AsyncMock()
        return db

    @pytest.fixture
    def drive_service(self, mock_db):
        """Create a DriveService instance with mock database."""
        service = DriveService(mock_db)
        # Mock S3 client
        service._s3_client = MagicMock()
        service._s3_client.generate_presigned_url.return_value = "https://s3.example.com/presigned-url"
        return service

    @pytest.mark.asyncio
    async def test_get_upload_url(self, drive_service, mock_db):
        """Test getting a presigned upload URL."""
        # Setup - no folder (root level)
        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            return mock_result

        mock_db.execute = mock_execute

        async def mock_refresh(file):
            file.fil_id = 1

        mock_db.refresh = mock_refresh

        # Execute
        result = await drive_service.get_upload_url(
            folder_id=None,
            file_name="test.pdf",
            file_size=1024,
            mime_type="application/pdf",
            created_by=1,
            society_id=1
        )

        # Verify
        assert "upload_url" in result
        assert "storage_key" in result
        assert "file_id" in result
        assert result["upload_url"] == "https://s3.example.com/presigned-url"
        mock_db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_upload_url_folder_not_found(self, drive_service, mock_db):
        """Test getting upload URL when folder doesn't exist."""
        # Setup - folder not found
        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = None
            return mock_result

        mock_db.execute = mock_execute

        # Execute & Verify
        with pytest.raises(FolderNotFoundError):
            await drive_service.get_upload_url(
                folder_id=999,
                file_name="test.pdf",
                file_size=1024,
                mime_type="application/pdf",
                created_by=1
            )

    @pytest.mark.asyncio
    async def test_move_file(self, drive_service, mock_db):
        """Test moving a file to a different folder."""
        # Setup
        file = DriveFile(
            fil_id=1,
            fil_name="test.pdf",
            fil_fol_id=1
        )
        target_folder = DriveFolder(
            fol_id=2,
            fol_name="Archive",
            fol_path="/Archive"
        )

        call_count = 0

        async def mock_execute(query):
            nonlocal call_count
            call_count += 1
            mock_result = MagicMock()
            if call_count == 1:
                mock_result.scalar_one_or_none.return_value = file
            else:
                mock_result.scalar_one_or_none.return_value = target_folder
            return mock_result

        mock_db.execute = mock_execute

        # Execute
        result = await drive_service.move_file(1, 2)

        # Verify
        assert result.fil_fol_id == 2

    @pytest.mark.asyncio
    async def test_rename_file(self, drive_service, mock_db):
        """Test renaming a file."""
        # Setup
        file = DriveFile(
            fil_id=1,
            fil_name="test.pdf",
            fil_original_name="old_name.pdf"
        )

        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = file
            return mock_result

        mock_db.execute = mock_execute

        # Execute
        result = await drive_service.rename_file(1, "new_name.pdf")

        # Verify
        assert result.fil_original_name == "new_name.pdf"

    @pytest.mark.asyncio
    async def test_delete_file_soft(self, drive_service, mock_db):
        """Test soft deleting a file."""
        # Setup
        file = DriveFile(
            fil_id=1,
            fil_name="test.pdf",
            fil_deleted_at=None
        )

        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = file
            return mock_result

        mock_db.execute = mock_execute

        # Execute
        result = await drive_service.delete_file(1, hard_delete=False)

        # Verify
        assert result is True
        assert file.fil_deleted_at is not None


class TestDriveServiceEntityAttachment:
    """Test entity attachment operations in DriveService."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        db = AsyncMock(spec=AsyncSession)
        db.add = MagicMock()
        db.flush = AsyncMock()
        db.refresh = AsyncMock()
        return db

    @pytest.fixture
    def drive_service(self, mock_db):
        """Create a DriveService instance with mock database."""
        return DriveService(mock_db)

    @pytest.mark.asyncio
    async def test_attach_file_to_entity(self, drive_service, mock_db):
        """Test attaching a file to an entity."""
        # Setup
        file = DriveFile(
            fil_id=1,
            fil_name="invoice.pdf",
            fil_entity_type=None,
            fil_entity_id=None
        )

        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = file
            return mock_result

        mock_db.execute = mock_execute

        # Execute
        result = await drive_service.attach_file_to_entity(
            file_id=1,
            entity_type=EntityType.INVOICE,
            entity_id=100
        )

        # Verify
        assert result.fil_entity_type == EntityType.INVOICE
        assert result.fil_entity_id == 100

    @pytest.mark.asyncio
    async def test_attach_file_invalid_entity_type(self, drive_service, mock_db):
        """Test attaching a file with invalid entity type."""
        # Execute & Verify
        with pytest.raises(InvalidEntityTypeError):
            await drive_service.attach_file_to_entity(
                file_id=1,
                entity_type="InvalidType",
                entity_id=100
            )

    @pytest.mark.asyncio
    async def test_get_entity_files(self, drive_service, mock_db):
        """Test getting files attached to an entity."""
        # Setup
        files = [
            DriveFile(fil_id=1, fil_name="file1.pdf", fil_entity_type="Invoice", fil_entity_id=100),
            DriveFile(fil_id=2, fil_name="file2.pdf", fil_entity_type="Invoice", fil_entity_id=100),
        ]

        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalars.return_value.all.return_value = files
            return mock_result

        mock_db.execute = mock_execute

        # Execute
        result = await drive_service.get_entity_files(
            entity_type=EntityType.INVOICE,
            entity_id=100
        )

        # Verify
        assert len(result) == 2
        assert all(f.fil_entity_type == "Invoice" for f in result)

    @pytest.mark.asyncio
    async def test_detach_file_from_entity(self, drive_service, mock_db):
        """Test detaching a file from an entity."""
        # Setup
        file = DriveFile(
            fil_id=1,
            fil_name="invoice.pdf",
            fil_entity_type="Invoice",
            fil_entity_id=100
        )

        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = file
            return mock_result

        mock_db.execute = mock_execute

        # Execute
        result = await drive_service.detach_file_from_entity(file_id=1)

        # Verify
        assert result.fil_entity_type is None
        assert result.fil_entity_id is None


class TestDriveServicePermissions:
    """Test permission operations in DriveService."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        db = AsyncMock(spec=AsyncSession)
        db.flush = AsyncMock()
        db.refresh = AsyncMock()
        return db

    @pytest.fixture
    def drive_service(self, mock_db):
        """Create a DriveService instance with mock database."""
        return DriveService(mock_db)

    @pytest.mark.asyncio
    async def test_set_folder_permissions(self, drive_service, mock_db):
        """Test setting folder permissions."""
        # Setup
        folder = DriveFolder(
            fol_id=1,
            fol_name="Documents",
            fol_permissions=None
        )

        async def mock_execute(query):
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = folder
            return mock_result

        mock_db.execute = mock_execute

        permissions = {
            "roles": {"read": ["user", "admin"], "write": ["admin"]},
            "users": {"read": [1, 2, 3], "write": [1]}
        }

        # Execute
        result = await drive_service.set_folder_permissions(1, permissions)

        # Verify
        assert result.fol_permissions is not None
        parsed = json.loads(result.fol_permissions)
        assert parsed["roles"]["read"] == ["user", "admin"]

    def test_check_permission_creator_access(self, drive_service):
        """Test that creator always has access."""
        # Setup
        file = DriveFile(
            fil_id=1,
            fil_name="test.pdf",
            fil_created_by=1,
            fil_permissions=json.dumps({"roles": {"read": ["admin"]}})
        )

        # Execute
        # Note: This is a sync method, wrapping in async test
        result = drive_service.check_permission(
            file_or_folder=file,
            user_id=1,  # Creator
            user_roles=["user"],
            action="read"
        )

        # Verify - creator should have access regardless of permissions
        assert result is True

    def test_check_permission_no_permissions_set(self, drive_service):
        """Test that no permissions means public access."""
        # Setup
        file = DriveFile(
            fil_id=1,
            fil_name="test.pdf",
            fil_created_by=1,
            fil_permissions=None
        )

        # Execute
        result = drive_service.check_permission(
            file_or_folder=file,
            user_id=2,  # Not creator
            user_roles=["user"],
            action="read"
        )

        # Verify - should have access (public)
        assert result is True

    def test_check_permission_role_based_access(self, drive_service):
        """Test role-based permission check."""
        # Setup
        file = DriveFile(
            fil_id=1,
            fil_name="test.pdf",
            fil_created_by=1,
            fil_permissions=json.dumps({
                "roles": {"read": ["admin", "manager"], "write": ["admin"]}
            })
        )

        # Execute - user with manager role
        result = drive_service.check_permission(
            file_or_folder=file,
            user_id=2,
            user_roles=["manager"],
            action="read"
        )

        # Verify
        assert result is True

        # Execute - user with user role (not in allowed roles)
        result = drive_service.check_permission(
            file_or_folder=file,
            user_id=3,
            user_roles=["user"],
            action="read"
        )

        # Verify
        assert result is False


class TestEntityType:
    """Test EntityType helper class."""

    def test_all_types(self):
        """Test getting all valid entity types."""
        all_types = EntityType.all_types()
        assert EntityType.INVOICE in all_types
        assert EntityType.QUOTE in all_types
        assert EntityType.ORDER in all_types
        assert EntityType.PRODUCT in all_types
        assert len(all_types) == 10

    def test_is_valid(self):
        """Test validating entity types."""
        assert EntityType.is_valid(EntityType.INVOICE) is True
        assert EntityType.is_valid("Invoice") is True
        assert EntityType.is_valid("InvalidType") is False
        assert EntityType.is_valid("") is False


class TestDriveFileModel:
    """Test DriveFile model properties."""

    def test_extension_property(self):
        """Test file extension extraction."""
        file = DriveFile(fil_name="document.pdf")
        assert file.extension == "pdf"

        file2 = DriveFile(fil_name="image.JPEG")
        assert file2.extension == "jpeg"

        file3 = DriveFile(fil_name="noextension")
        assert file3.extension == ""

    def test_is_image_property(self):
        """Test image detection."""
        image_file = DriveFile(fil_mime_type="image/png")
        assert image_file.is_image is True

        pdf_file = DriveFile(fil_mime_type="application/pdf")
        assert pdf_file.is_image is False

    def test_is_pdf_property(self):
        """Test PDF detection."""
        pdf_file = DriveFile(fil_mime_type="application/pdf")
        assert pdf_file.is_pdf is True

        image_file = DriveFile(fil_mime_type="image/png")
        assert image_file.is_pdf is False

    def test_size_formatted_property(self):
        """Test human-readable file size."""
        # Bytes
        file1 = DriveFile(fil_size_bytes=500)
        assert "500" in file1.size_formatted
        assert "B" in file1.size_formatted

        # Kilobytes
        file2 = DriveFile(fil_size_bytes=2048)
        assert "KB" in file2.size_formatted

        # Megabytes
        file3 = DriveFile(fil_size_bytes=5 * 1024 * 1024)
        assert "MB" in file3.size_formatted

    def test_is_deleted_property(self):
        """Test soft delete detection."""
        active_file = DriveFile(fil_deleted_at=None)
        assert active_file.is_deleted is False

        deleted_file = DriveFile(fil_deleted_at=datetime.utcnow())
        assert deleted_file.is_deleted is True


class TestDriveFolderModel:
    """Test DriveFolder model properties."""

    def test_is_root_property(self):
        """Test root folder detection."""
        root_folder = DriveFolder(fol_parent_id=None)
        assert root_folder.is_root is True

        child_folder = DriveFolder(fol_parent_id=1)
        assert child_folder.is_root is False

    def test_is_deleted_property(self):
        """Test soft delete detection."""
        active_folder = DriveFolder(fol_deleted_at=None)
        assert active_folder.is_deleted is False

        deleted_folder = DriveFolder(fol_deleted_at=datetime.utcnow())
        assert deleted_folder.is_deleted is True
