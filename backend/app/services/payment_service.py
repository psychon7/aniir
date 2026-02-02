"""
Payment service - Business logic for payment operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
from typing import Optional
from decimal import Decimal
from fastapi import Depends

from app.database import get_db
from app.models.payment import Payment
from app.models.payment_mode import PaymentMode
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from fastapi import HTTPException, status


class PaymentService:
    """Service class for payment business logic"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_payment_reference(self) -> str:
        """
        Generate payment reference: PAY-0001, PAY-0002, etc.
        """
        last_payment = self.db.query(Payment).order_by(desc(Payment.pay_id)).first()
        
        if last_payment and last_payment.pay_reference:
            try:
                # Extract number from reference like PAY-0001
                last_num = int(last_payment.pay_reference.split('-')[1])
                next_num = last_num + 1
            except (IndexError, ValueError):
                next_num = 1
        else:
            next_num = 1
        
        return f"PAY-{next_num:04d}"
    
    def validate_payment_mode(self, mode_id: int) -> None:
        """Validate that payment mode exists and is active"""
        mode = self.db.query(PaymentMode).filter(
            PaymentMode.Id == mode_id,
            PaymentMode.IsActive == True
        ).first()
        
        if not mode:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment mode with ID {mode_id} not found or inactive"
            )
    
    def validate_payment_data(self, data: PaymentCreate) -> None:
        """
        Validate payment data based on payment type
        """
        if data.pay_type == "CLIENT":
            if not data.pay_client_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Client ID is required for CLIENT payment type"
                )
            if data.pay_supplier_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Supplier ID should not be provided for CLIENT payment type"
                )
        elif data.pay_type == "SUPPLIER":
            if not data.pay_supplier_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Supplier ID is required for SUPPLIER payment type"
                )
            if data.pay_client_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Client ID should not be provided for SUPPLIER payment type"
                )
        
        # Validate payment mode
        self.validate_payment_mode(data.pay_mode_id)
    
    def create_payment(
        self, 
        data: PaymentCreate, 
        created_by: Optional[int] = None
    ) -> Payment:
        """
        Create a new payment record
        
        Args:
            data: Payment creation data
            created_by: User ID who created the payment
            
        Returns:
            Created Payment object
        """
        # Validate payment data
        self.validate_payment_data(data)
        
        # Generate reference
        reference = self.generate_payment_reference()
        
        # Create payment object
        payment = Payment(
            pay_reference=reference,
            pay_client_id=data.pay_client_id,
            pay_supplier_id=data.pay_supplier_id,
            pay_invoice_id=data.pay_invoice_id,
            pay_supplier_invoice_id=data.pay_supplier_invoice_id,
            pay_mode_id=data.pay_mode_id,
            pay_society_id=data.pay_society_id,
            pay_currency_id=data.pay_currency_id,
            pay_amount=data.pay_amount,
            pay_date=data.pay_date,
            pay_bank_reference=data.pay_bank_reference,
            pay_notes=data.pay_notes,
            pay_type=data.pay_type,
            pay_created_at=datetime.utcnow(),
            pay_created_by=created_by
        )
        
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        
        return payment
    
    def get_payment_by_id(self, payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        return self.db.query(Payment).filter(Payment.pay_id == payment_id).first()
    
    def get_payment_by_reference(self, reference: str) -> Optional[Payment]:
        """Get payment by reference"""
        return self.db.query(Payment).filter(Payment.pay_reference == reference).first()
    
    def list_payments(
        self,
        page: int = 1,
        page_size: int = 20,
        client_id: Optional[int] = None,
        supplier_id: Optional[int] = None,
        payment_type: Optional[str] = None,
        society_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> tuple[list[Payment], int]:
        """
        List payments with filtering and pagination
        
        Returns:
            Tuple of (payments list, total count)
        """
        query = self.db.query(Payment)
        
        # Apply filters
        if client_id:
            query = query.filter(Payment.pay_client_id == client_id)
        if supplier_id:
            query = query.filter(Payment.pay_supplier_id == supplier_id)
        if payment_type:
            query = query.filter(Payment.pay_type == payment_type)
        if society_id:
            query = query.filter(Payment.pay_society_id == society_id)
        if date_from:
            query = query.filter(Payment.pay_date >= date_from)
        if date_to:
            query = query.filter(Payment.pay_date <= date_to)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        payments = query.order_by(desc(Payment.pay_date)).offset(offset).limit(page_size).all()
        
        return payments, total


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    """Factory function to create PaymentService instance"""
    return PaymentService(db)
