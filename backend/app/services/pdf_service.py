from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Tuple, Optional, Literal
from datetime import datetime, timedelta
import logging
import os
from fastapi import Depends

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
    """Template-based PDF service for generating PDFs using ReportLab."""

    def generate_pdf(self, template_name: str, context: dict, css_files: list = None) -> bytes:
        """
        Generate a PDF from a template name and context.
        
        Routes to appropriate PDF generator based on template name.
        """
        from app.services.pdf_generator import (
            InvoicePDFGenerator,
            QuotePDFGenerator,
            OrderPDFGenerator,
            DeliveryPDFGenerator,
        )
        
        # Determine generator based on template name
        if 'invoice' in template_name.lower():
            generator = InvoicePDFGenerator()
        elif 'quote' in template_name.lower() or 'devis' in template_name.lower():
            generator = QuotePDFGenerator()
        elif 'order' in template_name.lower() or 'commande' in template_name.lower():
            generator = OrderPDFGenerator()
        elif 'delivery' in template_name.lower() or 'livraison' in template_name.lower():
            generator = DeliveryPDFGenerator()
        else:
            # Default to invoice generator
            generator = InvoicePDFGenerator()
        
        # Transform context to generator format if needed
        pdf_data = self._transform_context(context, template_name)
        
        return generator.generate(pdf_data)
    
    def _transform_context(self, context: dict, template_name: str) -> dict:
        """Transform web context to PDF generator format."""
        result = dict(context)  # Start with a copy
        
        # If we have top-level API response format (camelCase), transform it
        if 'reference' in context:
            # Handle camelCase to snake_case transformation for dates
            if 'orderDate' in context:
                result['order_date'] = context['orderDate']
            if 'quoteDate' in context:
                result['quote_date'] = context['quoteDate']
            if 'invoiceDate' in context:
                result['invoice_date'] = context['invoiceDate']
            if 'deliveryDate' in context:
                result['delivery_date'] = context['deliveryDate']
            if 'requiredDate' in context:
                result['required_date'] = context['requiredDate']
            if 'dueDate' in context:
                result['due_date'] = context['dueDate']
            if 'validUntil' in context:
                result['valid_until'] = context['validUntil']
            if 'quoteReference' in context:
                result['quote_reference'] = context['quoteReference']
            if 'orderReference' in context:
                result['order_reference'] = context['orderReference']
            
            # Build client from snapshot or clientName
            if 'invoicingContactSnapshot' in context and context['invoicingContactSnapshot']:
                snap = context['invoicingContactSnapshot']
                result['client'] = {
                    'name': context.get('clientName', ''),
                    'address': f"{snap.get('address1', '')} {snap.get('address2', '')}".strip(),
                    'postal_code': snap.get('postcode', ''),
                    'city': snap.get('city', ''),
                    'country': snap.get('country', ''),
                    'vat_number': snap.get('vatNumber', ''),
                    'email': snap.get('email', ''),
                    'phone': snap.get('phone', ''),
                }
            elif 'clientName' in context:
                result['client'] = {'name': context['clientName']}
            
            # Transform lines from camelCase
            if 'lines' in context:
                transformed_lines = []
                for line in context['lines']:
                    transformed_lines.append({
                        'description': line.get('description') or line.get('productName', ''),
                        'quantity': line.get('quantity', 0),
                        'unit': line.get('unit', 'PCS'),
                        'unit_price': line.get('unitPrice', 0),
                        'vat_rate': line.get('vatRate', 20),
                        'total_ht': line.get('lineTotal', 0),
                        'discount_percent': line.get('discountPercentage', 0),
                    })
                result['lines'] = transformed_lines
            
            # Transform totals
            if 'subtotal' in context:
                result['total_ht'] = context.get('subtotal', 0)
            if 'taxAmount' in context:
                result['total_vat'] = context.get('taxAmount', 0)
            if 'totalAmount' in context:
                result['total_ttc'] = context.get('totalAmount', 0)
            
            return result
        
        # Otherwise, try to extract from nested structures (old format)
        # Handle invoice context
        if 'invoice' in context:
            inv = context['invoice']
            result['reference'] = inv.get('reference', '')
            result['invoice_date'] = inv.get('date')
            result['due_date'] = inv.get('due_date')
            result['payment_terms'] = inv.get('payment_terms', 'Net 30 jours')
            result['order_reference'] = inv.get('order_reference', '')
        
        # Handle quote context
        if 'quote' in context:
            q = context['quote']
            result['reference'] = q.get('reference', '')
            result['quote_date'] = q.get('date')
            result['valid_until'] = q.get('valid_until')
        
        # Handle order context
        if 'order' in context:
            o = context['order']
            result['reference'] = o.get('reference', '')
            result['order_date'] = o.get('date')
            result['required_date'] = o.get('required_date')
            result['quote_reference'] = o.get('quote_reference', '')
        
        # Handle delivery context
        if 'delivery' in context:
            d = context['delivery']
            result['reference'] = d.get('reference', '')
            result['delivery_date'] = d.get('date')
            result['order_reference'] = d.get('order_reference', '')
        
        # Handle company/society
        if 'company' in context:
            result['society'] = context['company']
        elif 'society' in context:
            result['society'] = context['society']
        
        # Handle client
        if 'client' in context:
            result['client'] = context['client']
        
        # Handle lines
        if 'lines' in context and 'lines' not in result:
            result['lines'] = context['lines']
        
        # Handle totals
        if 'totals' in context:
            result['total_ht'] = context['totals'].get('total_ht', 0)
            result['total_vat'] = context['totals'].get('total_vat', 0)
            result['total_ttc'] = context['totals'].get('total_ttc', 0)
        
        return result


# Global instance for legacy code
pdf_service = TemplatePDFService()
