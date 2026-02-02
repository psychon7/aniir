"""
Repository for ClientInvoice database operations
"""
from datetime import datetime
from typing import Optional, List, Tuple
from decimal import Decimal

from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, selectinload, joinedload

# Use the correct model from invoice.py, not the legacy one
from app.models.invoice import ClientInvoice
from app.models.client_invoice_line import ClientInvoiceLine
from app.models.status import Status


class ClientInvoiceRepository:
    """Repository for ClientInvoice CRUD operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, invoice_id: int) -> Optional[ClientInvoice]:
        """Get invoice by ID with all relationships loaded"""
        stmt = (
            select(ClientInvoice)
            .options(
                selectinload(ClientInvoice.lines),
                joinedload(ClientInvoice.client),
                joinedload(ClientInvoice.society),
                joinedload(ClientInvoice.status),
                joinedload(ClientInvoice.currency),
                joinedload(ClientInvoice.payment_term),
                joinedload(ClientInvoice.payment_mode),
            )
            .where(ClientInvoice.inv_id == invoice_id)
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    def get_by_reference(self, reference: str) -> Optional[ClientInvoice]:
        """Get invoice by reference"""
        stmt = (
            select(ClientInvoice)
            .options(selectinload(ClientInvoice.lines))
            .where(ClientInvoice.inv_reference == reference)
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    def get_list(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        client_id: Optional[int] = None,
        society_id: Optional[int] = None,
        status_id: Optional[int] = None,
        is_paid: Optional[bool] = None,
        is_overdue: Optional[bool] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[ClientInvoice], int]:
        """
        Get paginated list of invoices with filters
        
        Returns:
            Tuple of (invoices, total_count)
        """
        # Base query
        stmt = (
            select(ClientInvoice)
            .options(
                joinedload(ClientInvoice.client),
                joinedload(ClientInvoice.status),
                joinedload(ClientInvoice.currency),
            )
            .where(ClientInvoice.inv_is_active == True)
        )
        
        # Apply filters
        if client_id:
            stmt = stmt.where(ClientInvoice.inv_client_id == client_id)
        
        if society_id:
            stmt = stmt.where(ClientInvoice.inv_society_id == society_id)
        
        if status_id:
            stmt = stmt.where(ClientInvoice.inv_status_id == status_id)
        
        if is_paid is not None:
            if is_paid:
                stmt = stmt.where(ClientInvoice.inv_balance_due <= Decimal("0.00"))
            else:
                stmt = stmt.where(ClientInvoice.inv_balance_due > Decimal("0.00"))
        
        if is_overdue:
            stmt = stmt.where(
                and_(
                    ClientInvoice.inv_balance_due > Decimal("0.00"),
                    ClientInvoice.inv_due_date < datetime.utcnow()
                )
            )
        
        if date_from:
            stmt = stmt.where(ClientInvoice.inv_date >= date_from)
        
        if date_to:
            stmt = stmt.where(ClientInvoice.inv_date <= date_to)
        
        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    ClientInvoice.inv_reference.ilike(search_pattern),
                    ClientInvoice.inv_client_name.ilike(search_pattern),
                )
            )
        
        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0
        
        # Apply pagination and ordering
        stmt = stmt.order_by(ClientInvoice.inv_date.desc(), ClientInvoice.inv_id.desc())
        stmt = stmt.offset(skip).limit(limit)
        
        result = self.db.execute(stmt)
        invoices = list(result.scalars().all())
        
        return invoices, total
    
    def create(self, invoice: ClientInvoice) -> ClientInvoice:
        """Create a new invoice"""
        self.db.add(invoice)
        self.db.flush()
        return invoice
    
    def update(self, invoice: ClientInvoice) -> ClientInvoice:
        """Update an existing invoice"""
        self.db.add(invoice)
        self.db.flush()
        return invoice
    
    def update_pdf_info(
        self,
        invoice_id: int,
        pdf_url: str,
        pdf_generated_at: Optional[datetime] = None
    ) -> Optional[ClientInvoice]:
        """
        Update PDF-related fields on an invoice
        
        Args:
            invoice_id: The invoice ID
            pdf_url: URL to the generated PDF
            pdf_generated_at: Timestamp of PDF generation (defaults to now)
        
        Returns:
            Updated invoice or None if not found
        """
        invoice = self.get_by_id(invoice_id)
        if not invoice:
            return None
        
        invoice.inv_pdf_url = pdf_url
        invoice.inv_pdf_generated_at = pdf_generated_at or datetime.utcnow()
        invoice.inv_updated_at = datetime.utcnow()
        
        self.db.add(invoice)
        self.db.flush()
        
        return invoice
    
    def delete(self, invoice_id: int) -> bool:
        """Soft delete an invoice"""
        invoice = self.get_by_id(invoice_id)
        if not invoice:
            return False
        
        invoice.inv_is_active = False
        invoice.inv_updated_at = datetime.utcnow()
        self.db.add(invoice)
        self.db.flush()
        
        return True
    
    def generate_reference(self, society_id: int, year: Optional[int] = None) -> str:
        """
        Generate next invoice reference for a society/year
        
        Format: INV-{YEAR}-{SEQUENCE:04d}
        Example: INV-2024-0001, INV-2024-0002
        
        Resets sequence each year.
        """
        if year is None:
            year = datetime.utcnow().year
        
        prefix = f"INV-{year}"
        
        # Find last invoice with this prefix for this society
        stmt = (
            select(ClientInvoice.inv_reference)
            .where(
                and_(
                    ClientInvoice.inv_reference.like(f"{prefix}%"),
                    ClientInvoice.inv_society_id == society_id
                )
            )
            .order_by(ClientInvoice.inv_id.desc())
            .limit(1)
        )
        
        result = self.db.execute(stmt)
        last_ref = result.scalar_one_or_none()
        
        next_num = 1
        if last_ref:
            try:
                # Extract number from INV-2024-0001 -> 0001 -> 1
                num_part = last_ref.split('-')[-1]
                next_num = int(num_part) + 1
            except (ValueError, IndexError):
                pass
        
        return f"{prefix}-{next_num:04d}"
    
    def get_invoices_without_pdf(
        self,
        limit: int = 100
    ) -> List[ClientInvoice]:
        """Get invoices that don't have a PDF generated yet"""
        stmt = (
            select(ClientInvoice)
            .where(
                and_(
                    ClientInvoice.inv_is_active == True,
                    or_(
                        ClientInvoice.inv_pdf_url.is_(None),
                        ClientInvoice.inv_pdf_url == ""
                    )
                )
            )
            .order_by(ClientInvoice.inv_date.desc())
            .limit(limit)
        )
        
        result = self.db.execute(stmt)
        return list(result.scalars().all())
