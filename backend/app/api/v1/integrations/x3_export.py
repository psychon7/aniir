"""
Sage X3 Export API Router.

Provides endpoints for:
- Exporting invoices to X3 format (ZIP with CSV)
- Validating data before export
- Managing customer and product mappings
- Viewing export history and logs
"""
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.database import get_db
from app.services.x3_export_service import X3ExportService, get_x3_export_service, X3ExportError
from pydantic import BaseModel, Field


router = APIRouter(prefix="/x3", tags=["X3 Integration"])


# ==========================================================================
# Request/Response Schemas
# ==========================================================================

class X3InvoiceExportRequest(BaseModel):
    """Request schema for exporting invoices to X3."""
    date_from: date = Field(..., description="Start date of invoice date range")
    date_to: date = Field(..., description="End date of invoice date range")
    society_id: Optional[int] = Field(None, description="Filter by society/company ID")
    bu_id: Optional[int] = Field(None, description="Filter by business unit ID")
    status_ids: Optional[List[int]] = Field(None, description="Filter by invoice status IDs")
    include_lines: bool = Field(default=True, description="Include invoice lines in export")

    class Config:
        json_schema_extra = {
            "example": {
                "date_from": "2025-01-01",
                "date_to": "2025-01-31",
                "include_lines": True
            }
        }


class X3ExportFileInfo(BaseModel):
    """Information about an exported file."""
    filename: str
    size_bytes: int
    record_count: int


class X3InvoiceExportResponse(BaseModel):
    """Response schema for invoice export."""
    success: bool = True
    export_id: int = Field(..., description="ID of the export log record")
    status: str
    date_from: str
    date_to: str
    total_invoices: int
    total_lines: int
    exported_invoices: int
    failed_invoices: int
    skipped_invoices: int = Field(0, description="Invoices skipped due to missing mappings")
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class X3ValidationResponse(BaseModel):
    """Response for export validation."""
    success: bool = True
    is_valid: bool
    invoice_count: int
    valid_invoices: int
    invalid_invoices: int
    missing_customer_mappings: List[dict] = Field(default_factory=list)
    missing_product_mappings: List[dict] = Field(default_factory=list)
    can_export: bool


class X3CustomerMapCreate(BaseModel):
    """Schema for creating X3 customer mapping."""
    client_id: int
    x3_customer_code: str = Field(..., min_length=1, max_length=20)
    sales_site: str = Field(default="FCY1", max_length=10)


class X3ProductMapCreate(BaseModel):
    """Schema for creating X3 product mapping."""
    product_id: int
    x3_product_code: str = Field(..., min_length=1, max_length=20)
    tax_code: Optional[str] = Field(None, max_length=10)


class X3MappingResponse(BaseModel):
    """Response for mapping creation."""
    success: bool = True
    message: str
    id: int


class X3MappingStatsResponse(BaseModel):
    """Response for mapping statistics."""
    success: bool = True
    mapped_customers: int
    mapped_products: int
    total_customers: int
    total_products: int
    customer_coverage_percent: float
    product_coverage_percent: float


class X3ExportLogResponse(BaseModel):
    """Response for export log entry."""
    id: int
    export_type: str
    status: str
    date_from: str
    date_to: str
    total_records: int
    exported_records: int
    failed_records: int
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str


class X3ExportLogListResponse(BaseModel):
    """Response for list of export logs."""
    success: bool = True
    items: List[X3ExportLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class X3ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: str
    message: str
    details: Optional[dict] = None


# ==========================================================================
# Invoice Export Endpoints
# ==========================================================================

@router.post(
    "/invoices/export",
    response_model=X3InvoiceExportResponse,
    responses={
        200: {"description": "Export completed successfully"},
        400: {"model": X3ErrorResponse, "description": "Invalid request"},
        500: {"model": X3ErrorResponse, "description": "Export failed"}
    },
    summary="Export invoices to X3 format (ZIP with CSV)",
    description="""
    Export invoices within a date range to Sage X3 format.

    Generates a ZIP file containing:
    - X3_SIH_H.csv: Invoice headers
    - X3_SIH_L.csv: Invoice lines
    - export_manifest.txt: Export metadata

    The export process:
    1. Fetches invoices matching the criteria
    2. Looks up X3 customer/product mappings
    3. Generates CSV files in X3 import format
    4. Creates a downloadable ZIP file

    Invoices without customer mappings are skipped with warnings.
    """
)
async def export_invoices_to_x3(
    request: X3InvoiceExportRequest,
    db: AsyncSession = Depends(get_db)
):
    """Export invoices to X3 format as ZIP with CSV files."""
    service = get_x3_export_service(db)

    try:
        result = await service.export_invoices_to_x3(
            date_from=request.date_from,
            date_to=request.date_to,
            society_id=request.society_id,
            bu_id=request.bu_id,
            status_ids=request.status_ids,
            include_lines=request.include_lines,
            user_id=None  # TODO: Get from current user
        )

        return X3InvoiceExportResponse(
            success=True,
            export_id=result["export_id"],
            status=result["status"],
            date_from=str(request.date_from),
            date_to=str(request.date_to),
            total_invoices=result["total_invoices"],
            total_lines=result["total_lines"],
            exported_invoices=result["exported_invoices"],
            failed_invoices=result["failed_invoices"],
            skipped_invoices=result["skipped_invoices"],
            file_name=result["file_name"],
            file_path=result["file_path"],
            warnings=result["warnings"],
            errors=result["errors"]
        )

    except X3ExportError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": e.code,
                "message": e.message,
                "details": e.details
            }
        )


@router.post(
    "/invoices/validate",
    response_model=X3ValidationResponse,
    summary="Validate invoices before export",
    description="""
    Check if invoices can be exported by verifying all required mappings exist.

    Returns:
    - Count of valid/invalid invoices
    - List of missing customer mappings
    - List of missing product mappings
    """
)
async def validate_invoices_for_export(
    date_from: date = Query(..., description="Start date of invoice date range"),
    date_to: date = Query(..., description="End date of invoice date range"),
    society_id: Optional[int] = Query(None, description="Filter by society/company ID"),
    bu_id: Optional[int] = Query(None, description="Filter by business unit ID"),
    db: AsyncSession = Depends(get_db)
):
    """Validate invoices before export."""
    service = get_x3_export_service(db)

    result = await service.validate_invoices_for_export(
        date_from=date_from,
        date_to=date_to,
        society_id=society_id,
        bu_id=bu_id
    )

    return X3ValidationResponse(
        success=True,
        **result
    )


@router.get(
    "/invoices/export/{export_id}/download",
    responses={
        200: {"description": "File download", "content": {"application/zip": {}}},
        404: {"model": X3ErrorResponse, "description": "Export not found"}
    },
    summary="Download export file",
    description="Download the ZIP file for a completed export."
)
async def download_export_file(
    export_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Download the export ZIP file."""
    service = get_x3_export_service(db)

    try:
        export_log = await service.get_export_log(export_id)

        if not export_log.x3el_file_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "error": "FILE_NOT_FOUND", "message": "No file available for this export"}
            )

        if not os.path.exists(export_log.x3el_file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "error": "FILE_NOT_FOUND", "message": "Export file no longer exists"}
            )

        return FileResponse(
            path=export_log.x3el_file_path,
            filename=export_log.x3el_file_name,
            media_type="application/zip"
        )

    except X3ExportError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": e.code, "message": e.message}
        )


# ==========================================================================
# Export Log Endpoints
# ==========================================================================

@router.get(
    "/exports",
    response_model=X3ExportLogListResponse,
    summary="List export logs",
    description="Get paginated list of export history."
)
async def list_export_logs(
    export_type: Optional[str] = Query(None, description="Filter by export type (INVOICES, PAYMENTS)"),
    status: Optional[str] = Query(None, description="Filter by status (COMPLETED, FAILED, PARTIAL)"),
    date_from: Optional[date] = Query(None, description="Filter by created date from"),
    date_to: Optional[date] = Query(None, description="Filter by created date to"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of export logs."""
    service = get_x3_export_service(db)

    result = await service.list_export_logs(
        export_type=export_type,
        status=status,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size
    )

    items = [
        X3ExportLogResponse(
            id=log.x3el_id,
            export_type=log.x3el_export_type,
            status=log.x3el_status,
            date_from=log.x3el_date_from.isoformat() if log.x3el_date_from else "",
            date_to=log.x3el_date_to.isoformat() if log.x3el_date_to else "",
            total_records=log.x3el_total_records,
            exported_records=log.x3el_exported_records,
            failed_records=log.x3el_failed_records,
            file_name=log.x3el_file_name,
            file_path=log.x3el_file_path,
            file_size=log.x3el_file_size,
            error_message=log.x3el_error_message,
            started_at=log.x3el_started_at.isoformat() if log.x3el_started_at else None,
            completed_at=log.x3el_completed_at.isoformat() if log.x3el_completed_at else None,
            created_at=log.x3el_created_at.isoformat() if log.x3el_created_at else ""
        )
        for log in result["items"]
    ]

    return X3ExportLogListResponse(
        success=True,
        items=items,
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )


@router.get(
    "/exports/{export_id}",
    response_model=X3ExportLogResponse,
    responses={
        200: {"description": "Export log found"},
        404: {"model": X3ErrorResponse, "description": "Export not found"}
    },
    summary="Get export log by ID"
)
async def get_export_log(
    export_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get export log details by ID."""
    service = get_x3_export_service(db)

    try:
        log = await service.get_export_log(export_id)

        return X3ExportLogResponse(
            id=log.x3el_id,
            export_type=log.x3el_export_type,
            status=log.x3el_status,
            date_from=log.x3el_date_from.isoformat() if log.x3el_date_from else "",
            date_to=log.x3el_date_to.isoformat() if log.x3el_date_to else "",
            total_records=log.x3el_total_records,
            exported_records=log.x3el_exported_records,
            failed_records=log.x3el_failed_records,
            file_name=log.x3el_file_name,
            file_path=log.x3el_file_path,
            file_size=log.x3el_file_size,
            error_message=log.x3el_error_message,
            started_at=log.x3el_started_at.isoformat() if log.x3el_started_at else None,
            completed_at=log.x3el_completed_at.isoformat() if log.x3el_completed_at else None,
            created_at=log.x3el_created_at.isoformat() if log.x3el_created_at else ""
        )

    except X3ExportError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": e.code, "message": e.message}
        )


# ==========================================================================
# Mapping Endpoints
# ==========================================================================

@router.post(
    "/mappings/customers",
    response_model=X3MappingResponse,
    responses={
        200: {"description": "Mapping created successfully"},
        400: {"model": X3ErrorResponse, "description": "Invalid request"},
        409: {"model": X3ErrorResponse, "description": "Mapping already exists"}
    },
    summary="Create customer mapping",
    description="Create a mapping between an ERP client and an X3 customer code."
)
async def create_customer_mapping(
    request: X3CustomerMapCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a customer mapping."""
    service = get_x3_export_service(db)

    try:
        mapping = await service.create_customer_mapping(
            client_id=request.client_id,
            x3_customer_code=request.x3_customer_code,
            sales_site=request.sales_site,
            user_id=None  # TODO: Get from current user
        )

        return X3MappingResponse(
            success=True,
            message="Customer mapping created successfully",
            id=mapping.x3cm_id
        )

    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": "DUPLICATE_MAPPING",
                    "message": "A mapping already exists for this client or X3 customer code"
                }
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": "MAPPING_ERROR", "message": str(e)}
        )


@router.post(
    "/mappings/products",
    response_model=X3MappingResponse,
    responses={
        200: {"description": "Mapping created successfully"},
        400: {"model": X3ErrorResponse, "description": "Invalid request"},
        409: {"model": X3ErrorResponse, "description": "Mapping already exists"}
    },
    summary="Create product mapping",
    description="Create a mapping between an ERP product and an X3 product code."
)
async def create_product_mapping(
    request: X3ProductMapCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a product mapping."""
    service = get_x3_export_service(db)

    try:
        mapping = await service.create_product_mapping(
            product_id=request.product_id,
            x3_product_code=request.x3_product_code,
            tax_code=request.tax_code,
            user_id=None  # TODO: Get from current user
        )

        return X3MappingResponse(
            success=True,
            message="Product mapping created successfully",
            id=mapping.x3pm_id
        )

    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": "DUPLICATE_MAPPING",
                    "message": "A mapping already exists for this product or X3 product code"
                }
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": "MAPPING_ERROR", "message": str(e)}
        )


@router.get(
    "/mappings/stats",
    response_model=X3MappingStatsResponse,
    summary="Get mapping statistics",
    description="Get statistics about X3 customer and product mappings."
)
async def get_mapping_stats(
    db: AsyncSession = Depends(get_db)
):
    """Get mapping statistics."""
    service = get_x3_export_service(db)

    stats = await service.get_mapping_stats()

    return X3MappingStatsResponse(
        success=True,
        **stats
    )
