"""
Invoice PDF Generation Service.
"""
from datetime import datetime
from typing import Optional
from decimal import Decimal

from sqlalchemy.orm import Session

from app.services.pdf_service import pdf_service, TemplatePDFService

# Optional import - storage_service may not be available
try:
    from app.services.storage_service import storage_service
except ImportError:
    storage_service = None  # Storage not available
from app.models.invoice import ClientInvoice
from app.models.client_invoice_line import ClientInvoiceLine
from app.models.client import Client
from app.models.society import Society
from app.models.status import Status
import logging

logger = logging.getLogger(__name__)


class InvoicePDFService:
    """Service for generating invoice PDFs."""
    
    TEMPLATE_NAME = "invoices/invoice.html"
    CSS_FILES = ["invoice.css"]
    STORAGE_PREFIX = "invoices"
    
    def __init__(self, db: Session):
        self.db = db
    
    def _get_invoice_with_relations(self, invoice_id: int) -> Optional[ClientInvoice]:
        """Fetch invoice with all related data."""
        invoice = self.db.query(ClientInvoice).filter(
            ClientInvoice.cin_id == invoice_id
        ).first()
        
        return invoice
    
    def _get_invoice_lines(self, invoice_id: int) -> list[ClientInvoiceLine]:
        """Fetch invoice lines."""
        return self.db.query(ClientInvoiceLine).filter(
            ClientInvoiceLine.cin_id == invoice_id
        ).order_by(ClientInvoiceLine.cii_level1, ClientInvoiceLine.cii_id).all()
    
    def _get_client(self, client_id: int) -> Optional[Client]:
        """Fetch client details."""
        return self.db.query(Client).filter(
            Client.cli_id == client_id
        ).first()
    
    def _get_society(self, society_id: int) -> Optional[Society]:
        """Fetch society (company) details."""
        return self.db.query(Society).filter(
            Society.soc_id == society_id
        ).first()
    
    def _get_status(self, status_id: int) -> Optional[Status]:
        """Fetch status details."""
        return self.db.query(Status).filter(
            Status.sta_id == status_id
        ).first()
    
    def _build_context(self, invoice: ClientInvoice) -> dict:
        """Build the template context for the invoice."""
        # Get related entities
        client = self._get_client(invoice.cli_id)
        society = self._get_society(invoice.soc_id) if getattr(invoice, "soc_id", None) else None
        status = None
        if invoice.cin_is_full_paid:
            status = "Paid"
        elif invoice.cin_invoiced:
            status = "Sent"
        elif invoice.cin_isinvoice:
            status = "Draft"
        else:
            status = "Credit Note"
        lines = self._get_invoice_lines(invoice.cin_id)
        
        # Build line items with calculations
        line_items = []
        for line in lines:
            line_total = (line.cii_quantity or 0) * (line.cii_unit_price or 0)
            if line.cii_discount_percentage:
                line_total = line_total * (1 - line.cii_discount_percentage / 100)
            
            line_items.append({
                'line_number': line.cii_level1 or line.cii_id,
                'reference': line.cii_ref or '',
                'description': line.cii_prd_name or line.cii_description or '',
                'quantity': line.cii_quantity or 0,
                'unit': 'PCS',
                'unit_price': float(line.cii_unit_price or 0),
                'discount_percent': float(line.cii_discount_percentage or 0),
                'vat_rate': 0,
                'total_ht': float(line_total),
            })
        
        # Calculate totals
        total_ht = sum(item["total_ht"] for item in line_items)
        discount_amount = float(invoice.cin_discount_amount or 0)
        total_vat = 0.0
        total_ttc = total_ht - discount_amount
        
        # Build context
        context = {
            'invoice': {
                'id': invoice.cin_id,
                'reference': invoice.cin_code,
                'date': invoice.cin_d_invoice,
                'due_date': invoice.cin_d_term,
                'status': status or 'Unknown',
                'notes': getattr(invoice, 'cin_client_comment', ''),
                'payment_terms': '',
                'header_text': invoice.cin_header_text,
                'footer_text': invoice.cin_footer_text,
            },
            'client': {
                'name': client.cli_company_name if client else 'Unknown Client',
                'reference': client.cli_ref if client else '',
                'address': getattr(client, 'cli_address1', '') if client else '',
                'postal_code': getattr(client, 'cli_postcode', '') if client else '',
                'city': getattr(client, 'cli_city', '') if client else '',
                'country': client.cli_country if client else '',
                'vat_number': getattr(client, 'cli_vat_intra', '') if client else '',
                'email': client.cli_email if client else '',
                'phone': getattr(client, 'cli_tel1', '') if client else '',
            },
            'company': {
                'soc_society_name': society.soc_society_name if society else 'ECOLED',
                'soc_address1': society.soc_address1 if society else '',
                'soc_address2': society.soc_address2 if society else '',
                'soc_postcode': society.soc_postcode if society else '',
                'soc_city': society.soc_city if society else '',
                'soc_county': society.soc_county if society else '',
                'soc_tva_intra': society.soc_tva_intra if society else '',
                'soc_siret': society.soc_siret if society else '',
                'soc_tel': society.soc_tel if society else '',
                'soc_email': society.soc_email if society else '',
            },
            'lines': line_items,
            'totals': {
                'total_ht': total_ht,
                'total_vat': total_vat,
                'total_ttc': total_ttc,
                'discount': discount_amount,
            },
            'currency': {
                'code': 'EUR',
                'symbol': '€',
            },
            'generated_at': datetime.now(),
        }
        
        return context
    
    def generate_pdf(self, invoice_id: int) -> bytes:
        """
        Generate a PDF for the given invoice.
        
        Args:
            invoice_id: ID of the invoice
            
        Returns:
            PDF content as bytes
            
        Raises:
            ValueError: If invoice not found
        """
        invoice = self._get_invoice_with_relations(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice with ID {invoice_id} not found")
        
        context = self._build_context(invoice)
        template_pdf = TemplatePDFService()
        pdf_content = template_pdf.generate_pdf(
            template_name="invoice",
            context=context,
        )
        
        logger.info(f"Generated PDF for invoice {invoice.cin_code}")
        return pdf_content
    
    def generate_and_store_pdf(self, invoice_id: int) -> tuple[bytes, str]:
        """
        Generate a PDF and store it in storage.
        
        Args:
            invoice_id: ID of the invoice
            
        Returns:
            Tuple of (PDF content as bytes, storage path)
            
        Raises:
            ValueError: If invoice not found
        """
        invoice = self._get_invoice_with_relations(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice with ID {invoice_id} not found")
        
        # Generate PDF
        pdf_content = self.generate_pdf(invoice_id)
        
        # Build storage path
        year = invoice.cin_d_invoice.year if invoice.cin_d_invoice else datetime.now().year
        filename = f"{invoice.cin_code}.pdf"
        storage_path = f"{self.STORAGE_PREFIX}/{year}/{filename}"
        
        # Store PDF
        storage_url = storage_service.upload_file(
            file_content=pdf_content,
            file_path=storage_path,
            content_type='application/pdf',
            metadata={
                'invoice_id': str(invoice_id),
                'invoice_reference': invoice.cin_code,
                'generated_at': datetime.now().isoformat(),
            }
        )
        
        logger.info(f"Stored PDF for invoice {invoice.cin_code} at {storage_path}")
        return pdf_content, storage_path
    
    def get_download_url(self, invoice_id: int, expiration: int = 3600) -> Optional[str]:
        """
        Get a download URL for an existing invoice PDF.
        
        Args:
            invoice_id: ID of the invoice
            expiration: URL expiration time in seconds
            
        Returns:
            Download URL or None if PDF doesn't exist
        """
        invoice = self._get_invoice_with_relations(invoice_id)
        if not invoice:
            return None
        
        year = invoice.cin_d_invoice.year if invoice.cin_d_invoice else datetime.now().year
        filename = f"{invoice.cin_code}.pdf"
        storage_path = f"{self.STORAGE_PREFIX}/{year}/{filename}"
        
        if not storage_service.file_exists(storage_path):
            return None
        
        return storage_service.get_presigned_url(
            file_path=storage_path,
            expiration=expiration,
            response_content_type='application/pdf',
            response_content_disposition=f'attachment; filename="{filename}"'
        )
