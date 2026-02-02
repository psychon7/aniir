from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Tuple, Optional, Literal
from datetime import datetime, timedelta
import logging
import os

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

    def _get_table_info(self, document_type: DocumentType) -> Tuple[str, str, str]:
        """Get table name, reference column, and PDF columns for document type"""
        table_map = {
            "quote": ("TM_QUO_Quote", "Reference", "TM_QUO_Quote"),
            "order": ("TM_ORD_Order", "Reference", "TM_ORD_Order"),
            "invoice": ("TM_INV_ClientInvoice", "Reference", "TM_INV_ClientInvoice"),
            "delivery": ("TM_DEL_DeliveryNote", "Reference", "TM_DEL_DeliveryNote"),
            "credit": ("TM_CRE_CreditNote", "Reference", "TM_CRE_CreditNote"),
        }
        return table_map.get(document_type, ("", "", ""))

    def get_pdf_status(
        self, document_type: DocumentType, document_id: int
    ) -> PDFStatusResponse:
        """Get PDF status for a single document"""
        table_name, ref_col, _ = self._get_table_info(document_type)

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
                Id,
                {ref_col} as Reference,
                PdfUrl,
                PdfGeneratedAt,
                PdfFileSize,
                PdfError,
                UpdatedAt
            FROM {table_name}
            WHERE Id = :document_id
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

        table_name, ref_col, _ = self._get_table_info(document_type)

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
                Id,
                {ref_col} as Reference,
                PdfUrl,
                PdfGeneratedAt,
                PdfFileSize,
                PdfError,
                UpdatedAt
            FROM {table_name}
            WHERE Id IN ({ids_str})
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
        table_name, ref_col, _ = self._get_table_info(document_type)
        query = text(f"SELECT {ref_col} FROM {table_name} WHERE Id = :id")
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

def get_pdf_service(db: Session) -> PDFService:
    """Dependency for getting PDF service."""
    return PDFService(db)


# =============================================================================
# Legacy Template-based PDF Service (mock)
# =============================================================================

class TemplatePDFService:
    """Legacy template-based PDF service for generating PDFs from HTML templates."""

    def generate_pdf(self, template_name: str, context: dict, css_files: list = None) -> bytes:
        """
        Generate a PDF from an HTML template.

        This is a placeholder. In production, use weasyprint or reportlab.
        """
        # Placeholder implementation
        return b"%PDF-1.4 placeholder pdf content"


# Global instance for legacy code
pdf_service = TemplatePDFService()
