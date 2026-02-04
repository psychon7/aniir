"""
Data Import Service.

Provides business logic for bulk importing data from CSV/Excel files.
Supports products, clients, suppliers, and brands.
"""
import asyncio
import csv
import io
import time
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from fastapi import Depends

from app.database import get_db

from app.models.product import Product
from app.models.client import Client
from app.models.supplier import Supplier
from app.schemas.import_data import (
    ImportEntityType,
    ImportStatus,
    ImportMode,
    ColumnMapping,
    ImportFieldDefinition,
    ImportRowError,
    ImportRowResult,
    ImportPreviewResponse,
    ImportResultResponse,
)


# ==========================================================================
# Exception Classes
# ==========================================================================

class ImportServiceError(Exception):
    """Base exception for import service errors."""
    pass


class InvalidFileError(ImportServiceError):
    """Raised when file format is invalid."""
    pass


class ValidationError(ImportServiceError):
    """Raised when data validation fails."""
    pass


# ==========================================================================
# Field Definitions
# ==========================================================================

PRODUCT_FIELDS = [
    ImportFieldDefinition(name="prd_ref", label="Reference", required=True, field_type="string", description="Product reference code"),
    ImportFieldDefinition(name="prd_name", label="Name", required=True, field_type="string", description="Product name"),
    ImportFieldDefinition(name="prd_description", label="Description", required=False, field_type="string", description="Product description"),
    ImportFieldDefinition(name="prd_price", label="Selling Price", required=False, field_type="number", description="Selling price"),
    ImportFieldDefinition(name="prd_purchase_price", label="Purchase Price", required=False, field_type="number", description="Purchase/cost price"),
    ImportFieldDefinition(name="prd_code", label="Code", required=False, field_type="string", description="Product code"),
    ImportFieldDefinition(name="pty_id", label="Product Type", required=False, field_type="lookup", lookup_type="productTypes", description="Product type ID"),
    ImportFieldDefinition(name="prd_weight", label="Weight", required=False, field_type="number", description="Weight in kg"),
    ImportFieldDefinition(name="prd_length", label="Length", required=False, field_type="number", description="Length in cm"),
    ImportFieldDefinition(name="prd_width", label="Width", required=False, field_type="number", description="Width in cm"),
    ImportFieldDefinition(name="prd_height", label="Height", required=False, field_type="number", description="Height in cm"),
    ImportFieldDefinition(name="bra_id", label="Brand", required=False, field_type="lookup", lookup_type="brands", description="Brand ID"),
]

CLIENT_FIELDS = [
    ImportFieldDefinition(name="cli_company_name", label="Company Name", required=True, field_type="string", description="Company/organization name"),
    ImportFieldDefinition(name="cli_first_name", label="First Name", required=False, field_type="string", description="Contact first name"),
    ImportFieldDefinition(name="cli_last_name", label="Last Name", required=False, field_type="string", description="Contact last name"),
    ImportFieldDefinition(name="cli_email", label="Email", required=False, field_type="string", description="Email address"),
    ImportFieldDefinition(name="cli_phone", label="Phone", required=False, field_type="string", description="Phone number"),
    ImportFieldDefinition(name="cli_mobile", label="Mobile", required=False, field_type="string", description="Mobile phone number"),
    ImportFieldDefinition(name="cli_address", label="Address", required=False, field_type="string", description="Address line 1"),
    ImportFieldDefinition(name="cli_address2", label="Address 2", required=False, field_type="string", description="Address line 2"),
    ImportFieldDefinition(name="cli_postal_code", label="Postal Code", required=False, field_type="string", description="Postal/ZIP code"),
    ImportFieldDefinition(name="cli_city", label="City", required=False, field_type="string", description="City"),
    ImportFieldDefinition(name="cli_country_id", label="Country", required=False, field_type="lookup", lookup_type="countries", description="Country ID"),
    ImportFieldDefinition(name="cli_vat_number", label="VAT Number", required=False, field_type="string", description="VAT registration number"),
    ImportFieldDefinition(name="cli_siret", label="SIRET", required=False, field_type="string", description="SIRET number (France)"),
    ImportFieldDefinition(name="cli_website", label="Website", required=False, field_type="string", description="Website URL"),
    ImportFieldDefinition(name="cli_type_id", label="Client Type", required=False, field_type="lookup", lookup_type="clientTypes", description="Client type ID"),
]

SUPPLIER_FIELDS = [
    ImportFieldDefinition(name="sup_company_name", label="Company Name", required=True, field_type="string", description="Supplier company name"),
    ImportFieldDefinition(name="sup_first_name", label="First Name", required=False, field_type="string", description="Contact first name"),
    ImportFieldDefinition(name="sup_last_name", label="Last Name", required=False, field_type="string", description="Contact last name"),
    ImportFieldDefinition(name="sup_email", label="Email", required=False, field_type="string", description="Email address"),
    ImportFieldDefinition(name="sup_phone", label="Phone", required=False, field_type="string", description="Phone number"),
    ImportFieldDefinition(name="sup_mobile", label="Mobile", required=False, field_type="string", description="Mobile phone number"),
    ImportFieldDefinition(name="sup_address", label="Address", required=False, field_type="string", description="Address line 1"),
    ImportFieldDefinition(name="sup_address2", label="Address 2", required=False, field_type="string", description="Address line 2"),
    ImportFieldDefinition(name="sup_postal_code", label="Postal Code", required=False, field_type="string", description="Postal/ZIP code"),
    ImportFieldDefinition(name="sup_city", label="City", required=False, field_type="string", description="City"),
    ImportFieldDefinition(name="sup_country_id", label="Country", required=False, field_type="lookup", lookup_type="countries", description="Country ID"),
    ImportFieldDefinition(name="sup_vat_number", label="VAT Number", required=False, field_type="string", description="VAT registration number"),
    ImportFieldDefinition(name="sup_website", label="Website", required=False, field_type="string", description="Website URL"),
]

BRAND_FIELDS = [
    ImportFieldDefinition(name="bra_name", label="Brand Name", required=True, field_type="string", description="Brand name"),
    ImportFieldDefinition(name="bra_code", label="Code", required=False, field_type="string", description="Brand code"),
    ImportFieldDefinition(name="bra_description", label="Description", required=False, field_type="string", description="Brand description"),
]

ENTITY_FIELDS = {
    ImportEntityType.PRODUCT: PRODUCT_FIELDS,
    ImportEntityType.CLIENT: CLIENT_FIELDS,
    ImportEntityType.SUPPLIER: SUPPLIER_FIELDS,
    ImportEntityType.BRAND: BRAND_FIELDS,
}


# ==========================================================================
# Temporary File Storage (in-memory for simplicity)
# ==========================================================================

_temp_files: Dict[str, Dict[str, Any]] = {}


# ==========================================================================
# Import Service
# ==========================================================================

class ImportService:
    """Service for handling bulk data imports."""

    def __init__(self, db: Session):
        self.db = db

    def get_fields_for_entity(self, entity_type: ImportEntityType) -> List[ImportFieldDefinition]:
        """Get the list of importable fields for an entity type."""
        return ENTITY_FIELDS.get(entity_type, [])

    def generate_csv_template(self, entity_type: ImportEntityType) -> str:
        """Generate a CSV template with all fields as headers."""
        fields = self.get_fields_for_entity(entity_type)
        headers = [f.name for f in fields]

        # Create CSV with headers only
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        return output.getvalue()

    def parse_csv_content(self, content: str) -> Tuple[List[str], List[Dict[str, str]]]:
        """Parse CSV content and return headers and rows."""
        reader = csv.DictReader(io.StringIO(content))
        headers = reader.fieldnames or []
        rows = list(reader)
        return headers, rows

    def store_temp_file(self, filename: str, headers: List[str], rows: List[Dict[str, str]]) -> str:
        """Store uploaded file data temporarily and return a file ID."""
        file_id = str(uuid.uuid4())
        _temp_files[file_id] = {
            "filename": filename,
            "headers": headers,
            "rows": rows,
            "created_at": datetime.utcnow()
        }
        return file_id

    def get_temp_file(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve temporarily stored file data."""
        return _temp_files.get(file_id)

    def cleanup_temp_file(self, file_id: str):
        """Remove temporarily stored file data."""
        _temp_files.pop(file_id, None)

    def _apply_transform(self, value: str, transform: Optional[str]) -> str:
        """Apply transformation to a value."""
        if not value or not transform:
            return value

        if transform == "uppercase":
            return value.upper()
        elif transform == "lowercase":
            return value.lower()
        elif transform == "trim":
            return value.strip()

        return value

    def _map_row(self, row: Dict[str, str], mappings: List[ColumnMapping]) -> Dict[str, Any]:
        """Map a source row to target fields using column mappings."""
        result = {}
        for mapping in mappings:
            value = row.get(mapping.source_column, "")
            value = self._apply_transform(value, mapping.transform)
            result[mapping.target_field] = value if value else None
        return result

    def _validate_row(
        self,
        row_number: int,
        data: Dict[str, Any],
        entity_type: ImportEntityType
    ) -> List[str]:
        """Validate a mapped row and return list of errors."""
        errors = []
        fields = self.get_fields_for_entity(entity_type)
        field_map = {f.name: f for f in fields}

        # Check required fields
        for field in fields:
            if field.required and not data.get(field.name):
                errors.append(f"Missing required field: {field.label}")

        # Validate field types
        for field_name, value in data.items():
            if value is None:
                continue

            field_def = field_map.get(field_name)
            if not field_def:
                continue

            if field_def.field_type == "number":
                try:
                    float(value)
                except (ValueError, TypeError):
                    errors.append(f"{field_def.label} must be a number")

            elif field_def.field_type == "lookup":
                # Lookup IDs should be integers
                try:
                    int(value)
                except (ValueError, TypeError):
                    errors.append(f"{field_def.label} must be a valid ID")

        return errors

    def _convert_types(self, data: Dict[str, Any], entity_type: ImportEntityType) -> Dict[str, Any]:
        """Convert string values to appropriate types."""
        fields = self.get_fields_for_entity(entity_type)
        field_map = {f.name: f for f in fields}
        result = {}

        for field_name, value in data.items():
            if value is None:
                result[field_name] = None
                continue

            field_def = field_map.get(field_name)
            if not field_def:
                result[field_name] = value
                continue

            try:
                if field_def.field_type == "number":
                    result[field_name] = float(value)
                elif field_def.field_type == "lookup":
                    result[field_name] = int(value)
                elif field_def.field_type == "boolean":
                    result[field_name] = str(value).lower() in ("true", "1", "yes")
                else:
                    result[field_name] = str(value).strip() if value else None
            except (ValueError, TypeError):
                result[field_name] = value

        return result

    def _find_existing_record(
        self,
        entity_type: ImportEntityType,
        data: Dict[str, Any],
        soc_id: int
    ) -> Optional[Any]:
        """Find existing record by unique identifier."""
        if entity_type == ImportEntityType.PRODUCT:
            ref = data.get("prd_ref")
            if ref:
                return self.db.query(Product).filter(
                    and_(Product.prd_ref == ref, Product.soc_id == soc_id)
                ).first()

        elif entity_type == ImportEntityType.CLIENT:
            # Check by company name + society
            company = data.get("cli_company_name")
            if company:
                return self.db.query(Client).filter(
                    and_(Client.cli_company_name == company, Client.soc_id == soc_id)
                ).first()

        elif entity_type == ImportEntityType.SUPPLIER:
            company = data.get("sup_company_name")
            if company:
                return self.db.query(Supplier).filter(
                    and_(Supplier.sup_company_name == company, Supplier.soc_id == soc_id)
                ).first()

        return None

    def _create_entity(
        self,
        entity_type: ImportEntityType,
        data: Dict[str, Any],
        soc_id: int
    ) -> Any:
        """Create a new entity from mapped data."""
        data["soc_id"] = soc_id
        data["created_at"] = datetime.utcnow()

        if entity_type == ImportEntityType.PRODUCT:
            entity = Product(**{k: v for k, v in data.items() if hasattr(Product, k)})
        elif entity_type == ImportEntityType.CLIENT:
            entity = Client(**{k: v for k, v in data.items() if hasattr(Client, k)})
        elif entity_type == ImportEntityType.SUPPLIER:
            entity = Supplier(**{k: v for k, v in data.items() if hasattr(Supplier, k)})
        else:
            raise ValidationError(f"Unsupported entity type: {entity_type}")

        self.db.add(entity)
        return entity

    def _update_entity(
        self,
        entity: Any,
        data: Dict[str, Any],
        entity_type: ImportEntityType
    ):
        """Update an existing entity with mapped data."""
        data["updated_at"] = datetime.utcnow()

        for key, value in data.items():
            if hasattr(entity, key) and value is not None:
                setattr(entity, key, value)

    def preview_import(
        self,
        file_id: str,
        entity_type: ImportEntityType,
        column_mappings: List[ColumnMapping],
        preview_rows: int = 10
    ) -> ImportPreviewResponse:
        """Preview import data with validation."""
        file_data = self.get_temp_file(file_id)
        if not file_data:
            raise InvalidFileError("File not found or expired")

        rows = file_data["rows"]
        headers = file_data["headers"]
        preview_data = []
        validation_errors = []

        for i, row in enumerate(rows[:preview_rows], start=1):
            mapped = self._map_row(row, column_mappings)
            errors = self._validate_row(i, mapped, entity_type)

            preview_data.append(mapped)
            if errors:
                validation_errors.append(ImportRowError(
                    row_number=i,
                    errors=errors,
                    data=mapped
                ))

        return ImportPreviewResponse(
            success=True,
            total_rows=len(rows),
            preview_data=preview_data,
            validation_errors=validation_errors,
            column_headers=headers
        )

    def execute_import(
        self,
        file_id: str,
        entity_type: ImportEntityType,
        column_mappings: List[ColumnMapping],
        import_mode: ImportMode,
        soc_id: int,
        skip_errors: bool = False,
        dry_run: bool = False
    ) -> ImportResultResponse:
        """Execute the bulk import."""
        start_time = time.time()

        file_data = self.get_temp_file(file_id)
        if not file_data:
            raise InvalidFileError("File not found or expired")

        rows = file_data["rows"]
        created_count = 0
        updated_count = 0
        skipped_count = 0
        error_count = 0
        errors: List[ImportRowError] = []
        results: List[ImportRowResult] = []

        for i, row in enumerate(rows, start=1):
            try:
                mapped = self._map_row(row, column_mappings)
                row_errors = self._validate_row(i, mapped, entity_type)

                if row_errors:
                    error_count += 1
                    errors.append(ImportRowError(row_number=i, errors=row_errors, data=mapped))
                    if not skip_errors:
                        break
                    continue

                converted = self._convert_types(mapped, entity_type)
                existing = self._find_existing_record(entity_type, converted, soc_id)

                if existing:
                    if import_mode == ImportMode.CREATE_ONLY:
                        skipped_count += 1
                        results.append(ImportRowResult(row_number=i, action="skipped"))
                    elif import_mode in (ImportMode.UPDATE_ONLY, ImportMode.UPSERT):
                        if not dry_run:
                            self._update_entity(existing, converted, entity_type)
                        updated_count += 1
                        results.append(ImportRowResult(
                            row_number=i,
                            entity_id=getattr(existing, f"{entity_type.value[:3]}_id", None),
                            action="updated"
                        ))
                else:
                    if import_mode == ImportMode.UPDATE_ONLY:
                        skipped_count += 1
                        results.append(ImportRowResult(row_number=i, action="skipped"))
                    elif import_mode in (ImportMode.CREATE_ONLY, ImportMode.UPSERT):
                        if not dry_run:
                            entity = self._create_entity(entity_type, converted, soc_id)
                            self.db.flush()  # Get ID
                            results.append(ImportRowResult(
                                row_number=i,
                                entity_id=getattr(entity, f"{entity_type.value[:3]}_id", None),
                                action="created"
                            ))
                        else:
                            results.append(ImportRowResult(row_number=i, action="created"))
                        created_count += 1

            except Exception as e:
                error_count += 1
                errors.append(ImportRowError(row_number=i, errors=[str(e)]))
                if not skip_errors:
                    break

        # Commit or rollback
        if not dry_run:
            if error_count == 0 or skip_errors:
                self.db.commit()
            else:
                self.db.rollback()

        # Determine final status
        if error_count == 0:
            status = ImportStatus.COMPLETED
            message = f"Import completed successfully. Created: {created_count}, Updated: {updated_count}, Skipped: {skipped_count}"
        elif created_count + updated_count > 0 and skip_errors:
            status = ImportStatus.PARTIAL
            message = f"Import completed with errors. Created: {created_count}, Updated: {updated_count}, Errors: {error_count}"
        else:
            status = ImportStatus.FAILED
            message = f"Import failed with {error_count} errors"

        if dry_run:
            message = f"[DRY RUN] {message}"

        duration = time.time() - start_time

        # Cleanup temp file
        self.cleanup_temp_file(file_id)

        return ImportResultResponse(
            success=error_count == 0 or skip_errors,
            status=status,
            message=message,
            total_rows=len(rows),
            created_count=created_count,
            updated_count=updated_count,
            skipped_count=skipped_count,
            error_count=error_count,
            errors=errors[:50],  # Limit errors returned
            results=results[:100],  # Limit results returned
            duration_seconds=round(duration, 2)
        )


# ==========================================================================
# Async Wrapper Functions
# ==========================================================================

async def async_get_fields(service: ImportService, entity_type: ImportEntityType) -> List[ImportFieldDefinition]:
    """Async wrapper for get_fields_for_entity."""
    return await asyncio.to_thread(service.get_fields_for_entity, entity_type)


async def async_generate_template(service: ImportService, entity_type: ImportEntityType) -> str:
    """Async wrapper for generate_csv_template."""
    return await asyncio.to_thread(service.generate_csv_template, entity_type)


async def async_store_file(
    service: ImportService,
    filename: str,
    headers: List[str],
    rows: List[Dict[str, str]]
) -> str:
    """Async wrapper for store_temp_file."""
    return await asyncio.to_thread(service.store_temp_file, filename, headers, rows)


async def async_preview(
    service: ImportService,
    file_id: str,
    entity_type: ImportEntityType,
    mappings: List[ColumnMapping],
    preview_rows: int
) -> ImportPreviewResponse:
    """Async wrapper for preview_import."""
    return await asyncio.to_thread(
        service.preview_import, file_id, entity_type, mappings, preview_rows
    )


async def async_execute_import(
    service: ImportService,
    file_id: str,
    entity_type: ImportEntityType,
    mappings: List[ColumnMapping],
    mode: ImportMode,
    soc_id: int,
    skip_errors: bool,
    dry_run: bool
) -> ImportResultResponse:
    """Async wrapper for execute_import."""
    return await asyncio.to_thread(
        service.execute_import,
        file_id, entity_type, mappings, mode, soc_id, skip_errors, dry_run
    )


# ==========================================================================
# Service Factory
# ==========================================================================

def get_import_service(db: Session = Depends(get_db)) -> ImportService:
    """Factory function to get ImportService instance."""
    return ImportService(db)
