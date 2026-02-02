"""
X3 Export API Router.

Provides REST API endpoints for:
- Exporting invoices to Sage X3 (including ZIP with CSV format)
- Exporting customers to Sage X3
- Export job management
- Export preview and validation
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
import os

from app.database import get_db
from app.services.x3_export_service import (
    X3ExportService,
    get_x3_export_service,
    X3ExportError,
    X3ConnectionError,
    X3AuthenticationError,
    X3ValidationError,
    X3ExportNotFoundError,
    X3RateLimitError,
    X3ConfigurationError
)
from app.schemas.x3_export import (
    X3ExportRequest,
    X3ExportJobResponse,
    X3ExportItemResult,
    X3ExportStatus,
    X3ExportType,
    X3InvoiceExport,
    X3CustomerExport,
    X3ExportErrorResponse,
    X3ExportErrorDetail
)


# ==========================================================================
# Request/Response Schemas for ZIP Export
# ==========================================================================

class X3InvoiceZipExportRequest(BaseModel):
    """Request schema for exporting invoices to X3 as ZIP with CSV."""
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


class X3InvoiceZipExportResponse(BaseModel):
    """Response schema for invoice ZIP export."""
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

router = APIRouter(prefix="/x3-export", tags=["X3 Export"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_x3_error(error: X3ExportError) -> HTTPException:
    """Convert X3ExportError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, X3ExportNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, X3AuthenticationError):
        status_code = status.HTTP_401_UNAUTHORIZED
    elif isinstance(error, X3ValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, X3ConnectionError):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    elif isinstance(error, X3RateLimitError):
        status_code = status.HTTP_429_TOO_MANY_REQUESTS
    elif isinstance(error, X3ConfigurationError):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        }
    )


# ==========================================================================
# Export Endpoints
# ==========================================================================

@router.post(
    "/invoices",
    response_model=X3ExportJobResponse,
    summary="Export invoices to X3",
    description="""
    Export one or more invoices to Sage X3.

    Use filters to specify which invoices to export:
    - date_from/date_to: Date range filter
    - entity_ids: Specific invoice IDs
    - client_id: Filter by client
    - status_ids: Filter by invoice status
    - society_id/bu_id: Filter by organization

    Options:
    - dry_run: Validate without actually exporting
    - batch_size: Override default batch size
    - output_format: json, csv, or xml
    """
)
async def export_invoices(
    request: X3ExportRequest,
    db: AsyncSession = Depends(get_db)
):
    """Export invoices to Sage X3."""
    # Override export type for this endpoint
    request.export_type = X3ExportType.INVOICE

    service = get_x3_export_service(db)
    try:
        result = await service.export(request)
        return result
    except X3ExportError as e:
        raise handle_x3_error(e)
    finally:
        await service.close()


@router.post(
    "/customers",
    response_model=X3ExportJobResponse,
    summary="Export customers to X3",
    description="""
    Export one or more customers to Sage X3.

    Use filters to specify which customers to export:
    - entity_ids: Specific client IDs
    - society_id/bu_id: Filter by organization

    Options:
    - dry_run: Validate without actually exporting
    - batch_size: Override default batch size
    - output_format: json, csv, or xml
    """
)
async def export_customers(
    request: X3ExportRequest,
    db: AsyncSession = Depends(get_db)
):
    """Export customers to Sage X3."""
    # Override export type for this endpoint
    request.export_type = X3ExportType.CUSTOMER

    service = get_x3_export_service(db)
    try:
        result = await service.export(request)
        return result
    except X3ExportError as e:
        raise handle_x3_error(e)
    finally:
        await service.close()


@router.post(
    "",
    response_model=X3ExportJobResponse,
    summary="Generic export to X3",
    description="""
    Generic export endpoint - specify export_type in request body.

    Supported export types:
    - INVOICE: Export invoices
    - CUSTOMER: Export customers
    - PAYMENT: Export payments (coming soon)
    """
)
async def export_to_x3(
    request: X3ExportRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generic export to Sage X3."""
    service = get_x3_export_service(db)
    try:
        result = await service.export(request)
        return result
    except X3ExportError as e:
        raise handle_x3_error(e)
    finally:
        await service.close()


# ==========================================================================
# Single Entity Export
# ==========================================================================

@router.post(
    "/invoices/{invoice_id}",
    response_model=X3ExportItemResult,
    summary="Export single invoice to X3",
    description="Export a specific invoice to Sage X3 by ID."
)
async def export_single_invoice(
    invoice_id: int = Path(..., description="Invoice ID to export", gt=0),
    dry_run: bool = Query(False, description="Validate without exporting"),
    db: AsyncSession = Depends(get_db)
):
    """Export a single invoice to Sage X3."""
    service = get_x3_export_service(db)
    try:
        result = await service.export_invoice(invoice_id, dry_run=dry_run)
        return result
    except X3ExportError as e:
        raise handle_x3_error(e)
    finally:
        await service.close()


@router.post(
    "/customers/{client_id}",
    response_model=X3ExportItemResult,
    summary="Export single customer to X3",
    description="Export a specific customer to Sage X3 by ID."
)
async def export_single_customer(
    client_id: int = Path(..., description="Client ID to export", gt=0),
    dry_run: bool = Query(False, description="Validate without exporting"),
    db: AsyncSession = Depends(get_db)
):
    """Export a single customer to Sage X3."""
    service = get_x3_export_service(db)
    try:
        result = await service.export_customer(client_id, dry_run=dry_run)
        return result
    except X3ExportError as e:
        raise handle_x3_error(e)
    finally:
        await service.close()


# ==========================================================================
# Preview and Validation
# ==========================================================================

@router.get(
    "/preview/invoice/{invoice_id}",
    response_model=Dict[str, Any],
    summary="Preview invoice X3 export data",
    description="""
    Get a preview of how an invoice will be transformed for X3 export.
    Does not actually export the data.
    """
)
async def preview_invoice_export(
    invoice_id: int = Path(..., description="Invoice ID to preview", gt=0),
    db: AsyncSession = Depends(get_db)
):
    """Preview invoice export data."""
    service = get_x3_export_service(db)
    try:
        result = await service.get_export_preview(X3ExportType.INVOICE, invoice_id)
        return {"success": True, "data": result}
    except X3ExportError as e:
        raise handle_x3_error(e)
    finally:
        await service.close()


@router.get(
    "/preview/customer/{client_id}",
    response_model=Dict[str, Any],
    summary="Preview customer X3 export data",
    description="""
    Get a preview of how a customer will be transformed for X3 export.
    Does not actually export the data.
    """
)
async def preview_customer_export(
    client_id: int = Path(..., description="Client ID to preview", gt=0),
    db: AsyncSession = Depends(get_db)
):
    """Preview customer export data."""
    service = get_x3_export_service(db)
    try:
        result = await service.get_export_preview(X3ExportType.CUSTOMER, client_id)
        return {"success": True, "data": result}
    except X3ExportError as e:
        raise handle_x3_error(e)
    finally:
        await service.close()


@router.post(
    "/validate",
    response_model=Dict[str, Any],
    summary="Validate entities for X3 export",
    description="""
    Validate that one or more entities can be exported to X3.
    Returns validation results without actually exporting.

    Useful for pre-checking before bulk exports.
    """
)
async def validate_export(
    export_type: X3ExportType = Query(..., description="Type of data to validate"),
    entity_ids: List[int] = Query(..., description="Entity IDs to validate"),
    db: AsyncSession = Depends(get_db)
):
    """Validate entities for X3 export."""
    service = get_x3_export_service(db)
    try:
        results = await service.validate_export_data(export_type, entity_ids)

        # Summary
        total = len(results)
        valid = sum(1 for r in results if r.status == "VALIDATED")
        invalid = total - valid

        return {
            "success": True,
            "summary": {
                "total": total,
                "valid": valid,
                "invalid": invalid
            },
            "results": [r.model_dump() for r in results]
        }
    except X3ExportError as e:
        raise handle_x3_error(e)
    finally:
        await service.close()


# ==========================================================================
# Configuration and Status
# ==========================================================================

@router.get(
    "/status",
    response_model=Dict[str, Any],
    summary="Get X3 integration status",
    description="Check the configuration and connectivity status of X3 integration."
)
async def get_x3_status():
    """Get X3 integration status."""
    from app.config import get_settings
    settings = get_settings()

    configured = bool(settings.X3_API_BASE_URL and settings.X3_API_KEY)

    return {
        "success": True,
        "status": {
            "configured": configured,
            "api_base_url": settings.X3_API_BASE_URL[:50] + "..." if settings.X3_API_BASE_URL and len(settings.X3_API_BASE_URL) > 50 else settings.X3_API_BASE_URL,
            "company_code": settings.X3_COMPANY_CODE,
            "endpoint_name": settings.X3_ENDPOINT_NAME,
            "language": settings.X3_LANGUAGE,
            "batch_size": settings.X3_BATCH_SIZE,
            "timeout_seconds": settings.X3_TIMEOUT_SECONDS
        }
    }


@router.get(
    "/supported-types",
    response_model=Dict[str, Any],
    summary="Get supported export types",
    description="List all supported export types and their status."
)
async def get_supported_types():
    """Get list of supported export types."""
    return {
        "success": True,
        "export_types": [
            {
                "type": X3ExportType.INVOICE.value,
                "name": "Invoice Export",
                "description": "Export sales invoices to X3 (SIH document)",
                "status": "available"
            },
            {
                "type": X3ExportType.CUSTOMER.value,
                "name": "Customer Export",
                "description": "Export customers to X3 (BPC entity)",
                "status": "available"
            },
            {
                "type": X3ExportType.PAYMENT.value,
                "name": "Payment Export",
                "description": "Export payments to X3",
                "status": "coming_soon"
            },
            {
                "type": X3ExportType.CREDIT_NOTE.value,
                "name": "Credit Note Export",
                "description": "Export credit notes to X3 (SCN document)",
                "status": "coming_soon"
            },
            {
                "type": X3ExportType.PRODUCT.value,
                "name": "Product Export",
                "description": "Export products to X3",
                "status": "coming_soon"
            }
        ]
    }


# ==========================================================================
# ZIP with CSV Export (export_invoices_to_x3)
# ==========================================================================

@router.post(
    "/invoices/zip-export",
    response_model=X3InvoiceZipExportResponse,
    summary="Export invoices to X3 format (ZIP with CSV)",
    description="""
    Export invoices within a date range to Sage X3 format.

    **This endpoint implements the `export_invoices_to_x3()` function.**

    Generates a ZIP file containing:
    - **X3_SIH_H.csv**: Invoice headers with fields: SALFCY, BPCORD, NUM, INVDAT, INVTYP, CUR, AMTATI, AMTNOTAX
    - **X3_SIH_L.csv**: Invoice lines with fields: SALFCY, NUM, ITMREF, QTY, GROPRI, DISCRGVAL1, TAXCOD
    - **export_manifest.txt**: Export metadata and import instructions

    **The export process:**
    1. Fetches invoices matching the date range and optional filters
    2. Looks up X3 customer mappings (BPCORD) and product mappings (ITMREF)
    3. Generates CSV files in X3 import format (semicolon-delimited)
    4. Creates a downloadable ZIP file

    **Important:**
    - Invoices without customer mappings are skipped (with warnings)
    - Products without mappings use the line description as ITMREF
    - Use the validation endpoint first to check for missing mappings
    """
)
async def export_invoices_to_x3_zip(
    request: X3InvoiceZipExportRequest,
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

        return X3InvoiceZipExportResponse(
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
        raise handle_x3_error(e)


@router.post(
    "/invoices/validate-for-zip",
    response_model=X3ValidationResponse,
    summary="Validate invoices before ZIP export",
    description="""
    Check if invoices can be exported by verifying all required X3 mappings exist.

    Returns:
    - Count of valid/invalid invoices
    - List of missing customer mappings (clients without BPCORD)
    - List of missing product mappings (products without ITMREF)
    """
)
async def validate_invoices_for_zip_export(
    date_from: date = Query(..., description="Start date of invoice date range"),
    date_to: date = Query(..., description="End date of invoice date range"),
    society_id: Optional[int] = Query(None, description="Filter by society/company ID"),
    bu_id: Optional[int] = Query(None, description="Filter by business unit ID"),
    db: AsyncSession = Depends(get_db)
):
    """Validate invoices before ZIP export."""
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
    "/invoices/zip-export/{export_id}/download",
    summary="Download ZIP export file",
    description="Download the ZIP file for a completed invoice export."
)
async def download_zip_export_file(
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
                detail={"success": False, "error": "FILE_NOT_FOUND", "message": "Export file no longer exists on server"}
            )

        return FileResponse(
            path=export_log.x3el_file_path,
            filename=export_log.x3el_file_name,
            media_type="application/zip"
        )

    except X3ExportError as e:
        raise handle_x3_error(e)


# ==========================================================================
# Export Logs for ZIP Export
# ==========================================================================

@router.get(
    "/exports/logs",
    response_model=X3ExportLogListResponse,
    summary="List export logs",
    description="Get paginated list of export history."
)
async def list_export_logs(
    export_type: Optional[str] = Query(None, description="Filter by export type (INVOICES, PAYMENTS)"),
    export_status: Optional[str] = Query(None, alias="status", description="Filter by status (COMPLETED, FAILED, PARTIAL)"),
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
        status=export_status,
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
    "/exports/logs/{export_id}",
    response_model=X3ExportLogResponse,
    summary="Get export log by ID"
)
async def get_export_log_by_id(
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
        raise handle_x3_error(e)


# ==========================================================================
# Mapping Management Endpoints
# ==========================================================================

@router.post(
    "/mappings/customers",
    response_model=X3MappingResponse,
    summary="Create customer mapping",
    description="Create a mapping between an ERP client and an X3 customer code (BPCORD)."
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
    summary="Create product mapping",
    description="Create a mapping between an ERP product and an X3 product code (ITMREF)."
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
async def get_mapping_statistics(
    db: AsyncSession = Depends(get_db)
):
    """Get mapping statistics."""
    service = get_x3_export_service(db)

    stats = await service.get_mapping_stats()

    return X3MappingStatsResponse(
        success=True,
        **stats
    )
