"""
Payment schemas aligned to legacy tables:
- TM_CPY_ClientInvoice_Payment (client invoice payments)
- TR_SPR_SupplierOrder_Payment_Record (supplier order payment records)
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict, field_validator


class PaymentType(str, Enum):
    CLIENT = "CLIENT"
    SUPPLIER = "SUPPLIER"


class PaymentCreate(BaseModel):
    """
    Create payment request.

    Accepts frontend payload fields; unused fields are allowed for compatibility.
    """

    paymentType: PaymentType = PaymentType.CLIENT

    clientId: Optional[int] = None
    supplierId: Optional[int] = None
    invoiceId: Optional[int] = None
    supplierOrderId: Optional[int] = None
    supplierOrderLineId: Optional[int] = None

    amount: Decimal = Field(..., gt=0)
    paymentDate: datetime

    notes: Optional[str] = None
    paymentCode: Optional[str] = None
    filePath: Optional[str] = None
    guid: Optional[str] = None

    # Extra fields from UI forms (ignored by backend mapping)
    currencyId: Optional[int] = None
    paymentModeId: Optional[int] = None
    statusId: Optional[int] = None
    businessUnitId: Optional[int] = None
    societyId: Optional[int] = None
    bankAccount: Optional[str] = None
    bankReference: Optional[str] = None
    checkNumber: Optional[str] = None
    transactionId: Optional[str] = None

    model_config = ConfigDict(extra="allow")

    @field_validator("paymentType")
    @classmethod
    def validate_payment_type(cls, value: PaymentType) -> PaymentType:
        if value not in (PaymentType.CLIENT, PaymentType.SUPPLIER):
            raise ValueError("paymentType must be CLIENT or SUPPLIER")
        return value


class PaymentUpdate(BaseModel):
    paymentType: Optional[PaymentType] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    paymentDate: Optional[datetime] = None
    notes: Optional[str] = None
    paymentCode: Optional[str] = None
    filePath: Optional[str] = None
    guid: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class PaymentResponse(BaseModel):
    """Unified payment response for UI consumption."""

    id: int
    reference: str
    paymentType: PaymentType

    clientId: Optional[int] = None
    clientName: Optional[str] = None
    supplierId: Optional[int] = None
    supplierName: Optional[str] = None

    invoiceId: Optional[int] = None
    invoiceReference: Optional[str] = None
    supplierOrderId: Optional[int] = None
    supplierOrderReference: Optional[str] = None

    amount: Decimal
    currencyId: Optional[int] = None
    currencyCode: Optional[str] = None

    paymentDate: datetime
    paymentModeId: Optional[int] = None
    paymentModeName: Optional[str] = None

    statusId: Optional[int] = None
    statusName: Optional[str] = None
    businessUnitId: Optional[int] = None
    businessUnitName: Optional[str] = None

    societyId: Optional[int] = None
    societyName: Optional[str] = None

    bankAccount: Optional[str] = None
    bankReference: Optional[str] = None
    checkNumber: Optional[str] = None
    transactionId: Optional[str] = None

    notes: Optional[str] = None

    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    createdBy: Optional[str] = None
    isReconciled: bool = False


class PaymentAPIResponse(BaseModel):
    success: bool = True
    data: PaymentResponse


class PaymentListPaginatedResponse(BaseModel):
    success: bool = True
    data: List[PaymentResponse]
    page: int
    pageSize: int
    totalCount: int
    totalPages: int
    hasNextPage: bool
    hasPreviousPage: bool
