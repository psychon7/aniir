from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Tuple, Optional, Literal, Dict, Any
from datetime import datetime, timedelta, date
from decimal import Decimal
from pathlib import Path
import logging
from fastapi import Depends

from dateutil import parser as date_parser
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML, CSS

from app.database import get_db
from app.schemas.pdf import (
    PDFStatusResponse,
    PDFGenerateResponse,
    PDFViewUrlResponse,
    PDFStatusType,
    DocumentType,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class PDFService:
    """Service for managing PDF status and generation"""

    def __init__(self, db: Session):
        self.db = db

    def _get_table_info(self, document_type: DocumentType) -> Tuple[str, str, str, str]:
        """Get table name, id column, reference column, and PDF table for document type.

        Returns:
            Tuple of (table_name, id_column, reference_column, pdf_table)
        """
        table_map = {
            "quote": ("TM_CPL_Cost_Plan", "cpl_id", "cpl_code", "TM_CPL_Cost_Plan"),
            "order": ("TM_COD_Client_Order", "cod_id", "cod_code", "TM_COD_Client_Order"),
            "invoice": ("TM_CIN_Client_Invoice", "cin_id", "cin_code", "TM_CIN_Client_Invoice"),
            "delivery": ("TM_DFO_Delivery_Form", "dfo_id", "dfo_code", "TM_DFO_Delivery_Form"),
            "credit": ("TM_CIN_Client_Invoice", "cin_id", "cin_code", "TM_CIN_Client_Invoice"),
        }
        return table_map.get(document_type, ("", "", "", ""))

    def get_pdf_status(
        self, document_type: DocumentType, document_id: int
    ) -> PDFStatusResponse:
        """Get PDF status for a single document"""
        table_name, id_col, ref_col, _ = self._get_table_info(document_type)

        if not table_name:
            return PDFStatusResponse(
                document_id=document_id,
                document_type=document_type,
                status="none",
            )

        # Query the document for PDF-related fields
        # Assuming documents have: PdfUrl, PdfGeneratedAt, PdfFileSize, PdfError, UpdatedAt
        query = text(f"""
            SELECT
                {id_col} as Id,
                {ref_col} as Reference,
                PdfUrl,
                PdfGeneratedAt,
                PdfFileSize,
                PdfError,
                UpdatedAt
            FROM {table_name}
            WHERE {id_col} = :document_id
        """)

        result = self.db.execute(query, {"document_id": document_id}).fetchone()

        if not result:
            return PDFStatusResponse(
                document_id=document_id,
                document_type=document_type,
                status="none",
                error_message="Document not found",
            )

        # Determine status based on PDF fields
        status: PDFStatusType = "none"
        pdf_url = result.PdfUrl if hasattr(result, "PdfUrl") else None
        generated_at = result.PdfGeneratedAt if hasattr(result, "PdfGeneratedAt") else None
        file_size = result.PdfFileSize if hasattr(result, "PdfFileSize") else None
        error_msg = result.PdfError if hasattr(result, "PdfError") else None
        updated_at = result.UpdatedAt if hasattr(result, "UpdatedAt") else None

        if error_msg:
            status = "error"
        elif pdf_url and generated_at:
            # Check if PDF is outdated (document updated after PDF generation)
            if updated_at and generated_at and updated_at > generated_at:
                status = "outdated"
            else:
                status = "ready"
        else:
            status = "none"

        return PDFStatusResponse(
            document_id=document_id,
            document_type=document_type,
            status=status,
            pdf_url=pdf_url,
            generated_at=generated_at,
            file_size=file_size,
            error_message=error_msg,
        )

    def get_batch_pdf_status(
        self, document_type: DocumentType, document_ids: List[int]
    ) -> List[PDFStatusResponse]:
        """Get PDF status for multiple documents"""
        if not document_ids:
            return []

        table_name, id_col, ref_col, _ = self._get_table_info(document_type)

        if not table_name:
            return [
                PDFStatusResponse(
                    document_id=doc_id,
                    document_type=document_type,
                    status="none",
                )
                for doc_id in document_ids
            ]

        # Build query for batch status
        ids_str = ",".join(str(id) for id in document_ids)
        query = text(f"""
            SELECT
                {id_col} as Id,
                {ref_col} as Reference,
                PdfUrl,
                PdfGeneratedAt,
                PdfFileSize,
                PdfError,
                UpdatedAt
            FROM {table_name}
            WHERE {id_col} IN ({ids_str})
        """)

        results = self.db.execute(query).fetchall()
        result_map = {r.Id: r for r in results}

        statuses = []
        for doc_id in document_ids:
            if doc_id in result_map:
                result = result_map[doc_id]
                pdf_url = result.PdfUrl if hasattr(result, "PdfUrl") else None
                generated_at = result.PdfGeneratedAt if hasattr(result, "PdfGeneratedAt") else None
                file_size = result.PdfFileSize if hasattr(result, "PdfFileSize") else None
                error_msg = result.PdfError if hasattr(result, "PdfError") else None
                updated_at = result.UpdatedAt if hasattr(result, "UpdatedAt") else None

                status: PDFStatusType = "none"
                if error_msg:
                    status = "error"
                elif pdf_url and generated_at:
                    if updated_at and generated_at and updated_at > generated_at:
                        status = "outdated"
                    else:
                        status = "ready"

                statuses.append(
                    PDFStatusResponse(
                        document_id=doc_id,
                        document_type=document_type,
                        status=status,
                        pdf_url=pdf_url,
                        generated_at=generated_at,
                        file_size=file_size,
                        error_message=error_msg,
                    )
                )
            else:
                statuses.append(
                    PDFStatusResponse(
                        document_id=doc_id,
                        document_type=document_type,
                        status="none",
                    )
                )

        return statuses

    async def generate_pdf(
        self, document_type: DocumentType, document_id: int
    ) -> PDFGenerateResponse:
        """Generate PDF for a document (placeholder - actual generation in separate task)"""
        # This would typically trigger an async task for PDF generation
        # For now, we'll simulate the response
        from app.tasks.pdf_generation import generate_document_pdf

        # Trigger async generation
        result = await generate_document_pdf(document_type, document_id, self.db)

        return PDFGenerateResponse(
            success=True,
            pdf_url=result["pdf_url"],
            generated_at=result["generated_at"],
            file_size=result["file_size"],
        )

    async def get_pdf_content(
        self, document_type: DocumentType, document_id: int
    ) -> Tuple[bytes, str]:
        """Get PDF content for download"""
        status = self.get_pdf_status(document_type, document_id)

        if status.status != "ready" or not status.pdf_url:
            raise ValueError(f"PDF not available for {document_type} {document_id}")

        # Get document reference for filename
        table_name, id_col, ref_col, _ = self._get_table_info(document_type)
        query = text(f"SELECT {ref_col} FROM {table_name} WHERE {id_col} = :id")
        result = self.db.execute(query, {"id": document_id}).fetchone()
        reference = result[0] if result else f"{document_type}_{document_id}"

        # Fetch PDF from storage (MinIO/S3)
        from app.core.storage import storage_client

        pdf_content = await storage_client.get_file(status.pdf_url)
        filename = f"{reference}.pdf"

        return pdf_content, filename

    def get_view_url(
        self, document_type: DocumentType, document_id: int
    ) -> PDFViewUrlResponse:
        """Get presigned URL for viewing PDF"""
        status = self.get_pdf_status(document_type, document_id)

        if status.status != "ready" or not status.pdf_url:
            raise ValueError(f"PDF not available for {document_type} {document_id}")

        # Generate presigned URL (valid for 1 hour)
        from app.core.storage import storage_client

        expires_at = datetime.utcnow() + timedelta(hours=1)
        presigned_url = storage_client.get_presigned_url(
            status.pdf_url, expires_in=3600
        )

        return PDFViewUrlResponse(url=presigned_url, expires_at=expires_at)


# =============================================================================
# Dependency Function
# =============================================================================

def get_pdf_service(db: Session = Depends(get_db)) -> PDFService:
    """Dependency for getting PDF service."""
    return PDFService(db)


# =============================================================================
# Legacy Template-based PDF Service (mock)
# =============================================================================

class TemplatePDFService:
    """Template-based PDF service for generating PDFs using Jinja2 + WeasyPrint."""

    def __init__(self, templates_dir: Optional[Path] = None):
        self.templates_dir = templates_dir or (Path(__file__).resolve().parent.parent / "templates")
        self.env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=select_autoescape(["html", "xml"]),
        )
        self.env.filters["format_date"] = self._format_date
        self.env.filters["format_money"] = self._format_money
        self.env.filters["format_qty"] = self._format_qty
        self.env.filters["format_percent"] = self._format_percent

    def generate_pdf(self, template_name: str, context: dict, css_files: list = None) -> bytes:
        """Generate a PDF from a template name and context using HTML rendering."""
        resolved_template = self._resolve_template_name(template_name)
        normalized_context = self._normalize_context(context, resolved_template)

        template = self.env.get_template(resolved_template)
        html_content = template.render(**normalized_context)

        stylesheets = []
        for css_file in (css_files or []):
            css_path = self._resolve_asset_path(css_file)
            if css_path:
                stylesheets.append(CSS(filename=str(css_path)))

        return HTML(string=html_content, base_url=str(self.templates_dir)).write_pdf(
            stylesheets=stylesheets
        )

    def _resolve_asset_path(self, asset_name: str) -> Optional[Path]:
        if not asset_name:
            return None
        candidates = [
            self.templates_dir / asset_name,
            self.templates_dir / "css" / asset_name,
            self.templates_dir / "invoices" / asset_name,
        ]
        for candidate in candidates:
            if candidate.exists():
                return candidate
        return None

    def _resolve_template_name(self, template_name: str) -> str:
        name = (template_name or "").lower()
        if "customer_statement" in name or "statement" in name:
            return "customer_statement.html"
        if "inspection" in name:
            return "invoices/inspection-form.html"
        if "technical" in name:
            return "products/technical-sheet.html"
        if "quote" in name or "devis" in name:
            return "devis_preview.html"
        if "order" in name or "commande" in name:
            return "bon_commande_preview.html"
        if "delivery" in name or "livraison" in name:
            return "bon_livraison_preview.html"
        if "invoice" in name or "facture" in name:
            return "facture_preview.html"
        return template_name

    def _normalize_context(self, context: dict, resolved_template: str) -> dict:
        if not isinstance(context, dict):
            return {"context": context}

        template_key = resolved_template.lower()
        if "customer_statement" in template_key:
            return self._build_statement_context(context)
        if "inspection-form" in template_key:
            return self._build_inspection_context(context)
        if "technical-sheet" in template_key:
            return self._build_technical_sheet_context(context)

        return self._build_document_context(context)

    def _build_document_context(self, context: dict) -> dict:
        if context.get("document") and context.get("company") and context.get("client"):
            return context

        raw = self._flatten_document_context(context)
        document_type = raw.get("document_type")
        if not document_type and any(
            (line or {}).get("orderedQuantity") is not None or (line or {}).get("deliveredQuantity") is not None
            for line in (raw.get("lines") or [])
        ):
            document_type = "delivery"

        company = self._normalize_company(raw.get("company") or {})
        client = self._normalize_client(raw)
        delivery = self._normalize_delivery(raw)
        lines = self._normalize_lines(raw.get("lines") or [], document_type)
        totals = self._normalize_totals(raw)
        currency_symbol = self._currency_symbol(raw.get("currency"))

        document = {
            "date": raw.get("date"),
            "valid_until": raw.get("valid_until"),
            "validity_days": raw.get("validity_days"),
            "order_reference": raw.get("order_reference"),
            "delivery_date": raw.get("delivery_date"),
            "required_date": raw.get("required_date"),
        }

        meta = {
            "sales_rep": raw.get("sales_rep"),
            "cee_id": raw.get("cee_id"),
            "client_reference": raw.get("client_reference"),
            "project_name": raw.get("project_name"),
        }

        vat_breakdown = raw.get("vat_breakdown") or []
        if not vat_breakdown:
            vat_breakdown = [
                {
                    "base": totals.get("net_ht"),
                    "rate": raw.get("vat_rate", 0),
                    "vat": totals.get("total_vat"),
                    "total": totals.get("total_ttc"),
                }
            ]

        terms = raw.get("terms") or []
        if not terms:
            terms = ["Conditions disponibles sur demande."]
        notes = raw.get("notes") or terms
        summary = self._build_delivery_summary(lines) if document_type == "delivery" else {}

        return {
            "reference": raw.get("reference"),
            "company": company,
            "client": client,
            "delivery": delivery,
            "document": document,
            "meta": meta,
            "lines": lines,
            "totals": totals,
            "vat_breakdown": vat_breakdown,
            "terms": terms,
            "notes": notes,
            "summary": summary,
            "currency_symbol": currency_symbol,
        }

    def _flatten_document_context(self, context: dict) -> dict:
        if "reference" in context:
            raw = dict(context)
            raw["document_type"] = context.get("document_type")
            raw["date"] = (
                context.get("quoteDate")
                or context.get("orderDate")
                or context.get("invoiceDate")
                or context.get("deliveryDate")
            )
            raw["valid_until"] = context.get("validUntil")
            raw["order_reference"] = context.get("orderReference") or context.get("quoteReference")
            raw["delivery_date"] = context.get("deliveryDate") or context.get("scheduledDate")
            raw["required_date"] = (
                context.get("requiredDate")
                or context.get("dueDate")
                or context.get("expectedDeliveryDate")
            )
            raw["validity_days"] = self._calculate_days_between(raw.get("date"), raw.get("valid_until"))
            raw["sales_rep"] = context.get("salesRep")
            raw["cee_id"] = context.get("ceeId")
            raw["client_reference"] = (context.get("invoicingContactSnapshot") or {}).get("reference")
            raw["project_name"] = context.get("name")
            raw["currency"] = context.get("currency")
            raw["vat_rate"] = context.get("vatRate") or 0
            raw["terms"] = self._split_terms(context.get("headerText"), context.get("footerText"))
            raw["notes"] = raw["terms"]
            return raw

        if "invoice" in context:
            inv = context.get("invoice") or {}
            return {
                "reference": inv.get("reference"),
                "date": inv.get("date"),
                "valid_until": None,
                "order_reference": inv.get("order_reference"),
                "delivery_date": None,
                "required_date": None,
                "document_type": "invoice",
                "currency": context.get("currency") or {},
                "lines": context.get("lines") or [],
                "terms": self._split_terms(inv.get("header_text"), inv.get("footer_text")),
                "company": context.get("company") or {},
                "client": context.get("client") or {},
                "totals": context.get("totals") or {},
            }

        return dict(context)

    def _build_statement_context(self, context: dict) -> dict:
        statement = context.get("statement") if isinstance(context.get("statement"), dict) else context
        company = context.get("company") or context.get("society") or {}
        return {
            "client": statement.get("client", {}),
            "company": company,
            "statement_period": statement.get("period", {}),
            "generated_at": statement.get("generated_at") or datetime.utcnow().isoformat(),
            "opening_balance": statement.get("opening_balance", 0),
            "closing_balance": statement.get("closing_balance", 0),
            "transactions": statement.get("transactions", []),
            "totals": statement.get("totals", {}),
            "aging_summary": statement.get("aging_summary", {}),
            "currency_symbol": context.get("currency_symbol") or "€",
            "notes": context.get("notes", ""),
        }

    def _build_inspection_context(self, context: dict) -> dict:
        return {
            "reference": context.get("reference"),
            "client_name": context.get("clientName") or context.get("client_name"),
            "invoice_date": context.get("invoiceDate") or context.get("invoice_date"),
            "lines": context.get("lines") or [],
        }

    def _build_technical_sheet_context(self, context: dict) -> dict:
        product = context.get("product") if isinstance(context.get("product"), dict) else context
        return {
            "product": product,
            "generated_at": context.get("generated_at") or datetime.utcnow().isoformat(),
        }

    def _normalize_company(self, company: dict) -> dict:
        if not isinstance(company, dict):
            company = {}

        name = company.get("name") or company.get("soc_society_name") or "AX TECH"
        address_lines = company.get("address_lines")
        if not address_lines:
            address_lines = []
            address1 = company.get("soc_address1") or company.get("address")
            address2 = company.get("soc_address2") or company.get("address2")
            if address1:
                address_lines.append(address1)
            if address2:
                address_lines.append(address2)
            line_parts = []
            postal_code = company.get("soc_postcode") or company.get("postal_code")
            city = company.get("soc_city") or company.get("city")
            country = company.get("soc_country") or company.get("country") or company.get("soc_county")
            if postal_code:
                line_parts.append(str(postal_code))
            if city:
                line_parts.append(str(city))
            if line_parts:
                address_lines.append(" ".join(line_parts))
            if country:
                address_lines.append(str(country))

        bank = {
            "owner_name": company.get("soc_rib_name") or company.get("bank_owner_name") or name,
            "owner_address_lines": self._split_address(company.get("soc_rib_address")),
            "bank_name": company.get("soc_rib_domiciliation_agency") or company.get("bank_name"),
            "bank_address_lines": self._split_address(company.get("bank_address")),
            "bank_code": company.get("soc_rib_bank_code") or company.get("bank_code"),
            "agency_code": company.get("soc_rib_agence_code") or company.get("agency_code"),
            "account_number": company.get("soc_rib_account_number") or company.get("account_number"),
            "key": company.get("soc_rib_key") or company.get("bank_key"),
            "domiciliation": company.get("soc_rib_domiciliation_agency") or company.get("domiciliation"),
            "iban": company.get("soc_rib_code_iban") or company.get("iban"),
            "bic": company.get("soc_rib_code_bic") or company.get("bic"),
        }

        return {
            "name": name,
            "address_lines": address_lines,
            "phone": company.get("soc_tel") or company.get("phone"),
            "email": company.get("soc_email") or company.get("email"),
            "website": company.get("soc_site") or company.get("website"),
            "siret": company.get("soc_siret") or company.get("siret"),
            "rcs": company.get("soc_rcs") or company.get("rcs"),
            "vat_number": company.get("soc_tva_intra") or company.get("vat_number"),
            "logo_path": company.get("logo_path") or "axtech_logo.png",
            "bank": bank,
        }

    @staticmethod
    def build_company_context(society: Any) -> dict:
        if not society:
            return {}
        if isinstance(society, dict):
            return society
        return {
            "soc_society_name": getattr(society, "soc_society_name", None),
            "soc_address1": getattr(society, "soc_address1", None),
            "soc_address2": getattr(society, "soc_address2", None),
            "soc_postcode": getattr(society, "soc_postcode", None),
            "soc_city": getattr(society, "soc_city", None),
            "soc_county": getattr(society, "soc_county", None),
            "soc_tel": getattr(society, "soc_tel", None),
            "soc_email": getattr(society, "soc_email", None),
            "soc_site": getattr(society, "soc_site", None),
            "soc_siret": getattr(society, "soc_siret", None),
            "soc_rcs": getattr(society, "soc_rcs", None),
            "soc_tva_intra": getattr(society, "soc_tva_intra", None),
            "soc_rib_name": getattr(society, "soc_rib_name", None),
            "soc_rib_address": getattr(society, "soc_rib_address", None),
            "soc_rib_code_iban": getattr(society, "soc_rib_code_iban", None),
            "soc_rib_code_bic": getattr(society, "soc_rib_code_bic", None),
            "soc_rib_bank_code": getattr(society, "soc_rib_bank_code", None),
            "soc_rib_agence_code": getattr(society, "soc_rib_agence_code", None),
            "soc_rib_account_number": getattr(society, "soc_rib_account_number", None),
            "soc_rib_key": getattr(society, "soc_rib_key", None),
            "soc_rib_domiciliation_agency": getattr(society, "soc_rib_domiciliation_agency", None),
        }

    def _normalize_client(self, raw: dict) -> dict:
        client = raw.get("client") if isinstance(raw.get("client"), dict) else {}
        name = raw.get("clientName") or client.get("name") or client.get("company_name") or ""

        snapshot = raw.get("invoicingContactSnapshot") or raw.get("deliveryContactSnapshot") or {}
        department = snapshot.get("addressTitle") or client.get("department")
        address_lines = []
        address1 = snapshot.get("address1") or client.get("address") or client.get("address1")
        address2 = snapshot.get("address2") or client.get("address2")
        if address1:
            address_lines.append(address1)
        if address2:
            address_lines.append(address2)
        shipping_address = raw.get("shippingAddress")
        if not address_lines and shipping_address:
            address_lines.append(shipping_address)

        return {
            "name": name,
            "department": department,
            "address_lines": address_lines,
            "postal_code": snapshot.get("postcode") or client.get("postal_code") or client.get("postalCode"),
            "city": snapshot.get("city") or client.get("city"),
            "country": snapshot.get("country") or client.get("country"),
            "phone": snapshot.get("phone") or client.get("phone"),
            "email": snapshot.get("email") or client.get("email"),
        }

    def _normalize_delivery(self, raw: dict) -> dict:
        snapshot = raw.get("deliveryContactSnapshot") or {}
        name = raw.get("clientName") or raw.get("deliveryName") or ""
        address_lines = []
        address1 = snapshot.get("address1")
        address2 = snapshot.get("address2")
        if address1:
            address_lines.append(address1)
        if address2:
            address_lines.append(address2)
        shipping_address = raw.get("shippingAddress")
        if not address_lines and shipping_address:
            address_lines.append(shipping_address)

        contact_name = raw.get("contactName") or " ".join(
            [part for part in [snapshot.get("firstName"), snapshot.get("lastName")] if part]
        ).strip()

        return {
            "name": name,
            "address_lines": address_lines,
            "postal_code": snapshot.get("postcode"),
            "city": snapshot.get("city"),
            "country": snapshot.get("country"),
            "contact_name": contact_name or None,
            "phone": raw.get("contactPhone") or snapshot.get("phone"),
        }

    def _normalize_lines(self, lines: List[dict], document_type: Optional[str]) -> List[Dict[str, Any]]:
        normalized = []
        for line in lines or []:
            if not isinstance(line, dict):
                continue
            product_name = line.get("productName") or line.get("name") or ""
            description = line.get("description") or ""
            desc = product_name or description
            details = description if product_name and description and description != product_name else None
            quantity = line.get("quantity")
            unit_price = line.get("unitPrice") or line.get("unit_price")
            total_ht = line.get("lineTotal") or line.get("total_ht")
            if total_ht is None and quantity is not None and unit_price is not None:
                total_ht = float(quantity) * float(unit_price)

            ordered_qty = line.get("orderedQuantity")
            delivered_qty = line.get("deliveredQuantity")
            remaining_qty = None
            if ordered_qty is not None or delivered_qty is not None:
                remaining_qty = float(ordered_qty or 0) - float(delivered_qty or 0)

            normalized.append(
                {
                    "reference": line.get("productReference") or line.get("reference") or "",
                    "description": desc or "",
                    "details": details,
                    "quantity": float(quantity or 0),
                    "unit_price": float(unit_price or 0),
                    "discount_percent": float(line.get("discountPercentage") or line.get("discount_percent") or 0),
                    "total_ht": float(total_ht or 0),
                    "ordered_quantity": float(ordered_qty or 0),
                    "delivered_quantity": float(delivered_qty or 0),
                    "remaining_quantity": float(remaining_qty or 0),
                }
            )
        return normalized

    def _normalize_totals(self, raw: dict) -> dict:
        totals = raw.get("totals") if isinstance(raw.get("totals"), dict) else {}
        subtotal = raw.get("subtotal", totals.get("total_ht"))
        discount = raw.get("discountAmount", totals.get("discount")) or 0
        net_ht = (subtotal or 0) - (discount or 0)
        total_vat = raw.get("taxAmount", totals.get("total_vat")) or raw.get("vatAmount", 0) or 0
        total_ttc = raw.get("totalAmount", totals.get("total_ttc")) or (net_ht + total_vat)
        return {
            "subtotal": float(subtotal or 0),
            "discount": float(discount or 0),
            "net_ht": float(net_ht or 0),
            "total_vat": float(total_vat or 0),
            "total_ttc": float(total_ttc or 0),
        }

    def _build_delivery_summary(self, lines: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_lines = len(lines)
        total_delivered = sum(line.get("delivered_quantity", 0) for line in lines)
        total_remaining = sum(line.get("remaining_quantity", 0) for line in lines)
        return {
            "total_lines": total_lines,
            "total_delivered": total_delivered,
            "total_remaining": total_remaining,
        }

    def _currency_symbol(self, currency: Any) -> str:
        if isinstance(currency, dict):
            code = currency.get("code") or currency.get("currencyCode")
        else:
            code = currency
        if not code:
            return "€"
        code = str(code).upper()
        return {"EUR": "€", "USD": "$", "GBP": "£", "AED": "د.إ"}.get(code, "€")

    def _format_date(self, value: Any, fmt: str = "%d/%m/%Y") -> str:
        if not value:
            return ""
        if isinstance(value, (datetime, date)):
            return value.strftime(fmt)
        try:
            parsed = date_parser.parse(str(value))
            return parsed.strftime(fmt)
        except Exception:
            return str(value)

    def _format_money(self, value: Any, currency_symbol: str = "€") -> str:
        amount = self._to_decimal(value)
        formatted = f"{amount:.2f}".replace(".", ",")
        return f"{formatted} {currency_symbol}".strip()

    def _format_qty(self, value: Any) -> str:
        amount = self._to_decimal(value)
        return f"{amount:.2f}".replace(".", ",")

    def _format_percent(self, value: Any) -> str:
        amount = self._to_decimal(value)
        formatted = f"{amount:.2f}".replace(".", ",")
        return f"{formatted}%"

    def _to_decimal(self, value: Any) -> Decimal:
        try:
            return Decimal(str(value or 0))
        except Exception:
            return Decimal("0")

    def _split_terms(self, *parts: Any) -> List[str]:
        terms: List[str] = []
        for part in parts:
            if not part:
                continue
            for line in str(part).splitlines():
                line = line.strip()
                if line:
                    terms.append(line)
        return terms

    def _split_address(self, value: Any) -> List[str]:
        if not value:
            return []
        if isinstance(value, list):
            return [str(v) for v in value if v]
        return [v.strip() for v in str(value).splitlines() if v.strip()]

    def _calculate_days_between(self, start_value: Any, end_value: Any) -> Optional[int]:
        if not start_value or not end_value:
            return None
        try:
            start = date_parser.parse(str(start_value))
            end = date_parser.parse(str(end_value))
            return (end.date() - start.date()).days
        except Exception:
            return None


# Global instance for legacy code
pdf_service = TemplatePDFService()
