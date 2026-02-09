"""
Supplier Order Payment Record Pydantic schemas for API request/response validation.

Schemas for TR_SPR_SupplierOrder_Payment_Record.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ==========================================================================
# Create / Update Schemas
# ==========================================================================

class SupplierPaymentCreate(BaseModel):
    """Schema for creating a supplier order payment record."""
    spr_amount: Decimal = Field(..., gt=0, description="Payment amount")
    spr_d_payment: Optional[datetime] = Field(None, description="Payment date")
    spr_comment: Optional[str] = Field(None, max_length=4000, description="Payment comment")
    sol_id: Optional[int] = Field(None, description="Supplier order line ID (optional line-level payment)")
    spr_payer: Optional[str] = Field(None, max_length=200, description="Payer name")
    spr_payment_code: Optional[str] = Field(None, max_length=200, description="Payment code/reference")
    spr_file: Optional[str] = Field(None, max_length=2000, description="Payment file/attachment path")


class SupplierPaymentUpdate(BaseModel):
    """Schema for updating a supplier order payment record."""
    spr_amount: Optional[Decimal] = Field(None, gt=0, description="Payment amount")
    spr_d_payment: Optional[datetime] = Field(None, description="Payment date")
    spr_comment: Optional[str] = Field(None, max_length=4000, description="Payment comment")
    sol_id: Optional[int] = Field(None, description="Supplier order line ID")
    spr_payer: Optional[str] = Field(None, max_length=200, description="Payer name")
    spr_payment_code: Optional[str] = Field(None, max_length=200, description="Payment code/reference")
    spr_file: Optional[str] = Field(None, max_length=2000, description="Payment file/attachment path")


# ==========================================================================
# Response Schemas
# ==========================================================================

class SupplierPaymentResponse(BaseModel):
    """Schema for supplier payment response - camelCase for frontend."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int = Field(..., validation_alias="spr_id", description="Payment record ID")
    orderId: Optional[int] = Field(None, validation_alias="sod_id", description="Supplier order ID")
    lineId: Optional[int] = Field(None, validation_alias="sol_id", description="Supplier order line ID")
    amount: Decimal = Field(..., validation_alias="spr_amount", description="Payment amount")
    paymentDate: datetime = Field(..., validation_alias="spr_d_payment", description="Payment date")
    comment: Optional[str] = Field(None, validation_alias="spr_comment", description="Payment comment")
    payer: Optional[str] = Field(None, validation_alias="spr_payer", description="Payer name")
    paymentCode: Optional[str] = Field(None, validation_alias="spr_payment_code", description="Payment code/reference")
    file: Optional[str] = Field(None, validation_alias="spr_file", description="Payment file/attachment path")
    guid: Optional[str] = Field(None, validation_alias="spr_guid", description="GUID")
    createdAt: datetime = Field(..., validation_alias="spr_d_creation", description="Creation timestamp")
    updatedAt: Optional[datetime] = Field(None, validation_alias="spr_d_update", description="Last update timestamp")
