"""
UI-focused Order schemas aligned to frontend expectations.

Maps to TM_COD_Client_Order and TM_COL_ClientOrder_Lines.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class OrderLineUI(BaseModel):
    id: int
    orderId: int
    productId: Optional[int] = None
    productReference: Optional[str] = None
    productName: Optional[str] = None
    description: Optional[str] = None
    quantity: Decimal = Field(default=Decimal("0"))
    deliveredQuantity: Decimal = Field(default=Decimal("0"))
    unitPrice: Decimal = Field(default=Decimal("0"))
    lineTotal: Decimal = Field(default=Decimal("0"))


class OrderDetailUI(BaseModel):
    id: int
    reference: str
    clientId: int
    clientName: Optional[str] = None
    clientReference: Optional[str] = None

    orderDate: datetime
    requiredDate: Optional[datetime] = None
    expectedDeliveryDate: Optional[datetime] = None

    quoteReference: Optional[str] = None

    statusName: Optional[str] = None
    paymentStatusName: Optional[str] = None

    currency: Optional[str] = None

    subtotal: Decimal = Field(default=Decimal("0"))
    taxAmount: Decimal = Field(default=Decimal("0"))
    totalAmount: Decimal = Field(default=Decimal("0"))
    discountAmount: Optional[Decimal] = None
    paidAmount: Decimal = Field(default=Decimal("0"))

    lines: List[OrderLineUI] = Field(default_factory=list)


class OrderListItemUI(BaseModel):
    id: int
    reference: str
    clientName: Optional[str] = None
    orderDate: datetime
    expectedDeliveryDate: Optional[datetime] = None
    totalAmount: Decimal = Field(default=Decimal("0"))
    currencyCode: Optional[str] = None
    statusName: Optional[str] = None


class OrderListPaginatedUI(BaseModel):
    success: bool = True
    data: List[OrderListItemUI] = Field(default_factory=list)
    page: int = 1
    pageSize: int = 20
    totalCount: int = 0
    totalPages: int = 0
    hasNextPage: bool = False
    hasPreviousPage: bool = False
