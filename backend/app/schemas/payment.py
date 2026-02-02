"""
Payment Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


class PaymentModeResponse(BaseModel):
    """Payment mode response schema"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(alias="Id")
    code: str = Field(alias="Code")
    name: str = Field(alias="Name")
    is_active: bool = Field(alias="IsActive")


class PaymentBase(BaseModel):
    """Base payment schema with common fields"""
    pay_client_id: Optional[int] = Field(None, description="Client ID for client payments")
    pay_supplier_id: Optional[int] = Field(None, description="Supplier ID for supplier payments")
    pay_invoice_id: Optional[int] = Field(None, description="Client invoice ID")
    pay_supplier_invoice_id: Optional[int] = Field(None, description="Supplier invoice ID")
    pay_mode_id: int = Field(..., description="Payment mode ID")
    pay_society_id: int = Field(..., description="Society ID")
    pay_currency_id: int = Field(..., description="Currency ID")
    pay_amount: Decimal = Field(..., gt=0, description="Payment amount (must be positive)")
    pay_date: datetime = Field(..., description="Payment date")
    pay_bank_reference: Optional[str] = Field(None, max_length=100, description="Bank reference")
    pay_notes: Optional[str] = Field(None, description="Payment notes")
    pay_type: str = Field("CLIENT", pattern="^(CLIENT|SUPPLIER)$", description="Payment type")
    
    @field_validator('pay_type')
    @classmethod
    def validate_payment_type(cls, v: str) -> str:
        if v not in ('CLIENT', 'SUPPLIER'):
            raise ValueError('pay_type must be either CLIENT or SUPPLIER')
        return v


class PaymentCreate(PaymentBase):
    """Schema for creating a new payment"""
    
    @field_validator('pay_client_id', 'pay_supplier_id')
    @classmethod
    def validate_entity_id(cls, v, info):
        # Validation will be done in service layer based on pay_type
        return v


class PaymentUpdate(BaseModel):
    """Schema for updating a payment"""
    pay_mode_id: Optional[int] = None
    pay_amount: Optional[Decimal] = Field(None, gt=0)
    pay_date: Optional[datetime] = None
    pay_bank_reference: Optional[str] = Field(None, max_length=100)
    pay_notes: Optional[str] = None


class PaymentResponse(BaseModel):
    """Payment response schema"""
    model_config = ConfigDict(from_attributes=True)
    
    pay_id: int
    pay_reference: str
    pay_client_id: Optional[int] = None
    pay_supplier_id: Optional[int] = None
    pay_invoice_id: Optional[int] = None
    pay_supplier_invoice_id: Optional[int] = None
    pay_mode_id: int
    pay_society_id: int
    pay_currency_id: int
    pay_amount: Decimal
    pay_date: datetime
    pay_bank_reference: Optional[str] = None
    pay_notes: Optional[str] = None
    pay_type: str
    pay_created_at: datetime
    pay_created_by: Optional[int] = None
    pay_updated_at: Optional[datetime] = None
    pay_updated_by: Optional[int] = None
    
    # Nested objects (optional, populated when joined)
    payment_mode: Optional[PaymentModeResponse] = None


class PaymentListResponse(BaseModel):
    """Paginated payment list response"""
    items: list[PaymentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
