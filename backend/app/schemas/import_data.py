"""
Pydantic schemas for Data Import API requests and responses.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class ImportEntityType(str, Enum):
    """Supported entity types for import."""
    PRODUCT = "product"
    CLIENT = "client"
    SUPPLIER = "supplier"
    BRAND = "brand"


class ImportStatus(str, Enum):
    """Import job status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"  # Some rows succeeded, some failed


class ImportMode(str, Enum):
    """How to handle existing records."""
    CREATE_ONLY = "create_only"  # Skip duplicates
    UPDATE_ONLY = "update_only"  # Only update existing
    UPSERT = "upsert"  # Create or update


# ==========================================================================
# Column Mapping Schemas
# ==========================================================================

class ColumnMapping(BaseModel):
    """Maps a CSV/Excel column to a database field."""
    source_column: str = Field(..., description="Column name in the source file")
    target_field: str = Field(..., description="Database field name")
    transform: Optional[str] = Field(None, description="Optional transformation (uppercase, lowercase, trim)")


class ImportFieldDefinition(BaseModel):
    """Definition of an importable field."""
    name: str = Field(..., description="Field name")
    label: str = Field(..., description="Display label")
    required: bool = Field(default=False, description="Whether field is required")
    field_type: str = Field(default="string", description="Field type (string, number, date, boolean, lookup)")
    lookup_type: Optional[str] = Field(None, description="Lookup type if field_type is lookup")
    description: Optional[str] = Field(None, description="Field description/help text")


# ==========================================================================
# Import Request Schemas
# ==========================================================================

class ImportPreviewRequest(BaseModel):
    """Request to preview import data."""
    entity_type: ImportEntityType = Field(..., description="Type of entity to import")
    column_mappings: List[ColumnMapping] = Field(..., description="Column to field mappings")
    preview_rows: int = Field(default=10, ge=1, le=100, description="Number of rows to preview")


class ImportRequest(BaseModel):
    """Request to start a bulk import."""
    entity_type: ImportEntityType = Field(..., description="Type of entity to import")
    column_mappings: List[ColumnMapping] = Field(..., description="Column to field mappings")
    import_mode: ImportMode = Field(default=ImportMode.CREATE_ONLY, description="How to handle existing records")
    soc_id: int = Field(..., description="Society ID for the imported data")
    skip_errors: bool = Field(default=False, description="Continue import even if some rows fail")
    dry_run: bool = Field(default=False, description="Validate without actually importing")


# ==========================================================================
# Import Response Schemas
# ==========================================================================

class ImportRowError(BaseModel):
    """Error information for a single row."""
    row_number: int = Field(..., description="Row number in source file (1-indexed)")
    errors: List[str] = Field(..., description="List of errors for this row")
    data: Optional[Dict[str, Any]] = Field(None, description="Row data that failed")


class ImportRowResult(BaseModel):
    """Result for a single imported row."""
    row_number: int = Field(..., description="Row number in source file")
    entity_id: Optional[int] = Field(None, description="ID of created/updated entity")
    action: str = Field(..., description="Action taken (created, updated, skipped)")


class ImportPreviewResponse(BaseModel):
    """Response from import preview."""
    success: bool = Field(default=True)
    total_rows: int = Field(..., description="Total rows in file")
    preview_data: List[Dict[str, Any]] = Field(..., description="Preview of mapped data")
    validation_errors: List[ImportRowError] = Field(default_factory=list, description="Validation errors found")
    column_headers: List[str] = Field(..., description="Column headers from file")


class ImportResultResponse(BaseModel):
    """Response from completed import."""
    success: bool = Field(default=True)
    status: ImportStatus = Field(..., description="Import job status")
    message: str = Field(..., description="Result message")
    total_rows: int = Field(..., description="Total rows processed")
    created_count: int = Field(default=0, description="Number of records created")
    updated_count: int = Field(default=0, description="Number of records updated")
    skipped_count: int = Field(default=0, description="Number of records skipped")
    error_count: int = Field(default=0, description="Number of rows with errors")
    errors: List[ImportRowError] = Field(default_factory=list, description="Row-level errors")
    results: List[ImportRowResult] = Field(default_factory=list, description="Per-row results")
    duration_seconds: Optional[float] = Field(None, description="Import duration in seconds")


class ImportFieldsResponse(BaseModel):
    """Response listing available fields for an entity type."""
    success: bool = Field(default=True)
    entity_type: ImportEntityType = Field(..., description="Entity type")
    fields: List[ImportFieldDefinition] = Field(..., description="Available fields")


class ImportTemplateResponse(BaseModel):
    """Response with CSV template."""
    success: bool = Field(default=True)
    entity_type: ImportEntityType = Field(..., description="Entity type")
    template_csv: str = Field(..., description="CSV template content")
    fields: List[ImportFieldDefinition] = Field(..., description="Field definitions")


# ==========================================================================
# Upload Response
# ==========================================================================

class FileUploadResponse(BaseModel):
    """Response from file upload."""
    success: bool = Field(default=True)
    file_id: str = Field(..., description="Temporary file ID for subsequent operations")
    filename: str = Field(..., description="Original filename")
    row_count: int = Field(..., description="Number of data rows (excluding header)")
    column_headers: List[str] = Field(..., description="Column headers detected")
    sample_data: List[Dict[str, Any]] = Field(..., description="Sample rows from file")
