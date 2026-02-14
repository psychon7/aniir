"""Storage Service for MinIO/S3 file operations."""

import io
from typing import Optional, BinaryIO
from minio import Minio
from minio.error import S3Error

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class StorageService:
    """Service for file storage operations using MinIO/S3."""
    
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error checking/creating bucket: {e}")
    
    def upload_file(
        self,
        file_data: BinaryIO,
        filename: str,
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Upload file to storage.
        
        Args:
            file_data: File-like object
            filename: Path/name for the file
            content_type: MIME type
            
        Returns:
            URL to access the file
        """
        try:
            # Get file size
            file_data.seek(0, 2)
            file_size = file_data.tell()
            file_data.seek(0)
            
            self.client.put_object(
                self.bucket_name,
                filename,
                file_data,
                file_size,
                content_type=content_type,
            )
            
            # Generate URL
            url = f"{settings.MINIO_PUBLIC_URL}/{self.bucket_name}/{filename}"
            return url
            
        except S3Error as e:
            logger.error(f"Error uploading file: {e}")
            raise
    
    def get_file(self, filename: str) -> Optional[bytes]:
        """
        Get file from storage.
        
        Args:
            filename: Path/name of the file
            
        Returns:
            File bytes or None if not found
        """
        try:
            response = self.client.get_object(self.bucket_name, filename)
            return response.read()
        except S3Error as e:
            if e.code == "NoSuchKey":
                return None
            logger.error(f"Error getting file: {e}")
            raise
        finally:
            if 'response' in locals():
                response.close()
                response.release_conn()
    
    def get_presigned_url(self, filename: str, expires_hours: int = 1) -> str:
        """
        Get a presigned URL for temporary access.
        
        Args:
            filename: Path/name of the file
            expires_hours: Hours until URL expires
            
        Returns:
            Presigned URL
        """
        from datetime import timedelta
        
        try:
            url = self.client.presigned_get_object(
                self.bucket_name,
                filename,
                expires=timedelta(hours=expires_hours),
            )
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
    
    def delete_file(self, filename: str) -> bool:
        """
        Delete file from storage.
        
        Args:
            filename: Path/name of the file
            
        Returns:
            True if deleted, False if not found
        """
        try:
            self.client.remove_object(self.bucket_name, filename)
            return True
        except S3Error as e:
            if e.code == "NoSuchKey":
                return False
            logger.error(f"Error deleting file: {e}")
            raise


# =============================================================================
# Singleton Instance
# =============================================================================

_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create the storage service singleton."""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service


# Lazy singleton - only instantiated when imported and credentials are available
try:
    if settings.MINIO_ACCESS_KEY and settings.MINIO_SECRET_KEY:
        storage_service = get_storage_service()
    else:
        storage_service = None
        logger.warning("MinIO credentials not configured, storage_service unavailable")
except Exception as e:
    storage_service = None
    logger.warning(f"Failed to initialize storage_service: {e}")
