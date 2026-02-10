"""
Invoice PDF Generation Service.
"""
from datetime import datetime
from typing import Optional
from decimal import Decimal

from sqlalchemy.orm import Session

from app.services.pdf_service import pdf_service

# Optional import - storage_service may not be available
try:
    from app.services.storage_service import storage_service
except ImportError:
    storage_service = None  # Storage not available
from app.models.invoice import ClientInvoice
from app.models.invoice_line import ClientInvoiceLine
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
            ClientInvoice.inv_id == invoice_id
        ).first()
        
        return invoice
    
    def _get_invoice_lines(self, invoice_id: int) -> list[ClientInvoiceLine]:
        """Fetch invoice lines."""
        return self.db.query(ClientInvoiceLine).filter(
            ClientInvoiceLine.inl_invoice_id == invoice_id
        ).order_by(ClientInvoiceLine.inl_line_number).all()
    
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
        client = self._get_client(invoice.inv_client_id)
        society = self._get_society(invoice.inv_society_id) if hasattr(invoice, 'inv_society_id') else None
        status = self._get_status(invoice.inv_status_id) if invoice.inv_status_id else None
        lines = self._get_invoice_lines(invoice.inv_id)
        
        # Build line items with calculations
        line_items = []
        for line in lines:
            line_total = (line.inl_quantity or 0) * (line.inl_unit_price or 0)
            if line.inl_discount_percent:
                line_total = line_total * (1 - line.inl_discount_percent / 100)
            
            line_items.append({
                'line_number': line.inl_line_number,
                'reference': line.inl_product_reference or '',
                'description': line.inl_description or '',
                'quantity': line.inl_quantity or 0,
                'unit': line.inl_unit or 'PCS',
                'unit_price': float(line.inl_unit_price or 0),
                'discount_percent': float(line.inl_discount_percent or 0),
                'vat_rate': float(line.inl_vat_rate or 0),
                'total_ht': float(line_total),
            })
        
        # Calculate totals
        total_ht = float(invoice.inv_total_ht or 0)
        total_vat = float(invoice.inv_total_vat or 0)
        total_ttc = float(invoice.inv_total_ttc or 0)
        
        # Build context
        context = {
            'invoice': {
                'id': invoice.inv_id,
                'reference': invoice.inv_reference,
                'date': invoice.inv_date,
                'due_date': invoice.inv_due_date,
                'status': status.sta_name if status else 'Unknown',
                'status_color': status.sta_color_hex if status else '#6B7280',
                'notes': getattr(invoice, 'inv_notes', ''),
                'payment_terms': getattr(invoice, 'inv_payment_terms', ''),
            },
            'client': {
                'name': client.cli_name if client else 'Unknown Client',
                'reference': client.cli_reference if client else '',
                'address': client.cli_address if client else '',
                'postal_code': client.cli_postal_code if client else '',
                'city': client.cli_city if client else '',
                'country': client.cli_country if client else '',
                'vat_number': getattr(client, 'cli_vat_number', '') if client else '',
                'email': client.cli_email if client else '',
                'phone': client.cli_phone if client else '',
            },
            'company': {
                'name': society.soc_name if society else 'ECOLED',
                'address': society.soc_address if society else '',
                'postal_code': society.soc_postal_code if society else '',
                'city': society.soc_city if society else '',
                'country': society.soc_country if society else '',
                'vat_number': society.soc_vat_number if society else '',
                'siret': society.soc_siret if society else '',
                'phone': society.soc_phone if society else '',
                'email': society.soc_email if society else '',
                'logo_url': society.soc_logo_url if society else '/static/logo.png',
            },
            'lines': line_items,
            'totals': {
                'total_ht': total_ht,
                'total_vat': total_vat,
                'total_ttc': total_ttc,
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
        from app.services.pdf_generator import InvoicePDFGenerator
        
        invoice = self._get_invoice_with_relations(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice with ID {invoice_id} not found")
        
        context = self._build_context(invoice)
        
        # Convert context to format expected by InvoicePDFGenerator
        invoice_data = {
            'reference': context['invoice']['reference'],
            'invoice_date': context['invoice']['date'],
            'due_date': context['invoice']['due_date'],
            'payment_terms': context['invoice'].get('payment_terms', 'Net 30 jours'),
            'order_reference': context['invoice'].get('order_reference', ''),
            'society': {
                'name': context['company']['name'],
                'address': context['company']['address'],
                'postal_code': context['company']['postal_code'],
                'city': context['company']['city'],
                'country': context['company']['country'],
                'vat_number': context['company']['vat_number'],
                'siret': context['company']['siret'],
            },
            'client': {
                'name': context['client']['name'],
                'address': context['client']['address'],
                'postal_code': context['client']['postal_code'],
                'city': context['client']['city'],
                'country': context['client']['country'],
                'vat_number': context['client']['vat_number'],
            },
            'lines': context['lines'],
            'total_ht': context['totals']['total_ht'],
            'total_vat': context['totals']['total_vat'],
            'total_ttc': context['totals']['total_ttc'],
        }
        
        # Use real PDF generator
        generator = InvoicePDFGenerator()
        pdf_content = generator.generate(invoice_data)
        
        logger.info(f"Generated PDF for invoice {invoice.inv_reference}")
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
        year = invoice.inv_date.year if invoice.inv_date else datetime.now().year
        filename = f"{invoice.inv_reference}.pdf"
        storage_path = f"{self.STORAGE_PREFIX}/{year}/{filename}"
        
        # Store PDF
        storage_url = storage_service.upload_file(
            file_content=pdf_content,
            file_path=storage_path,
            content_type='application/pdf',
            metadata={
                'invoice_id': str(invoice_id),
                'invoice_reference': invoice.inv_reference,
                'generated_at': datetime.now().isoformat(),
            }
        )
        
        logger.info(f"Stored PDF for invoice {invoice.inv_reference} at {storage_path}")
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
        
        year = invoice.inv_date.year if invoice.inv_date else datetime.now().year
        filename = f"{invoice.inv_reference}.pdf"
        storage_path = f"{self.STORAGE_PREFIX}/{year}/{filename}"
        
        if not storage_service.file_exists(storage_path):
            return None
        
        return storage_service.get_presigned_url(
            file_path=storage_path,
            expiration=expiration,
            response_content_type='application/pdf',
            response_content_disposition=f'attachment; filename="{filename}"'
        )
