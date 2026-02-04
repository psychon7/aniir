"""
UI-focused Invoice schemas aligned to frontend expectations.

Maps to TM_CIN_Client_Invoice and TM_CII_ClientInvoice_Line.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class InvoiceLineUI(BaseModel):
    id: int
    invoiceId: int
    productId: Optional[int] = None
    productReference: Optional[str] = None
    productName: Optional[str] = None
    description: Optional[str] = None
    quantity: Decimal = Decimal("0")
    unitPrice: Decimal = Decimal("0")
    vatRate: Optional[Decimal] = None
    lineTotal: Decimal = Decimal("0")
    discountPercent: Optional[Decimal] = None
    discountAmount: Optional[Decimal] = None


class InvoiceDetailUI(BaseModel):
    id: int
    reference: str
    clientId: int
    clientName: Optional[str] = None
    orderId: Optional[int] = None
    orderReference: Optional[str] = None

    invoiceDate: Optional[datetime] = None
    dueDate: Optional[datetime] = None

    statusName: Optional[str] = None
    currencyId: Optional[int] = None
    currency: Optional[str] = None

    subtotal: Decimal = Decimal("0")
    vatAmount: Decimal = Decimal("0")
    totalAmount: Decimal = Decimal("0")
    paidAmount: Decimal = Decimal("0")

    paidAt: Optional[datetime] = None
    paymentReference: Optional[str] = None

    lines: List[InvoiceLineUI] = Field(default_factory=list)


class InvoiceListItemUI(BaseModel):
    id: int
    reference: str
    clientId: Optional[int] = None
    clientName: Optional[str] = None
    invoiceDate: Optional[datetime] = None
    dueDate: Optional[datetime] = None
    totalAmount: Decimal = Decimal("0")
    paidAmount: Decimal = Decimal("0")
    currency: Optional[str] = None
    statusName: Optional[str] = None


class InvoiceListPaginatedUI(BaseModel):
    success: bool = True
    data: List[InvoiceListItemUI] = Field(default_factory=list)
    page: int = 1
    pageSize: int = 20
    totalCount: int = 0
    totalPages: int = 0
    hasNextPage: bool = False
    hasPreviousPage: bool = False
