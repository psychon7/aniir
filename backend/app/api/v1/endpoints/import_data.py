"""
Data Import API Router.

Provides REST API endpoints for bulk data import:
- Upload CSV/Excel files
- Preview import data with validation
- Execute bulk imports for products, clients, suppliers, brands
- Generate import templates
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.import_service import (
    ImportService,
    ImportServiceError,
    InvalidFileError,
    ValidationError,
    get_import_service,
    async_get_fields,
    async_generate_template,
    async_store_file,
    async_preview,
    async_execute_import,
)
from app.schemas.import_data import (
    ImportEntityType,
    ImportMode,
    ColumnMapping,
    ImportPreviewRequest,
    ImportRequest,
    ImportPreviewResponse,
    ImportResultResponse,
    ImportFieldsResponse,
    ImportTemplateResponse,
    FileUploadResponse,
)


router = APIRouter(prefix="/import", tags=["Data Import"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_import_error(error: ImportServiceError) -> HTTPException:
    """Convert ImportServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "IMPORT_ERROR"

    if isinstance(error, InvalidFileError):
        status_code = status.HTTP_400_BAD_REQUEST
        error_code = "INVALID_FILE"
    elif isinstance(error, ValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        error_code = "VALIDATION_ERROR"

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error_code,
                "message": str(error)
            }
        }
    )


# ==========================================================================
# Template & Field Information
# ==========================================================================

@router.get(
    "/fields/{entity_type}",
    response_model=ImportFieldsResponse,
    summary="Get importable fields for entity type",
    description="Get the list of fields that can be imported for a specific entity type."
)
async def get_import_fields(
    entity_type: ImportEntityType,
    service: ImportService = Depends(get_import_service)
):
    """Get available fields for import."""
    fields = await async_get_fields(service, entity_type)
    return ImportFieldsResponse(
        success=True,
        entity_type=entity_type,
        fields=fields
    )


@router.get(
    "/template/{entity_type}",
    response_model=ImportTemplateResponse,
    summary="Get CSV template for entity type",
    description="Generate a CSV template with headers for all importable fields."
)
async def get_import_template(
    entity_type: ImportEntityType,
    service: ImportService = Depends(get_import_service)
):
    """Get CSV template for an entity type."""
    template_csv = await async_generate_template(service, entity_type)
    fields = await async_get_fields(service, entity_type)

    return ImportTemplateResponse(
        success=True,
        entity_type=entity_type,
        template_csv=template_csv,
        fields=fields
    )


@router.get(
    "/template/{entity_type}/download",
    response_class=PlainTextResponse,
    summary="Download CSV template",
    description="Download a CSV template file for the specified entity type."
)
async def download_template(
    entity_type: ImportEntityType,
    service: ImportService = Depends(get_import_service)
):
    """Download CSV template as a file."""
    template_csv = await async_generate_template(service, entity_type)

    return PlainTextResponse(
        content=template_csv,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={entity_type.value}_import_template.csv"
        }
    )


# ==========================================================================
# File Upload
# ==========================================================================

@router.post(
    "/upload",
    response_model=FileUploadResponse,
    summary="Upload CSV file for import",
    description="""
    Upload a CSV file for bulk import.

    The file will be parsed and stored temporarily.
    Returns a file_id to use in subsequent preview and import operations.

    Supported formats: CSV (UTF-8 encoded)
    """
)
async def upload_file(
    file: UploadFile = File(..., description="CSV file to import"),
    service: ImportService = Depends(get_import_service)
):
    """Upload a CSV file for import."""
    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "NO_FILENAME", "message": "File must have a name"}}
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "INVALID_FORMAT", "message": "Only CSV files are supported"}}
        )

    # Read and parse file
    try:
        content = await file.read()
        content_str = content.decode("utf-8-sig")  # Handle BOM
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "ENCODING_ERROR", "message": "File must be UTF-8 encoded"}}
        )

    # Parse CSV
    try:
        headers, rows = service.parse_csv_content(content_str)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "PARSE_ERROR", "message": f"Failed to parse CSV: {str(e)}"}}
        )

    if not headers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "NO_HEADERS", "message": "CSV file must have headers"}}
        )

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "NO_DATA", "message": "CSV file has no data rows"}}
        )

    # Store file temporarily
    file_id = await async_store_file(service, file.filename, headers, rows)

    # Get sample data (first 5 rows)
    sample_data = rows[:5]

    return FileUploadResponse(
        success=True,
        file_id=file_id,
        filename=file.filename,
        row_count=len(rows),
        column_headers=headers,
        sample_data=sample_data
    )


# ==========================================================================
# Preview & Execute Import
# ==========================================================================

@router.post(
    "/preview/{file_id}",
    response_model=ImportPreviewResponse,
    summary="Preview import with validation",
    description="""
    Preview how the import will be processed.

    Applies column mappings and validates data without actually importing.
    Use this to verify mappings and identify validation errors before executing the import.
    """
)
async def preview_import(
    file_id: str,
    entity_type: ImportEntityType = Query(..., description="Entity type to import"),
    column_mappings: List[ColumnMapping] = ...,
    preview_rows: int = Query(10, ge=1, le=100, description="Number of rows to preview"),
    service: ImportService = Depends(get_import_service)
):
    """Preview import data with validation."""
    try:
        return await async_preview(service, file_id, entity_type, column_mappings, preview_rows)
    except ImportServiceError as e:
        raise handle_import_error(e)


@router.post(
    "/execute/{file_id}",
    response_model=ImportResultResponse,
    summary="Execute bulk import",
    description="""
    Execute the bulk import for an uploaded file.

    Import modes:
    - **create_only**: Only create new records, skip duplicates
    - **update_only**: Only update existing records, skip new
    - **upsert**: Create or update records

    Options:
    - **skip_errors**: Continue importing even if some rows fail
    - **dry_run**: Validate and simulate without actually importing
    """
)
async def execute_import(
    file_id: str,
    request: ImportRequest,
    service: ImportService = Depends(get_import_service)
):
    """Execute the bulk import."""
    try:
        return await async_execute_import(
            service,
            file_id,
            request.entity_type,
            request.column_mappings,
            request.import_mode,
            request.soc_id,
            request.skip_errors,
            request.dry_run
        )
    except ImportServiceError as e:
        raise handle_import_error(e)


# ==========================================================================
# Quick Import (combined upload + import for simple cases)
# ==========================================================================

@router.post(
    "/quick",
    response_model=ImportResultResponse,
    summary="Quick import with auto-mapping",
    description="""
    Quick import that automatically maps columns by header name.

    Column headers in the CSV should match field names (e.g., prd_ref, prd_name).
    Use this for simple imports when the CSV already has the correct column names.
    """
)
async def quick_import(
    entity_type: ImportEntityType = Query(..., description="Entity type to import"),
    soc_id: int = Query(..., description="Society ID"),
    import_mode: ImportMode = Query(ImportMode.CREATE_ONLY, description="Import mode"),
    skip_errors: bool = Query(False, description="Skip rows with errors"),
    dry_run: bool = Query(False, description="Dry run (validate only)"),
    file: UploadFile = File(..., description="CSV file to import"),
    service: ImportService = Depends(get_import_service)
):
    """Quick import with automatic column mapping."""
    # Validate and read file
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "INVALID_FORMAT", "message": "Only CSV files are supported"}}
        )

    try:
        content = await file.read()
        content_str = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "ENCODING_ERROR", "message": "File must be UTF-8 encoded"}}
        )

    # Parse CSV
    try:
        headers, rows = service.parse_csv_content(content_str)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "PARSE_ERROR", "message": f"Failed to parse CSV: {str(e)}"}}
        )

    if not headers or not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": {"code": "EMPTY_FILE", "message": "CSV file is empty"}}
        )

    # Store file
    file_id = await async_store_file(service, file.filename, headers, rows)

    # Auto-generate column mappings (map headers to themselves)
    # This works when CSV headers match field names
    fields = await async_get_fields(service, entity_type)
    field_names = {f.name for f in fields}
    column_mappings = [
        ColumnMapping(source_column=h, target_field=h)
        for h in headers
        if h in field_names
    ]

    if not column_mappings:
        service.cleanup_temp_file(file_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "NO_MAPPINGS",
                    "message": f"No matching columns found. Expected column names like: {', '.join(f.name for f in fields[:5])}"
                }
            }
        )

    # Execute import
    try:
        return await async_execute_import(
            service,
            file_id,
            entity_type,
            column_mappings,
            import_mode,
            soc_id,
            skip_errors,
            dry_run
        )
    except ImportServiceError as e:
        raise handle_import_error(e)
