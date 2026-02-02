"""
X3 Export Service.

Provides business logic for exporting ERP data to Sage X3:
- Invoice export (SIH - Sales Invoice Header) as ZIP with CSV files
- Customer export (BPC - Business Partner Customer)
- Payment export
- Batch processing and error handling
- Export history tracking
"""
import asyncio
import csv
import io
import json
import uuid
import os
import zipfile
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple, BinaryIO
from sqlalchemy import select, func, and_, or_, desc, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import httpx
import logging

from app.models.invoice import ClientInvoice, ClientInvoiceLine
from app.models.client import Client
from app.models.payment import Payment
from app.models.integrations.sage_x3 import (
    X3CustomerMap,
    X3ProductMap,
    X3ExportLog,
    X3ExportStatus as X3ExportStatusModel,
    X3ExportType as X3ExportTypeModel
)
from app.schemas.x3_export import (
    X3ExportRequest, X3ExportJobResponse, X3ExportItemResult,
    X3ExportStatus, X3ExportType, X3DocumentType,
    X3InvoiceExport, X3InvoiceLineExport,
    X3CustomerExport, X3PaymentExport,
    X3MappingConfig, X3VatMapping, X3CurrencyMapping, X3PaymentTermMapping
)
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class X3ExportError(Exception):
    """Base exception for X3 export errors."""
    def __init__(
        self,
        message: str,
        code: str = "X3_EXPORT_ERROR",
        details: Optional[Dict] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary."""
        return {
            "error": self.code,
            "message": self.message,
            "details": self.details,
        }


class X3ConnectionError(X3ExportError):
    """Error connecting to X3 API."""
    def __init__(
        self,
        message: str = "Failed to connect to Sage X3 API",
        details: Optional[Dict] = None
    ):
        super().__init__(message, code="X3_CONNECTION_ERROR", details=details)


class X3AuthenticationError(X3ExportError):
    """X3 API authentication failed."""
    def __init__(
        self,
        message: str = "X3 API authentication failed",
        details: Optional[Dict] = None
    ):
        super().__init__(message, code="X3_AUTH_ERROR", details=details)


class X3ValidationError(X3ExportError):
    """Export data validation failed."""
    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        details: Optional[Dict] = None
    ):
        details = details or {}
        if field:
            details["field"] = field
        super().__init__(message, code="X3_VALIDATION_ERROR", details=details)


class X3ExportNotFoundError(X3ExportError):
    """Export job or entity not found."""
    def __init__(self, entity_type: str, entity_id: Any):
        super().__init__(
            f"{entity_type} with ID {entity_id} not found",
            code="X3_NOT_FOUND",
            details={"entity_type": entity_type, "entity_id": entity_id}
        )


class X3RateLimitError(X3ExportError):
    """X3 API rate limit exceeded."""
    def __init__(self, retry_after: Optional[int] = None):
        details = {"retry_after_seconds": retry_after} if retry_after else {}
        super().__init__(
            "X3 API rate limit exceeded",
            code="X3_RATE_LIMIT",
            details=details
        )


class X3ConfigurationError(X3ExportError):
    """X3 integration not properly configured."""
    def __init__(self, message: str, missing_config: Optional[List[str]] = None):
        details = {"missing_config": missing_config} if missing_config else {}
        super().__init__(message, code="X3_CONFIG_ERROR", details=details)


# ==========================================================================
# X3 Export Service
# ==========================================================================

class X3ExportService:
    """Service for exporting ERP data to Sage X3."""

    # Default mapping configuration
    DEFAULT_VAT_MAPPINGS = {
        1: "NOR",   # Normal VAT
        2: "RED",   # Reduced VAT
        3: "EXO",   # Exempt
    }

    DEFAULT_CURRENCY_MAPPINGS = {
        1: "EUR",
        2: "USD",
        3: "GBP",
    }

    DEFAULT_PAYMENT_TERM_MAPPINGS = {
        1: "30NET",
        2: "60NET",
        3: "CASH",
    }

    # CSV Field Specifications for X3 Import Format
    INVOICE_HEADER_FIELDS = [
        "SALFCY",      # Sales site
        "BPCORD",      # Customer code
        "NUM",         # Invoice number
        "INVDAT",      # Invoice date (YYYYMMDD)
        "INVTYP",      # Invoice type (SIN=Sales Invoice)
        "CUR",         # Currency
        "AMTATI",      # Amount including tax
        "AMTNOTAX",    # Amount excluding tax
    ]

    INVOICE_LINE_FIELDS = [
        "SALFCY",      # Sales site
        "NUM",         # Invoice number
        "ITMREF",      # Product code
        "QTY",         # Quantity
        "GROPRI",      # Gross unit price
        "DISCRGVAL1",  # Discount percentage
        "TAXCOD",      # Tax code
    ]

    DEFAULT_SALES_SITE = "FCY1"
    DEFAULT_INVOICE_TYPE = "SIN"
    DEFAULT_TAX_CODE = "VAT"

    def __init__(self, db: AsyncSession):
        self.db = db
        self._http_client: Optional[httpx.AsyncClient] = None
        self._mapping_config: Optional[X3MappingConfig] = None

    # ==========================================================================
    # export_invoices_to_x3() - ZIP with CSV Export
    # ==========================================================================

    async def export_invoices_to_x3(
        self,
        date_from: date,
        date_to: date,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None,
        status_ids: Optional[List[int]] = None,
        include_lines: bool = True,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Export invoices to Sage X3 format as a ZIP file containing CSV files.

        Creates a ZIP file with:
        - X3_SIH_H.csv: Invoice headers
        - X3_SIH_L.csv: Invoice lines (if include_lines=True)
        - export_manifest.txt: Export metadata and summary

        Args:
            date_from: Start date of invoice date range
            date_to: End date of invoice date range
            society_id: Optional filter by society/company ID
            bu_id: Optional filter by business unit ID
            status_ids: Optional filter by invoice status IDs
            include_lines: Whether to include invoice lines (default True)
            user_id: ID of user performing the export

        Returns:
            Dict containing:
            - export_id: ID of the export log record
            - status: Export status
            - file_path: Path to the generated ZIP file
            - file_name: Name of the ZIP file
            - total_invoices: Total invoices processed
            - exported_invoices: Successfully exported invoices
            - failed_invoices: Failed invoices
            - skipped_invoices: Invoices skipped due to missing mappings
            - warnings: List of warning messages
            - errors: List of error messages

        Raises:
            X3ExportError: If export fails completely
        """
        export_start = datetime.now()
        warnings: List[str] = []
        errors: List[str] = []
        skipped_invoices: List[Dict] = []

        # Create export log entry
        export_log = X3ExportLog(
            x3el_export_type=X3ExportTypeModel.INVOICES.value,
            x3el_status=X3ExportStatusModel.PROCESSING.value,
            x3el_date_from=datetime.combine(date_from, datetime.min.time()),
            x3el_date_to=datetime.combine(date_to, datetime.max.time()),
            x3el_started_at=export_start,
            x3el_created_by=user_id
        )
        self.db.add(export_log)
        await self.db.flush()

        try:
            # Fetch invoices with lines
            invoices = await self._fetch_invoices_for_csv_export(
                date_from=date_from,
                date_to=date_to,
                society_id=society_id,
                bu_id=bu_id,
                status_ids=status_ids,
                include_lines=include_lines
            )

            if not invoices:
                export_log.x3el_status = X3ExportStatusModel.COMPLETED.value
                export_log.x3el_completed_at = datetime.now()
                export_log.x3el_total_records = 0
                export_log.x3el_exported_records = 0
                await self.db.flush()

                return {
                    "export_id": export_log.x3el_id,
                    "status": X3ExportStatusModel.COMPLETED.value,
                    "file_path": None,
                    "file_name": None,
                    "total_invoices": 0,
                    "total_lines": 0,
                    "exported_invoices": 0,
                    "failed_invoices": 0,
                    "skipped_invoices": 0,
                    "warnings": ["No invoices found for the specified date range"],
                    "errors": []
                }

            # Load customer and product mappings
            customer_mappings = await self._load_customer_mappings()
            product_mappings = await self._load_product_mappings()

            # Process invoices
            header_rows: List[List[str]] = []
            line_rows: List[List[str]] = []
            exported_count = 0
            failed_count = 0
            total_lines = 0

            for invoice in invoices:
                try:
                    # Get customer mapping
                    customer_map = customer_mappings.get(invoice.inv_cli_id)
                    if not customer_map:
                        skipped_invoices.append({
                            "invoice_id": invoice.inv_id,
                            "invoice_reference": invoice.inv_reference,
                            "reason": f"No X3 customer mapping for client ID {invoice.inv_cli_id}"
                        })
                        warnings.append(
                            f"Skipped invoice {invoice.inv_reference}: "
                            f"No X3 mapping for client ID {invoice.inv_cli_id}"
                        )
                        continue

                    # Build header row
                    header_row = self._build_invoice_header_row(invoice, customer_map)
                    header_rows.append(header_row)

                    # Build line rows
                    if include_lines and invoice.lines:
                        for line in invoice.lines:
                            product_code = None
                            if line.inl_prd_id:
                                product_map = product_mappings.get(line.inl_prd_id)
                                if product_map:
                                    product_code = product_map["x3_product_code"]
                                else:
                                    warnings.append(
                                        f"Invoice {invoice.inv_reference} line {line.inl_line_number}: "
                                        f"No X3 mapping for product ID {line.inl_prd_id}, using description"
                                    )

                            line_row = self._build_invoice_line_row(
                                invoice, line, customer_map, product_code
                            )
                            line_rows.append(line_row)
                            total_lines += 1

                    exported_count += 1

                except Exception as e:
                    failed_count += 1
                    errors.append(f"Failed to export invoice {invoice.inv_reference}: {str(e)}")

            # Generate ZIP file
            if exported_count > 0:
                zip_buffer, file_name = self._generate_export_zip(
                    header_rows=header_rows,
                    line_rows=line_rows if include_lines else [],
                    date_from=date_from,
                    date_to=date_to,
                    export_id=export_log.x3el_id
                )

                # Save ZIP file
                file_path = self._save_export_file(zip_buffer, file_name)
                file_size = len(zip_buffer.getvalue())

                # Update export log
                export_log.x3el_file_name = file_name
                export_log.x3el_file_path = file_path
                export_log.x3el_file_size = file_size
                export_log.x3el_status = (
                    X3ExportStatusModel.COMPLETED.value if failed_count == 0
                    else X3ExportStatusModel.PARTIAL.value
                )
            else:
                file_name = None
                file_path = None
                export_log.x3el_status = X3ExportStatusModel.FAILED.value
                export_log.x3el_error_message = "No invoices could be exported due to missing mappings"

            export_log.x3el_total_records = len(invoices)
            export_log.x3el_exported_records = exported_count
            export_log.x3el_failed_records = failed_count
            export_log.x3el_completed_at = datetime.now()

            if errors:
                export_log.x3el_error_details = "\n".join(errors[:100])  # Limit error details

            await self.db.flush()

            return {
                "export_id": export_log.x3el_id,
                "status": export_log.x3el_status,
                "file_path": file_path,
                "file_name": file_name,
                "total_invoices": len(invoices),
                "total_lines": total_lines,
                "exported_invoices": exported_count,
                "failed_invoices": failed_count,
                "skipped_invoices": len(skipped_invoices),
                "skipped_details": skipped_invoices,
                "warnings": warnings,
                "errors": errors
            }

        except Exception as e:
            export_log.x3el_status = X3ExportStatusModel.FAILED.value
            export_log.x3el_error_message = str(e)
            export_log.x3el_completed_at = datetime.now()
            await self.db.flush()
            raise X3ExportError(f"Invoice export failed: {str(e)}")

    async def _fetch_invoices_for_csv_export(
        self,
        date_from: date,
        date_to: date,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None,
        status_ids: Optional[List[int]] = None,
        include_lines: bool = True
    ) -> List[ClientInvoice]:
        """Fetch invoices matching the export criteria for CSV export."""
        conditions = [
            ClientInvoice.inv_date >= datetime.combine(date_from, datetime.min.time()),
            ClientInvoice.inv_date <= datetime.combine(date_to, datetime.max.time()),
        ]

        if society_id:
            conditions.append(ClientInvoice.inv_soc_id == society_id)
        if bu_id:
            conditions.append(ClientInvoice.inv_bu_id == bu_id)
        if status_ids:
            conditions.append(ClientInvoice.inv_sta_id.in_(status_ids))

        stmt = select(ClientInvoice).where(and_(*conditions))

        if include_lines:
            stmt = stmt.options(selectinload(ClientInvoice.lines))

        stmt = stmt.order_by(ClientInvoice.inv_date, ClientInvoice.inv_reference)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def _load_customer_mappings(self) -> Dict[int, Dict[str, Any]]:
        """Load all active customer mappings for CSV export."""
        stmt = select(X3CustomerMap).where(X3CustomerMap.x3cm_is_active == True)
        result = await self.db.execute(stmt)
        mappings = result.scalars().all()

        return {
            m.x3cm_cli_id: {
                "x3_customer_code": m.x3cm_x3_customer_code,
                "sales_site": m.x3cm_sales_site or self.DEFAULT_SALES_SITE
            }
            for m in mappings
        }

    async def _load_product_mappings(self) -> Dict[int, Dict[str, Any]]:
        """Load all active product mappings for CSV export."""
        stmt = select(X3ProductMap).where(X3ProductMap.x3pm_is_active == True)
        result = await self.db.execute(stmt)
        mappings = result.scalars().all()

        return {
            m.x3pm_prd_id: {
                "x3_product_code": m.x3pm_x3_product_code,
                "tax_code": m.x3pm_tax_code or self.DEFAULT_TAX_CODE
            }
            for m in mappings
        }

    def _build_invoice_header_row(
        self,
        invoice: ClientInvoice,
        customer_map: Dict[str, Any]
    ) -> List[str]:
        """Build a CSV row for the invoice header."""
        return [
            customer_map["sales_site"],                              # SALFCY
            customer_map["x3_customer_code"],                        # BPCORD
            invoice.inv_reference,                                    # NUM
            invoice.inv_date.strftime("%Y%m%d"),                     # INVDAT
            self.DEFAULT_INVOICE_TYPE,                               # INVTYP
            self._map_currency_code(invoice.inv_cur_id),             # CUR
            self._format_decimal(invoice.inv_total_amount),          # AMTATI
            self._format_decimal(invoice.inv_sub_total),             # AMTNOTAX
        ]

    def _build_invoice_line_row(
        self,
        invoice: ClientInvoice,
        line: ClientInvoiceLine,
        customer_map: Dict[str, Any],
        product_code: Optional[str]
    ) -> List[str]:
        """Build a CSV row for an invoice line."""
        return [
            customer_map["sales_site"],                              # SALFCY
            invoice.inv_reference,                                    # NUM
            product_code or line.inl_description[:20],               # ITMREF
            self._format_decimal(line.inl_quantity),                 # QTY
            self._format_decimal(line.inl_unit_price),               # GROPRI
            self._format_decimal(line.inl_discount),                 # DISCRGVAL1
            self.DEFAULT_TAX_CODE,                                   # TAXCOD
        ]

    def _format_decimal(self, value: Optional[Decimal]) -> str:
        """Format decimal value for CSV export."""
        if value is None:
            return "0.00"
        return f"{float(value):.2f}"

    def _generate_export_zip(
        self,
        header_rows: List[List[str]],
        line_rows: List[List[str]],
        date_from: date,
        date_to: date,
        export_id: int
    ) -> Tuple[io.BytesIO, str]:
        """Generate a ZIP file containing the export CSV files."""
        zip_buffer = io.BytesIO()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"X3_INVOICES_{date_from.strftime('%Y%m%d')}_{date_to.strftime('%Y%m%d')}_{timestamp}.zip"

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Write invoice headers CSV
            header_csv = self._generate_csv_content(self.INVOICE_HEADER_FIELDS, header_rows)
            zf.writestr("X3_SIH_H.csv", header_csv)

            # Write invoice lines CSV
            if line_rows:
                line_csv = self._generate_csv_content(self.INVOICE_LINE_FIELDS, line_rows)
                zf.writestr("X3_SIH_L.csv", line_csv)

            # Write manifest
            manifest = self._generate_export_manifest(
                export_id=export_id,
                date_from=date_from,
                date_to=date_to,
                header_count=len(header_rows),
                line_count=len(line_rows)
            )
            zf.writestr("export_manifest.txt", manifest)

        zip_buffer.seek(0)
        return zip_buffer, file_name

    def _generate_csv_content(
        self,
        fields: List[str],
        rows: List[List[str]]
    ) -> str:
        """Generate CSV content from fields and rows."""
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

        # Write header row
        writer.writerow(fields)

        # Write data rows
        for row in rows:
            writer.writerow(row)

        return output.getvalue()

    def _generate_export_manifest(
        self,
        export_id: int,
        date_from: date,
        date_to: date,
        header_count: int,
        line_count: int
    ) -> str:
        """Generate a manifest file for the export."""
        manifest_lines = [
            "=" * 60,
            "SAGE X3 INVOICE EXPORT MANIFEST",
            "=" * 60,
            "",
            f"Export ID: {export_id}",
            f"Generated: {datetime.now().isoformat()}",
            f"Date Range: {date_from} to {date_to}",
            "",
            "Files Included:",
            f"  - X3_SIH_H.csv: {header_count} invoice header(s)",
            f"  - X3_SIH_L.csv: {line_count} invoice line(s)",
            "",
            "CSV Format:",
            "  - Delimiter: semicolon (;)",
            "  - Encoding: UTF-8",
            "  - Date format: YYYYMMDD",
            "",
            "Import Instructions:",
            "  1. Extract ZIP to X3 import folder",
            "  2. Run X3 import template ZSIH",
            "  3. Select X3_SIH_H.csv for headers",
            "  4. Select X3_SIH_L.csv for lines",
            "",
            "=" * 60,
        ]
        return "\n".join(manifest_lines)

    def _save_export_file(
        self,
        zip_buffer: io.BytesIO,
        file_name: str
    ) -> str:
        """Save the export ZIP file to the export directory."""
        export_dir = settings.X3_EXPORT_DIRECTORY

        # Ensure export directory exists
        os.makedirs(export_dir, exist_ok=True)

        file_path = os.path.join(export_dir, file_name)

        with open(file_path, 'wb') as f:
            f.write(zip_buffer.getvalue())

        return file_path

    async def validate_invoices_for_export(
        self,
        date_from: date,
        date_to: date,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Validate invoices before export, checking for missing mappings.

        Returns:
            Dict with validation results including:
            - is_valid: Whether export can proceed
            - invoice_count: Total invoices found
            - valid_invoices: Invoices with all required mappings
            - missing_customer_mappings: Customers without X3 mapping
            - missing_product_mappings: Products without X3 mapping
        """
        invoices = await self._fetch_invoices_for_csv_export(
            date_from=date_from,
            date_to=date_to,
            society_id=society_id,
            bu_id=bu_id,
            include_lines=True
        )

        customer_mappings = await self._load_customer_mappings()
        product_mappings = await self._load_product_mappings()

        missing_customers: Dict[int, Dict] = {}
        missing_products: Dict[int, Dict] = {}
        valid_count = 0

        for invoice in invoices:
            has_customer_mapping = invoice.inv_cli_id in customer_mappings

            if not has_customer_mapping:
                if invoice.inv_cli_id not in missing_customers:
                    missing_customers[invoice.inv_cli_id] = {
                        "client_id": invoice.inv_cli_id,
                        "invoice_count": 0
                    }
                missing_customers[invoice.inv_cli_id]["invoice_count"] += 1
            else:
                valid_count += 1

            # Check product mappings for lines
            for line in invoice.lines:
                if line.inl_prd_id and line.inl_prd_id not in product_mappings:
                    if line.inl_prd_id not in missing_products:
                        missing_products[line.inl_prd_id] = {
                            "product_id": line.inl_prd_id,
                            "line_count": 0
                        }
                    missing_products[line.inl_prd_id]["line_count"] += 1

        return {
            "is_valid": valid_count > 0,
            "invoice_count": len(invoices),
            "valid_invoices": valid_count,
            "invalid_invoices": len(invoices) - valid_count,
            "missing_customer_mappings": list(missing_customers.values()),
            "missing_product_mappings": list(missing_products.values()),
            "can_export": valid_count > 0
        }

    async def get_export_log(self, export_id: int) -> X3ExportLog:
        """Get export log by ID."""
        stmt = select(X3ExportLog).where(X3ExportLog.x3el_id == export_id)
        result = await self.db.execute(stmt)
        log = result.scalar_one_or_none()

        if not log:
            raise X3ExportNotFoundError("X3ExportLog", export_id)

        return log

    async def list_export_logs(
        self,
        export_type: Optional[str] = None,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """List export logs with filtering and pagination."""
        conditions = []

        if export_type:
            conditions.append(X3ExportLog.x3el_export_type == export_type)
        if status:
            conditions.append(X3ExportLog.x3el_status == status)
        if date_from:
            conditions.append(
                X3ExportLog.x3el_created_at >= datetime.combine(date_from, datetime.min.time())
            )
        if date_to:
            conditions.append(
                X3ExportLog.x3el_created_at <= datetime.combine(date_to, datetime.max.time())
            )

        # Count total
        count_stmt = select(func.count(X3ExportLog.x3el_id))
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0

        # Fetch page
        stmt = select(X3ExportLog)
        if conditions:
            stmt = stmt.where(and_(*conditions))
        stmt = stmt.order_by(X3ExportLog.x3el_created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(stmt)
        logs = result.scalars().all()

        return {
            "items": logs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    # ==========================================================================
    # Customer/Product Mapping Management
    # ==========================================================================

    async def create_customer_mapping(
        self,
        client_id: int,
        x3_customer_code: str,
        sales_site: str = None,
        user_id: Optional[int] = None
    ) -> X3CustomerMap:
        """Create a customer mapping."""
        mapping = X3CustomerMap(
            x3cm_cli_id=client_id,
            x3cm_x3_customer_code=x3_customer_code,
            x3cm_sales_site=sales_site or self.DEFAULT_SALES_SITE,
            x3cm_is_active=True,
            x3cm_created_by=user_id
        )
        self.db.add(mapping)
        await self.db.flush()
        return mapping

    async def create_product_mapping(
        self,
        product_id: int,
        x3_product_code: str,
        tax_code: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> X3ProductMap:
        """Create a product mapping."""
        mapping = X3ProductMap(
            x3pm_prd_id=product_id,
            x3pm_x3_product_code=x3_product_code,
            x3pm_tax_code=tax_code,
            x3pm_is_active=True,
            x3pm_created_by=user_id
        )
        self.db.add(mapping)
        await self.db.flush()
        return mapping

    async def get_mapping_stats(self) -> Dict[str, Any]:
        """Get statistics about X3 mappings."""
        customer_mapping_count = await self.db.execute(
            select(func.count(X3CustomerMap.x3cm_id)).where(X3CustomerMap.x3cm_is_active == True)
        )
        mapped_customers = customer_mapping_count.scalar() or 0

        product_mapping_count = await self.db.execute(
            select(func.count(X3ProductMap.x3pm_id)).where(X3ProductMap.x3pm_is_active == True)
        )
        mapped_products = product_mapping_count.scalar() or 0

        return {
            "mapped_customers": mapped_customers,
            "mapped_products": mapped_products,
            "total_customers": mapped_customers,
            "total_products": mapped_products,
            "customer_coverage_percent": 100.0,
            "product_coverage_percent": 100.0
        }

    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for X3 API calls."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                base_url=settings.X3_API_BASE_URL or "",
                timeout=settings.X3_TIMEOUT_SECONDS,
                headers=self._get_auth_headers()
            )
        return self._http_client

    def _get_auth_headers(self) -> Dict[str, str]:
        """Build authentication headers for X3 API."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if settings.X3_API_KEY:
            headers["X-API-Key"] = settings.X3_API_KEY
        if settings.X3_API_SECRET:
            headers["X-API-Secret"] = settings.X3_API_SECRET
        return headers

    def _validate_configuration(self) -> None:
        """Validate X3 configuration is present."""
        missing = []
        if not settings.X3_API_BASE_URL:
            missing.append("X3_API_BASE_URL")
        if not settings.X3_API_KEY:
            missing.append("X3_API_KEY")

        if missing:
            raise X3ConfigurationError(
                "X3 integration is not properly configured",
                missing_config=missing
            )

    def _get_mapping_config(self) -> X3MappingConfig:
        """Get or load mapping configuration."""
        if self._mapping_config is None:
            self._mapping_config = X3MappingConfig(
                vat_mappings=[
                    X3VatMapping(erp_vat_id=k, x3_vat_code=v, vat_rate=Decimal("20"))
                    for k, v in self.DEFAULT_VAT_MAPPINGS.items()
                ],
                currency_mappings=[
                    X3CurrencyMapping(erp_currency_id=k, x3_currency_code=v)
                    for k, v in self.DEFAULT_CURRENCY_MAPPINGS.items()
                ],
                payment_term_mappings=[
                    X3PaymentTermMapping(erp_payment_term_id=k, x3_payment_term_code=v)
                    for k, v in self.DEFAULT_PAYMENT_TERM_MAPPINGS.items()
                ]
            )
        return self._mapping_config

    def _map_vat_code(self, erp_vat_id: int) -> str:
        """Map ERP VAT ID to X3 VAT code."""
        config = self._get_mapping_config()
        for mapping in config.vat_mappings:
            if mapping.erp_vat_id == erp_vat_id:
                return mapping.x3_vat_code
        return config.default_vat_code

    def _map_currency_code(self, erp_currency_id: int) -> str:
        """Map ERP currency ID to X3 currency code."""
        config = self._get_mapping_config()
        for mapping in config.currency_mappings:
            if mapping.erp_currency_id == erp_currency_id:
                return mapping.x3_currency_code
        return config.default_currency_code

    def _map_payment_term(self, erp_payment_term_id: Optional[int]) -> Optional[str]:
        """Map ERP payment term ID to X3 payment term code."""
        if erp_payment_term_id is None:
            return None
        config = self._get_mapping_config()
        for mapping in config.payment_term_mappings:
            if mapping.erp_payment_term_id == erp_payment_term_id:
                return mapping.x3_payment_term_code
        return config.default_payment_term_code

    # ==========================================================================
    # Invoice Export
    # ==========================================================================

    async def _transform_invoice_to_x3(
        self,
        invoice: ClientInvoice,
        client: Optional[Client] = None
    ) -> X3InvoiceExport:
        """Transform ERP invoice to X3 export format."""
        # Load client if not provided
        if client is None:
            stmt = select(Client).where(Client.cli_id == invoice.inv_cli_id)
            result = await self.db.execute(stmt)
            client = result.scalar_one_or_none()

        if not client:
            raise X3ValidationError(
                f"Client not found for invoice {invoice.inv_reference}",
                field="inv_cli_id"
            )

        # Transform invoice lines
        lines = []
        for line in invoice.lines:
            x3_line = X3InvoiceLineExport(
                line_number=line.inl_line_number,
                product_reference=None,  # TODO: Map product reference
                description=line.inl_description[:250],
                quantity=line.inl_quantity,
                unit_price=line.inl_unit_price,
                discount_percent=line.inl_discount,
                vat_code=self._map_vat_code(line.inl_vat_id),
                vat_rate=Decimal("20"),  # TODO: Get from VAT table
                vat_amount=line.inl_vat_amount,
                net_amount=line.inl_line_total - line.inl_vat_amount,
                gross_amount=line.inl_line_total,
                unit_code="UN"
            )
            lines.append(x3_line)

        # Build X3 invoice export
        x3_invoice = X3InvoiceExport(
            document_type=X3DocumentType.INVOICE,
            document_number=invoice.inv_reference,
            company_code=settings.X3_COMPANY_CODE,
            site_code=settings.X3_ENDPOINT_NAME,

            # Customer info
            customer_code=client.cli_reference,
            customer_name=client.cli_company_name[:35],
            customer_address=client.cli_address[:50] if client.cli_address else None,
            customer_city=client.cli_city[:35] if client.cli_city else None,
            customer_postal_code=client.cli_postal_code[:10] if client.cli_postal_code else None,
            customer_country_code=None,  # TODO: Map country to ISO code
            customer_vat_number=client.cli_vat_number[:20] if client.cli_vat_number else None,

            # Dates
            invoice_date=invoice.inv_date.date() if isinstance(invoice.inv_date, datetime) else invoice.inv_date,
            due_date=invoice.inv_due_date.date() if isinstance(invoice.inv_due_date, datetime) else invoice.inv_due_date,
            accounting_date=None,

            # Currency
            currency_code=self._map_currency_code(invoice.inv_cur_id),
            exchange_rate=Decimal("1"),

            # Payment terms
            payment_term_code=self._map_payment_term(client.cli_pay_term_id),

            # Totals
            total_excl_vat=invoice.inv_sub_total,
            total_vat=invoice.inv_total_vat,
            total_incl_vat=invoice.inv_total_amount,
            discount_amount=invoice.inv_sub_total * (invoice.inv_discount or Decimal("0")) / 100,

            # Notes
            header_text=invoice.inv_notes[:250] if invoice.inv_notes else None,
            footer_text=None,

            # Internal references
            erp_invoice_id=invoice.inv_id,
            erp_order_id=invoice.inv_ord_id,

            # Lines
            lines=lines,

            # Metadata
            exported_at=datetime.now()
        )

        return x3_invoice

    async def export_invoice(
        self,
        invoice_id: int,
        dry_run: bool = False
    ) -> X3ExportItemResult:
        """Export a single invoice to X3."""
        # Load invoice with lines
        stmt = select(ClientInvoice).options(
            selectinload(ClientInvoice.lines)
        ).where(ClientInvoice.inv_id == invoice_id)

        result = await self.db.execute(stmt)
        invoice = result.scalar_one_or_none()

        if not invoice:
            raise X3ExportNotFoundError("Invoice", invoice_id)

        try:
            # Transform to X3 format
            x3_invoice = await self._transform_invoice_to_x3(invoice)

            if dry_run:
                return X3ExportItemResult(
                    erp_id=invoice.inv_id,
                    erp_reference=invoice.inv_reference,
                    x3_reference=None,
                    status="VALIDATED",
                    error_message=None
                )

            # Send to X3 API (if configured)
            if settings.X3_API_BASE_URL:
                x3_reference = await self._send_invoice_to_x3(x3_invoice)
            else:
                # Offline mode - just generate export data
                x3_reference = f"X3-{invoice.inv_reference}"

            return X3ExportItemResult(
                erp_id=invoice.inv_id,
                erp_reference=invoice.inv_reference,
                x3_reference=x3_reference,
                status="SUCCESS",
                error_message=None
            )

        except X3ExportError as e:
            return X3ExportItemResult(
                erp_id=invoice.inv_id,
                erp_reference=invoice.inv_reference,
                x3_reference=None,
                status="FAILED",
                error_message=e.message,
                error_code=e.code
            )
        except Exception as e:
            logger.exception(f"Unexpected error exporting invoice {invoice_id}")
            return X3ExportItemResult(
                erp_id=invoice.inv_id,
                erp_reference=invoice.inv_reference,
                x3_reference=None,
                status="FAILED",
                error_message=str(e),
                error_code="UNEXPECTED_ERROR"
            )

    async def _send_invoice_to_x3(self, x3_invoice: X3InvoiceExport) -> str:
        """Send invoice data to X3 API."""
        self._validate_configuration()

        client = await self._get_http_client()

        try:
            response = await client.post(
                "/sdata/x3/erp/invoices",
                json=x3_invoice.model_dump(mode="json")
            )

            if response.status_code == 401:
                raise X3AuthenticationError()
            elif response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                raise X3RateLimitError(int(retry_after) if retry_after else None)
            elif response.status_code >= 400:
                error_data = response.json() if response.content else {}
                raise X3ExportError(
                    error_data.get("message", "X3 API error"),
                    code="X3_API_ERROR",
                    details={"status_code": response.status_code, "response": error_data}
                )

            result = response.json()
            return result.get("x3_reference", x3_invoice.document_number)

        except httpx.RequestError as e:
            raise X3ConnectionError(
                f"Network error connecting to X3: {str(e)}",
                details={"original_error": str(e)}
            )

    async def export_invoices_batch(
        self,
        request: X3ExportRequest
    ) -> X3ExportJobResponse:
        """Export multiple invoices to X3 in batch."""
        job_id = str(uuid.uuid4())
        job = X3ExportJobResponse(
            job_id=job_id,
            export_type=X3ExportType.INVOICE,
            status=X3ExportStatus.IN_PROGRESS,
            started_at=datetime.now()
        )

        try:
            # Build query for invoices
            stmt = select(ClientInvoice).options(
                selectinload(ClientInvoice.lines)
            )

            conditions = []

            # Apply filters
            if request.entity_ids:
                conditions.append(ClientInvoice.inv_id.in_(request.entity_ids))

            if request.date_from:
                conditions.append(ClientInvoice.inv_date >= datetime.combine(request.date_from, datetime.min.time()))

            if request.date_to:
                conditions.append(ClientInvoice.inv_date <= datetime.combine(request.date_to, datetime.max.time()))

            if request.client_id:
                conditions.append(ClientInvoice.inv_cli_id == request.client_id)

            if request.status_ids:
                conditions.append(ClientInvoice.inv_sta_id.in_(request.status_ids))

            if request.society_id:
                conditions.append(ClientInvoice.inv_soc_id == request.society_id)

            if request.bu_id:
                conditions.append(ClientInvoice.inv_bu_id == request.bu_id)

            if conditions:
                stmt = stmt.where(and_(*conditions))

            # Order by date
            stmt = stmt.order_by(ClientInvoice.inv_date)

            # Apply batch size limit
            batch_size = request.batch_size or settings.X3_BATCH_SIZE
            stmt = stmt.limit(batch_size)

            result = await self.db.execute(stmt)
            invoices = result.scalars().all()

            job.total_records = len(invoices)

            # Process each invoice
            for invoice in invoices:
                item_result = await self.export_invoice(invoice.inv_id, dry_run=request.dry_run)
                job.results.append(item_result)
                job.processed_records += 1

                if item_result.status == "SUCCESS" or item_result.status == "VALIDATED":
                    job.successful_records += 1
                else:
                    job.failed_records += 1

            # Determine final status
            if job.failed_records == 0:
                job.status = X3ExportStatus.COMPLETED
            elif job.successful_records == 0:
                job.status = X3ExportStatus.FAILED
            else:
                job.status = X3ExportStatus.PARTIAL

            # Generate export file if requested
            if request.output_format and not request.dry_run:
                job.output_file = await self._generate_export_file(
                    job_id,
                    job.results,
                    request.output_format
                )

        except Exception as e:
            logger.exception(f"Export job {job_id} failed")
            job.status = X3ExportStatus.FAILED
            job.error_message = str(e)

        finally:
            job.completed_at = datetime.now()

        return job

    # ==========================================================================
    # Customer Export
    # ==========================================================================

    async def _transform_client_to_x3(self, client: Client) -> X3CustomerExport:
        """Transform ERP client to X3 customer export format."""
        x3_customer = X3CustomerExport(
            customer_code=client.cli_reference,
            company_code=settings.X3_COMPANY_CODE,

            # Name and contact
            company_name=client.cli_company_name[:35],
            short_name=client.cli_company_name[:10] if client.cli_company_name else None,
            contact_first_name=client.cli_first_name[:25] if client.cli_first_name else None,
            contact_last_name=client.cli_last_name[:30] if client.cli_last_name else None,
            email=client.cli_email[:80] if client.cli_email else None,
            phone=client.cli_phone[:40] if client.cli_phone else None,
            mobile=client.cli_mobile[:40] if client.cli_mobile else None,
            website=client.cli_website[:80] if client.cli_website else None,

            # Address
            address_line_1=client.cli_address[:50] if client.cli_address else None,
            address_line_2=client.cli_address2[:50] if client.cli_address2 else None,
            postal_code=client.cli_postal_code[:10] if client.cli_postal_code else None,
            city=client.cli_city[:35] if client.cli_city else None,
            country_code=None,  # TODO: Map country ID to ISO code

            # Tax and legal
            vat_number=client.cli_vat_number[:20] if client.cli_vat_number else None,
            siret=client.cli_siret[:20] if client.cli_siret else None,

            # Financial
            currency_code=self._map_currency_code(client.cli_cur_id) if client.cli_cur_id else "EUR",
            payment_term_code=self._map_payment_term(client.cli_pay_term_id),
            payment_mode_code=None,  # TODO: Map payment mode
            credit_limit=client.cli_credit_limit,
            default_discount=client.cli_discount,

            # Classification
            customer_category=None,  # TODO: Map from client type
            sales_rep_code=None,
            language_code=settings.X3_LANGUAGE,

            # Status
            is_active=client.cli_is_active,

            # Internal reference
            erp_client_id=client.cli_id,

            # Metadata
            exported_at=datetime.now()
        )

        return x3_customer

    async def export_customer(
        self,
        client_id: int,
        dry_run: bool = False
    ) -> X3ExportItemResult:
        """Export a single customer to X3."""
        stmt = select(Client).where(Client.cli_id == client_id)
        result = await self.db.execute(stmt)
        client = result.scalar_one_or_none()

        if not client:
            raise X3ExportNotFoundError("Client", client_id)

        try:
            x3_customer = await self._transform_client_to_x3(client)

            if dry_run:
                return X3ExportItemResult(
                    erp_id=client.cli_id,
                    erp_reference=client.cli_reference,
                    x3_reference=None,
                    status="VALIDATED",
                    error_message=None
                )

            # Send to X3 API if configured
            if settings.X3_API_BASE_URL:
                x3_reference = await self._send_customer_to_x3(x3_customer)
            else:
                x3_reference = f"X3-{client.cli_reference}"

            return X3ExportItemResult(
                erp_id=client.cli_id,
                erp_reference=client.cli_reference,
                x3_reference=x3_reference,
                status="SUCCESS",
                error_message=None
            )

        except X3ExportError as e:
            return X3ExportItemResult(
                erp_id=client.cli_id,
                erp_reference=client.cli_reference,
                x3_reference=None,
                status="FAILED",
                error_message=e.message,
                error_code=e.code
            )
        except Exception as e:
            logger.exception(f"Unexpected error exporting client {client_id}")
            return X3ExportItemResult(
                erp_id=client.cli_id,
                erp_reference=client.cli_reference,
                x3_reference=None,
                status="FAILED",
                error_message=str(e),
                error_code="UNEXPECTED_ERROR"
            )

    async def _send_customer_to_x3(self, x3_customer: X3CustomerExport) -> str:
        """Send customer data to X3 API."""
        self._validate_configuration()

        client = await self._get_http_client()

        try:
            response = await client.post(
                "/sdata/x3/erp/customers",
                json=x3_customer.model_dump(mode="json")
            )

            if response.status_code == 401:
                raise X3AuthenticationError()
            elif response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                raise X3RateLimitError(int(retry_after) if retry_after else None)
            elif response.status_code >= 400:
                error_data = response.json() if response.content else {}
                raise X3ExportError(
                    error_data.get("message", "X3 API error"),
                    code="X3_API_ERROR",
                    details={"status_code": response.status_code, "response": error_data}
                )

            result = response.json()
            return result.get("x3_reference", x3_customer.customer_code)

        except httpx.RequestError as e:
            raise X3ConnectionError(
                f"Network error connecting to X3: {str(e)}",
                details={"original_error": str(e)}
            )

    async def export_customers_batch(
        self,
        request: X3ExportRequest
    ) -> X3ExportJobResponse:
        """Export multiple customers to X3 in batch."""
        job_id = str(uuid.uuid4())
        job = X3ExportJobResponse(
            job_id=job_id,
            export_type=X3ExportType.CUSTOMER,
            status=X3ExportStatus.IN_PROGRESS,
            started_at=datetime.now()
        )

        try:
            stmt = select(Client)

            conditions = []

            if request.entity_ids:
                conditions.append(Client.cli_id.in_(request.entity_ids))

            if request.society_id:
                conditions.append(Client.cli_soc_id == request.society_id)

            if request.bu_id:
                conditions.append(Client.cli_bu_id == request.bu_id)

            # Only active clients by default
            conditions.append(Client.cli_is_active == True)

            if conditions:
                stmt = stmt.where(and_(*conditions))

            # Order by reference
            stmt = stmt.order_by(Client.cli_reference)

            # Apply batch size
            batch_size = request.batch_size or settings.X3_BATCH_SIZE
            stmt = stmt.limit(batch_size)

            result = await self.db.execute(stmt)
            clients = result.scalars().all()

            job.total_records = len(clients)

            for client in clients:
                item_result = await self.export_customer(client.cli_id, dry_run=request.dry_run)
                job.results.append(item_result)
                job.processed_records += 1

                if item_result.status == "SUCCESS" or item_result.status == "VALIDATED":
                    job.successful_records += 1
                else:
                    job.failed_records += 1

            # Determine final status
            if job.failed_records == 0:
                job.status = X3ExportStatus.COMPLETED
            elif job.successful_records == 0:
                job.status = X3ExportStatus.FAILED
            else:
                job.status = X3ExportStatus.PARTIAL

            # Generate export file
            if request.output_format and not request.dry_run:
                job.output_file = await self._generate_export_file(
                    job_id,
                    job.results,
                    request.output_format
                )

        except Exception as e:
            logger.exception(f"Export job {job_id} failed")
            job.status = X3ExportStatus.FAILED
            job.error_message = str(e)

        finally:
            job.completed_at = datetime.now()

        return job

    # ==========================================================================
    # Export File Generation
    # ==========================================================================

    async def _generate_export_file(
        self,
        job_id: str,
        results: List[X3ExportItemResult],
        output_format: str
    ) -> str:
        """Generate export file in specified format."""
        # Ensure export directory exists
        export_dir = settings.X3_EXPORT_DIRECTORY
        os.makedirs(export_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"x3_export_{job_id[:8]}_{timestamp}"

        if output_format == "json":
            filepath = os.path.join(export_dir, f"{filename}.json")
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(
                    [r.model_dump() for r in results],
                    f,
                    indent=2,
                    default=str
                )
        elif output_format == "csv":
            filepath = os.path.join(export_dir, f"{filename}.csv")
            with open(filepath, "w", encoding="utf-8") as f:
                # Header
                f.write("erp_id,erp_reference,x3_reference,status,error_message,error_code\n")
                # Data
                for r in results:
                    f.write(
                        f"{r.erp_id},{r.erp_reference},{r.x3_reference or ''},"
                        f"{r.status},{r.error_message or ''},{r.error_code or ''}\n"
                    )
        else:
            # Default to JSON
            filepath = os.path.join(export_dir, f"{filename}.json")
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(
                    [r.model_dump() for r in results],
                    f,
                    indent=2,
                    default=str
                )

        return filepath

    # ==========================================================================
    # Export Orchestration
    # ==========================================================================

    async def export(self, request: X3ExportRequest) -> X3ExportJobResponse:
        """Main export entry point - routes to appropriate export method."""
        if request.export_type == X3ExportType.INVOICE:
            return await self.export_invoices_batch(request)
        elif request.export_type == X3ExportType.CUSTOMER:
            return await self.export_customers_batch(request)
        elif request.export_type == X3ExportType.PAYMENT:
            # TODO: Implement payment export
            raise X3ExportError(
                "Payment export not yet implemented",
                code="NOT_IMPLEMENTED"
            )
        else:
            raise X3ValidationError(
                f"Unsupported export type: {request.export_type}",
                field="export_type"
            )

    async def get_export_preview(
        self,
        export_type: X3ExportType,
        entity_id: int
    ) -> Dict[str, Any]:
        """Get preview of export data without actually exporting."""
        if export_type == X3ExportType.INVOICE:
            stmt = select(ClientInvoice).options(
                selectinload(ClientInvoice.lines)
            ).where(ClientInvoice.inv_id == entity_id)

            result = await self.db.execute(stmt)
            invoice = result.scalar_one_or_none()

            if not invoice:
                raise X3ExportNotFoundError("Invoice", entity_id)

            x3_data = await self._transform_invoice_to_x3(invoice)
            return x3_data.model_dump(mode="json")

        elif export_type == X3ExportType.CUSTOMER:
            stmt = select(Client).where(Client.cli_id == entity_id)
            result = await self.db.execute(stmt)
            client = result.scalar_one_or_none()

            if not client:
                raise X3ExportNotFoundError("Client", entity_id)

            x3_data = await self._transform_client_to_x3(client)
            return x3_data.model_dump(mode="json")

        else:
            raise X3ValidationError(
                f"Preview not supported for export type: {export_type}",
                field="export_type"
            )

    async def validate_export_data(
        self,
        export_type: X3ExportType,
        entity_ids: List[int]
    ) -> List[X3ExportItemResult]:
        """Validate entities can be exported without actually exporting."""
        results = []

        for entity_id in entity_ids:
            try:
                if export_type == X3ExportType.INVOICE:
                    result = await self.export_invoice(entity_id, dry_run=True)
                elif export_type == X3ExportType.CUSTOMER:
                    result = await self.export_customer(entity_id, dry_run=True)
                else:
                    result = X3ExportItemResult(
                        erp_id=entity_id,
                        erp_reference="",
                        status="FAILED",
                        error_message=f"Unsupported export type: {export_type}",
                        error_code="NOT_SUPPORTED"
                    )
                results.append(result)

            except Exception as e:
                results.append(X3ExportItemResult(
                    erp_id=entity_id,
                    erp_reference="",
                    status="FAILED",
                    error_message=str(e),
                    error_code="VALIDATION_ERROR"
                ))

        return results

    # ==========================================================================
    # Cleanup
    # ==========================================================================

    async def close(self):
        """Close HTTP client."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# ==========================================================================
# Factory Function
# ==========================================================================

def get_x3_export_service(db: AsyncSession) -> X3ExportService:
    """Dependency to get X3ExportService instance."""
    return X3ExportService(db)
