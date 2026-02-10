"""
PDF Generator Service for Invoice Generation
Uses ReportLab for PDF creation
"""
from io import BytesIO
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
import logging

logger = logging.getLogger(__name__)


class InvoicePDFGenerator:
    """Generate PDF invoices with professional formatting"""
    
    def __init__(self):
        self.page_width, self.page_height = A4
        self.margin = 20 * mm
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='InvoiceTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=12,
            textColor=colors.HexColor('#1e3a5f'),
            alignment=TA_LEFT
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceBefore=12,
            spaceAfter=6,
            textColor=colors.HexColor('#1e3a5f'),
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CompanyName',
            parent=self.styles['Normal'],
            fontSize=14,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#1e3a5f')
        ))
        
        self.styles.add(ParagraphStyle(
            name='AddressText',
            parent=self.styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#333333')
        ))
        
        self.styles.add(ParagraphStyle(
            name='SmallText',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#666666')
        ))
        
        self.styles.add(ParagraphStyle(
            name='TotalLabel',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Bold',
            alignment=TA_RIGHT
        ))
        
        self.styles.add(ParagraphStyle(
            name='GrandTotal',
            parent=self.styles['Normal'],
            fontSize=14,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#1e3a5f'),
            alignment=TA_RIGHT
        ))
    
    def generate(self, invoice_data: Dict[str, Any]) -> bytes:
        """
        Generate PDF from invoice data
        
        Args:
            invoice_data: Dictionary containing invoice details
            
        Returns:
            PDF as bytes
        """
        buffer = BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=self.margin,
            leftMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin
        )
        
        elements = []
        
        # Build document sections
        elements.extend(self._build_header(invoice_data))
        elements.append(Spacer(1, 10 * mm))
        elements.extend(self._build_addresses(invoice_data))
        elements.append(Spacer(1, 10 * mm))
        elements.extend(self._build_invoice_info(invoice_data))
        elements.append(Spacer(1, 8 * mm))
        elements.extend(self._build_line_items(invoice_data))
        elements.append(Spacer(1, 5 * mm))
        elements.extend(self._build_totals(invoice_data))
        elements.append(Spacer(1, 10 * mm))
        elements.extend(self._build_payment_info(invoice_data))
        elements.extend(self._build_footer(invoice_data))
        
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def _build_header(self, data: Dict[str, Any]) -> List:
        """Build invoice header with logo and title"""
        elements = []
        
        # Invoice title
        title = Paragraph(f"FACTURE", self.styles['InvoiceTitle'])
        reference = Paragraph(
            f"<font size='14' color='#666666'>N° {data.get('reference', 'N/A')}</font>",
            self.styles['Normal']
        )
        
        # Header table (title on left, reference on right)
        header_data = [[title, reference]]
        header_table = Table(header_data, colWidths=[100 * mm, 70 * mm])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        elements.append(header_table)
        
        return elements
    
    def _build_addresses(self, data: Dict[str, Any]) -> List:
        """Build sender and recipient address blocks"""
        elements = []
        
        # Society (sender) info
        society = data.get('society', {})
        society_lines = [
            Paragraph(society.get('name', 'ECOLED'), self.styles['CompanyName']),
            Paragraph(society.get('address', ''), self.styles['AddressText']),
            Paragraph(
                f"{society.get('postal_code', '')} {society.get('city', '')}",
                self.styles['AddressText']
            ),
            Paragraph(society.get('country', 'France'), self.styles['AddressText']),
        ]
        
        if society.get('vat_number'):
            society_lines.append(Paragraph(
                f"TVA: {society.get('vat_number')}",
                self.styles['SmallText']
            ))
        
        if society.get('siret'):
            society_lines.append(Paragraph(
                f"SIRET: {society.get('siret')}",
                self.styles['SmallText']
            ))
        
        # Client (recipient) info
        client = data.get('client', {})
        client_lines = [
            Paragraph("FACTURER À:", self.styles['SectionHeader']),
            Paragraph(client.get('name', ''), self.styles['CompanyName']),
            Paragraph(client.get('address', ''), self.styles['AddressText']),
            Paragraph(
                f"{client.get('postal_code', '')} {client.get('city', '')}",
                self.styles['AddressText']
            ),
            Paragraph(client.get('country', ''), self.styles['AddressText']),
        ]
        
        if client.get('vat_number'):
            client_lines.append(Paragraph(
                f"TVA: {client.get('vat_number')}",
                self.styles['SmallText']
            ))
        
        # Create two-column layout
        sender_cell = society_lines
        recipient_cell = client_lines
        
        address_data = [[sender_cell, recipient_cell]]
        address_table = Table(address_data, colWidths=[85 * mm, 85 * mm])
        address_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        elements.append(address_table)
        
        return elements
    
    def _build_invoice_info(self, data: Dict[str, Any]) -> List:
        """Build invoice metadata section"""
        elements = []
        
        info_data = [
            ['Date de facture:', self._format_date(data.get('invoice_date'))],
            ['Date d\'échéance:', self._format_date(data.get('due_date'))],
            ['Conditions de paiement:', data.get('payment_terms', 'Net 30 jours')],
        ]
        
        if data.get('order_reference'):
            info_data.insert(0, ['Référence commande:', data.get('order_reference')])
        
        info_table = Table(info_data, colWidths=[50 * mm, 50 * mm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(info_table)
        
        return elements
    
    def _build_line_items(self, data: Dict[str, Any]) -> List:
        """Build invoice line items table"""
        elements = []
        
        elements.append(Paragraph("DÉTAIL DE LA FACTURE", self.styles['SectionHeader']))
        
        # Table header
        header = ['Description', 'Qté', 'Prix Unit. HT', 'TVA %', 'Total HT']
        
        # Table data
        table_data = [header]
        
        lines = data.get('lines', [])
        for line in lines:
            row = [
                Paragraph(line.get('description', ''), self.styles['Normal']),
                str(line.get('quantity', 0)),
                self._format_currency(line.get('unit_price', 0)),
                f"{line.get('vat_rate', 20)}%",
                self._format_currency(line.get('total_ht', 0))
            ]
            table_data.append(row)
        
        # Column widths
        col_widths = [80 * mm, 15 * mm, 30 * mm, 20 * mm, 25 * mm]
        
        items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        items_table.setStyle(TableStyle([
            # Header styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Body styling
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#1e3a5f')),
            
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ]))
        
        elements.append(items_table)
        
        return elements
    
    def _build_totals(self, data: Dict[str, Any]) -> List:
        """Build totals section"""
        elements = []
        
        total_ht = data.get('total_ht', 0)
        total_vat = data.get('total_vat', 0)
        total_ttc = data.get('total_ttc', 0)
        
        totals_data = [
            ['Total HT:', self._format_currency(total_ht)],
            ['TVA:', self._format_currency(total_vat)],
            ['', ''],  # Spacer row
            ['TOTAL TTC:', self._format_currency(total_ttc)],
        ]
        
        totals_table = Table(totals_data, colWidths=[120 * mm, 50 * mm])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 1), 10),
            ('TEXTCOLOR', (0, 0), (0, 1), colors.HexColor('#666666')),
            
            # Grand total styling
            ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 3), (-1, 3), 12),
            ('TEXTCOLOR', (0, 3), (-1, 3), colors.HexColor('#1e3a5f')),
            ('LINEABOVE', (0, 3), (-1, 3), 1, colors.HexColor('#1e3a5f')),
            ('TOPPADDING', (0, 3), (-1, 3), 8),
        ]))
        
        elements.append(totals_table)
        
        return elements
    
    def _build_payment_info(self, data: Dict[str, Any]) -> List:
        """Build payment information section"""
        elements = []
        
        elements.append(Paragraph("INFORMATIONS DE PAIEMENT", self.styles['SectionHeader']))
        
        society = data.get('society', {})
        bank_info = data.get('bank_info', {})
        
        payment_text = f"""
        <b>Mode de paiement:</b> {data.get('payment_mode', 'Virement bancaire')}<br/>
        <b>IBAN:</b> {bank_info.get('iban', 'FR76 XXXX XXXX XXXX XXXX XXXX XXX')}<br/>
        <b>BIC:</b> {bank_info.get('bic', 'XXXXXXXX')}<br/>
        <b>Banque:</b> {bank_info.get('bank_name', '')}
        """
        
        elements.append(Paragraph(payment_text, self.styles['AddressText']))
        
        return elements
    
    def _build_footer(self, data: Dict[str, Any]) -> List:
        """Build footer with legal mentions"""
        elements = []
        
        elements.append(Spacer(1, 15 * mm))
        
        footer_text = """
        <font size='7' color='#999999'>
        En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, 
        ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (Art. L441-6 du Code de Commerce).
        Pas d'escompte pour paiement anticipé.
        </font>
        """
        
        elements.append(Paragraph(footer_text, self.styles['Normal']))
        
        return elements
    
    def _format_currency(self, amount: Any) -> str:
        """Format amount as currency"""
        if amount is None:
            return "0,00 €"
        try:
            value = Decimal(str(amount))
            formatted = f"{value:,.2f}".replace(",", " ").replace(".", ",")
            return f"{formatted} €"
        except:
            return "0,00 €"
    
    def _format_date(self, date_value: Any) -> str:
        """Format date for display"""
        if date_value is None:
            return ""
        if isinstance(date_value, str):
            try:
                date_value = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
            except:
                return date_value
        if isinstance(date_value, datetime):
            return date_value.strftime("%d/%m/%Y")
        return str(date_value)


class QuotePDFGenerator(InvoicePDFGenerator):
    """Generate PDF quotes with professional formatting"""
    
    def _build_header(self, data: Dict[str, Any]) -> List:
        """Build quote header with title"""
        elements = []
        
        title = Paragraph("DEVIS", self.styles['InvoiceTitle'])
        reference = Paragraph(
            f"<font size='14' color='#666666'>N° {data.get('reference', 'N/A')}</font>",
            self.styles['Normal']
        )
        
        header_data = [[title, reference]]
        header_table = Table(header_data, colWidths=[100 * mm, 70 * mm])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        elements.append(header_table)
        return elements
    
    def _build_invoice_info(self, data: Dict[str, Any]) -> List:
        """Build quote metadata section"""
        elements = []
        
        info_data = [
            ['Date du devis:', self._format_date(data.get('quote_date') or data.get('invoice_date'))],
            ['Valide jusqu\'au:', self._format_date(data.get('valid_until'))],
        ]
        
        if data.get('order_reference'):
            info_data.insert(0, ['Référence:', data.get('order_reference')])
        
        info_table = Table(info_data, colWidths=[50 * mm, 50 * mm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(info_table)
        return elements
    
    def _build_footer(self, data: Dict[str, Any]) -> List:
        """Build footer with quote-specific mentions"""
        elements = []
        
        elements.append(Spacer(1, 15 * mm))
        
        footer_text = """
        <font size='7' color='#999999'>
        Ce devis est valable pour la durée indiquée ci-dessus. Passé ce délai, les prix peuvent être révisés.
        </font>
        """
        
        elements.append(Paragraph(footer_text, self.styles['Normal']))
        return elements


class OrderPDFGenerator(InvoicePDFGenerator):
    """Generate PDF orders with professional formatting"""
    
    def _build_header(self, data: Dict[str, Any]) -> List:
        """Build order header with title"""
        elements = []
        
        title = Paragraph("BON DE COMMANDE", self.styles['InvoiceTitle'])
        reference = Paragraph(
            f"<font size='14' color='#666666'>N° {data.get('reference', 'N/A')}</font>",
            self.styles['Normal']
        )
        
        header_data = [[title, reference]]
        header_table = Table(header_data, colWidths=[100 * mm, 70 * mm])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        elements.append(header_table)
        return elements
    
    def _build_invoice_info(self, data: Dict[str, Any]) -> List:
        """Build order metadata section"""
        elements = []
        
        info_data = [
            ['Date de commande:', self._format_date(data.get('order_date') or data.get('invoice_date'))],
            ['Date de livraison souhaitée:', self._format_date(data.get('required_date') or data.get('due_date'))],
        ]
        
        if data.get('quote_reference'):
            info_data.insert(0, ['Référence devis:', data.get('quote_reference')])
        
        info_table = Table(info_data, colWidths=[55 * mm, 50 * mm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(info_table)
        return elements
    
    def _build_footer(self, data: Dict[str, Any]) -> List:
        """Build footer with order-specific mentions"""
        elements = []
        
        elements.append(Spacer(1, 15 * mm))
        
        footer_text = """
        <font size='7' color='#999999'>
        Conditions générales de vente applicables. Merci pour votre commande.
        </font>
        """
        
        elements.append(Paragraph(footer_text, self.styles['Normal']))
        return elements


class DeliveryPDFGenerator(InvoicePDFGenerator):
    """Generate PDF delivery notes with professional formatting"""
    
    def _build_header(self, data: Dict[str, Any]) -> List:
        """Build delivery note header"""
        elements = []
        
        title = Paragraph("BON DE LIVRAISON", self.styles['InvoiceTitle'])
        reference = Paragraph(
            f"<font size='14' color='#666666'>N° {data.get('reference', 'N/A')}</font>",
            self.styles['Normal']
        )
        
        header_data = [[title, reference]]
        header_table = Table(header_data, colWidths=[100 * mm, 70 * mm])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        elements.append(header_table)
        return elements
    
    def _build_invoice_info(self, data: Dict[str, Any]) -> List:
        """Build delivery metadata section"""
        elements = []
        
        info_data = [
            ['Date de livraison:', self._format_date(data.get('delivery_date') or data.get('invoice_date'))],
        ]
        
        if data.get('order_reference'):
            info_data.insert(0, ['Réf. commande:', data.get('order_reference')])
        
        info_table = Table(info_data, colWidths=[50 * mm, 50 * mm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(info_table)
        return elements
    
    def _build_line_items(self, data: Dict[str, Any]) -> List:
        """Build delivery line items table (simpler, without prices)"""
        elements = []
        
        elements.append(Paragraph("ARTICLES LIVRÉS", self.styles['SectionHeader']))
        
        # Table header - delivery notes don't show prices
        header = ['Description', 'Qté', 'Unité']
        
        # Table data
        table_data = [header]
        
        lines = data.get('lines', [])
        for line in lines:
            row = [
                Paragraph(line.get('description', ''), self.styles['Normal']),
                str(line.get('quantity', 0)),
                line.get('unit', 'PCS'),
            ]
            table_data.append(row)
        
        # Column widths
        col_widths = [120 * mm, 25 * mm, 25 * mm]
        
        items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        items_table.setStyle(TableStyle([
            # Header styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Body styling
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#1e3a5f')),
            
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ]))
        
        elements.append(items_table)
        return elements
    
    def _build_totals(self, data: Dict[str, Any]) -> List:
        """No totals for delivery notes, but add signature area"""
        elements = []
        
        elements.append(Spacer(1, 20 * mm))
        
        # Signature area
        sig_data = [
            ['Signature du destinataire:', ''],
            ['', ''],
            ['Date de réception:', '____/____/________'],
        ]
        
        sig_table = Table(sig_data, colWidths=[60 * mm, 80 * mm])
        sig_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ]))
        
        elements.append(sig_table)
        return elements
    
    def _build_payment_info(self, data: Dict[str, Any]) -> List:
        """No payment info for delivery notes"""
        return []
    
    def _build_footer(self, data: Dict[str, Any]) -> List:
        """Build footer for delivery note"""
        elements = []
        
        elements.append(Spacer(1, 10 * mm))
        
        footer_text = """
        <font size='7' color='#999999'>
        Veuillez vérifier la conformité des marchandises à réception. Toute réclamation doit être 
        formulée dans les 48 heures suivant la livraison.
        </font>
        """
        
        elements.append(Paragraph(footer_text, self.styles['Normal']))
        return elements
