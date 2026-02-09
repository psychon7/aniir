"""
Drive Module Models.

Maps to TM_DRV_File and TM_DRV_Folder tables.
Provides file management and folder hierarchy for the Drive feature.

Column naming follows ERP convention:
  - drf_* prefix for TM_DRV_Folder columns
  - drv_* prefix for TM_DRV_File columns

Python attribute names use PascalCase to match what the service/repository layers expect,
with additional snake_case aliases (fol_*, fil_*) for endpoint compatibility.
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import Integer, BigInteger, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    pass


class DriveFolder(Base):
    """
    Drive Folder model.
    Organizes files into a hierarchical folder structure.
    Maps to TM_DRV_Folder table.
    """

    __tablename__ = "TM_DRV_Folder"

    # Primary key
    Id: Mapped[int] = mapped_column("drf_id", Integer, primary_key=True, autoincrement=True)

    # Folder metadata
    Name: Mapped[str] = mapped_column("drf_name", String(500), nullable=False)
    Path: Mapped[Optional[str]] = mapped_column("drf_path", String(2000), nullable=True)
    Description: Mapped[Optional[str]] = mapped_column(
        "drf_description", String(500), nullable=True
    )

    # Hierarchy
    ParentId: Mapped[Optional[int]] = mapped_column(
        "drf_parent_id", Integer, ForeignKey("TM_DRV_Folder.drf_id"), nullable=True
    )

    # Entity association
    EntityType: Mapped[Optional[str]] = mapped_column(
        "drf_entity_type", String(100), nullable=True
    )
    EntityId: Mapped[Optional[int]] = mapped_column("drf_entity_id", Integer, nullable=True)

    # Display / visibility
    IsHidden: Mapped[bool] = mapped_column(
        "drf_is_hidden", Boolean, nullable=False, default=False
    )
    Permissions: Mapped[Optional[str]] = mapped_column(
        "drf_permissions", String(2000), nullable=True
    )

    # Society / tenant
    SocietyId: Mapped[Optional[int]] = mapped_column("soc_id", Integer, nullable=True)

    # Audit
    CreatedBy: Mapped[Optional[int]] = mapped_column("usr_creator_id", Integer, nullable=True)
    IsActive: Mapped[bool] = mapped_column(
        "drf_is_active", Boolean, nullable=False, default=True
    )
    CreatedAt: Mapped[datetime] = mapped_column(
        "drf_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    UpdatedAt: Mapped[Optional[datetime]] = mapped_column(
        "drf_d_update", DateTime, nullable=True
    )

    # Relationships
    children: Mapped[List["DriveFolder"]] = relationship(
        "DriveFolder",
        back_populates="parent",
        lazy="selectin",
        foreign_keys=[ParentId],
    )
    parent: Mapped[Optional["DriveFolder"]] = relationship(
        "DriveFolder",
        back_populates="children",
        remote_side="DriveFolder.Id",
        lazy="selectin",
        foreign_keys=[ParentId],
    )
    files: Mapped[List["DriveFile"]] = relationship(
        "DriveFile",
        back_populates="folder",
        lazy="select",
    )

    # -------------------------------------------------------------------------
    # Aliases used by the endpoint breadcrumbs (fol_* convention)
    # -------------------------------------------------------------------------
    @property
    def fol_id(self) -> int:
        return self.Id

    @property
    def fol_name(self) -> str:
        return self.Name

    @property
    def fol_path(self) -> Optional[str]:
        return self.Path

    @property
    def fol_parent_id(self) -> Optional[int]:
        return self.ParentId

    # Schema-friendly aliases
    @property
    def id(self) -> int:
        return self.Id

    @property
    def name(self) -> str:
        return self.Name

    @property
    def parent_id(self) -> Optional[int]:
        return self.ParentId

    @property
    def path(self) -> Optional[str]:
        return self.Path

    @property
    def description(self) -> Optional[str]:
        return self.Description

    @property
    def entity_type(self) -> Optional[str]:
        return self.EntityType

    @property
    def entity_id(self) -> Optional[int]:
        return self.EntityId

    @property
    def is_hidden(self) -> bool:
        return self.IsHidden

    @property
    def file_count(self) -> int:
        return 0  # Computed at query time by repository

    @property
    def folder_count(self) -> int:
        return 0  # Computed at query time by repository

    @property
    def total_size(self) -> int:
        return 0  # Computed at query time

    @property
    def created_at(self) -> datetime:
        return self.CreatedAt

    @property
    def created_by(self) -> Optional[int]:
        return self.CreatedBy

    @property
    def updated_at(self) -> Optional[datetime]:
        return self.UpdatedAt

    def __repr__(self) -> str:
        return f"<DriveFolder(id={self.Id}, name='{self.Name}', path='{self.Path}')>"


class DriveFile(Base):
    """
    Drive File model.
    Stores file metadata, storage location, and entity associations.
    Maps to TM_DRV_File table.
    """

    __tablename__ = "TM_DRV_File"

    # Primary key
    Id: Mapped[int] = mapped_column("drv_id", Integer, primary_key=True, autoincrement=True)

    # File metadata
    FileName: Mapped[str] = mapped_column("drv_name", String(500), nullable=False)
    OriginalName: Mapped[Optional[str]] = mapped_column(
        "drv_original_name", String(500), nullable=True
    )
    FileType: Mapped[Optional[str]] = mapped_column("drv_extension", String(50), nullable=True)
    MimeType: Mapped[Optional[str]] = mapped_column("drv_mime_type", String(200), nullable=True)
    FileSize: Mapped[Optional[int]] = mapped_column("drv_size", BigInteger, nullable=True)
    Description: Mapped[Optional[str]] = mapped_column(
        "drv_description", String(500), nullable=True
    )
    Tags: Mapped[Optional[str]] = mapped_column("drv_tags", String(1000), nullable=True)

    # Storage
    FilePath: Mapped[Optional[str]] = mapped_column("drv_path", String(2000), nullable=True)
    StorageKey: Mapped[Optional[str]] = mapped_column(
        "drv_storage_key", String(500), nullable=True
    )

    # Folder association
    FolderId: Mapped[Optional[int]] = mapped_column(
        "drf_id", Integer, ForeignKey("TM_DRV_Folder.drf_id"), nullable=True
    )

    # Entity association
    EntityType: Mapped[Optional[str]] = mapped_column(
        "drv_entity_type", String(100), nullable=True
    )
    EntityId: Mapped[Optional[int]] = mapped_column("drv_entity_id", Integer, nullable=True)

    # Access control
    IsPublic: Mapped[bool] = mapped_column(
        "drv_is_public", Boolean, nullable=False, default=False
    )

    # Usage tracking
    DownloadCount: Mapped[int] = mapped_column(
        "drv_download_count", Integer, nullable=False, default=0
    )

    # Upload status
    Status: Mapped[str] = mapped_column(
        "drv_status", String(50), nullable=False, default="active"
    )
    ContentHash: Mapped[Optional[str]] = mapped_column(
        "drv_content_hash", String(128), nullable=True
    )

    # Society / tenant
    SocietyId: Mapped[Optional[int]] = mapped_column("soc_id", Integer, nullable=True)

    # Audit
    CreatedBy: Mapped[Optional[int]] = mapped_column("usr_creator_id", Integer, nullable=True)
    UpdatedBy: Mapped[Optional[int]] = mapped_column("usr_updater_id", Integer, nullable=True)
    DeletedBy: Mapped[Optional[int]] = mapped_column("usr_deleter_id", Integer, nullable=True)
    IsActive: Mapped[bool] = mapped_column(
        "drv_is_active", Boolean, nullable=False, default=True
    )
    IsDeleted: Mapped[bool] = mapped_column(
        "drv_is_deleted", Boolean, nullable=False, default=False
    )
    CreatedAt: Mapped[datetime] = mapped_column(
        "drv_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    UpdatedAt: Mapped[Optional[datetime]] = mapped_column("drv_d_update", DateTime, nullable=True)
    DeletedAt: Mapped[Optional[datetime]] = mapped_column(
        "drv_d_deleted", DateTime, nullable=True
    )

    # Relationships
    folder: Mapped[Optional["DriveFolder"]] = relationship(
        "DriveFolder",
        back_populates="files",
        lazy="selectin",
    )

    # -------------------------------------------------------------------------
    # Aliases used by the endpoint (fil_* convention)
    # -------------------------------------------------------------------------
    @property
    def fil_original_name(self) -> Optional[str]:
        return self.OriginalName

    @property
    def fil_mime_type(self) -> Optional[str]:
        return self.MimeType

    @property
    def fil_size_bytes(self) -> Optional[int]:
        return self.FileSize

    # Schema-friendly aliases (lowercase)
    @property
    def id(self) -> int:
        return self.Id

    @property
    def name(self) -> Optional[str]:
        return self.FileName

    @property
    def file_name(self) -> str:
        return self.FileName

    @property
    def original_name(self) -> Optional[str]:
        return self.OriginalName

    @property
    def file_path(self) -> Optional[str]:
        return self.FilePath

    @property
    def storage_key(self) -> Optional[str]:
        return self.StorageKey

    @property
    def file_type(self) -> Optional[str]:
        return self.FileType

    @property
    def file_size(self) -> Optional[int]:
        return self.FileSize

    @property
    def mime_type(self) -> Optional[str]:
        return self.MimeType

    @property
    def entity_type(self) -> Optional[str]:
        return self.EntityType

    @property
    def entity_id(self) -> Optional[int]:
        return self.EntityId

    @property
    def folder_id(self) -> Optional[int]:
        return self.FolderId

    @property
    def description(self) -> Optional[str]:
        return self.Description

    @property
    def is_public(self) -> bool:
        return self.IsPublic

    @property
    def download_count(self) -> int:
        return self.DownloadCount

    @property
    def created_at(self) -> datetime:
        return self.CreatedAt

    @property
    def created_by(self) -> Optional[int]:
        return self.CreatedBy

    @property
    def updated_at(self) -> Optional[datetime]:
        return self.UpdatedAt

    @property
    def updated_by(self) -> Optional[int]:
        return self.UpdatedBy

    def __repr__(self) -> str:
        return (
            f"<DriveFile(id={self.Id}, name='{self.FileName}', "
            f"type='{self.FileType}', size={self.FileSize})>"
        )
