"""
UI-focused Delivery schemas aligned to frontend expectations.

Maps to TM_DFO_Delivery_Form and TM_DFL_DevlieryForm_Line.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class DeliveryLineUI(BaseModel):
    id: int
    deliveryId: int
    productId: Optional[int] = None
    productName: Optional[str] = None
    productReference: Optional[str] = None
    orderedQuantity: Optional[Decimal] = None
    deliveredQuantity: Optional[Decimal] = None


class DeliveryDetailUI(BaseModel):
    id: int
    reference: str
    orderId: Optional[int] = None
    orderReference: Optional[str] = None
    clientId: int
    clientName: Optional[str] = None

    scheduledDate: Optional[datetime] = None
    deliveryDate: Optional[datetime] = None

    isDelivered: bool = False
    isShipped: bool = False
    statusName: Optional[str] = None

    carrierName: Optional[str] = None
    trackingNumber: Optional[str] = None
    weight: Optional[Decimal] = None
    packages: Optional[int] = None

    shippingAddress: Optional[str] = None
    deliveryAddress: Optional[str] = None
    deliveryCity: Optional[str] = None
    deliveryPostcode: Optional[str] = None
    deliveryCountry: Optional[str] = None

    createdAt: Optional[datetime] = None
    shippedAt: Optional[datetime] = None
    deliveredAt: Optional[datetime] = None

    lines: List[DeliveryLineUI] = Field(default_factory=list)


class DeliveryListItemUI(BaseModel):
    id: int
    reference: str
    orderReference: Optional[str] = None
    clientName: Optional[str] = None
    expectedDeliveryDate: Optional[datetime] = None
    deliveryDate: Optional[datetime] = None
    deliveryAddress: Optional[str] = None
    statusName: Optional[str] = None
    isDelivered: bool = False
    isShipped: bool = False


class DeliveryListPaginatedUI(BaseModel):
    success: bool = True
    data: List[DeliveryListItemUI] = Field(default_factory=list)
    page: int = 1
    pageSize: int = 20
    totalCount: int = 0
    totalPages: int = 0
    hasNextPage: bool = False
    hasPreviousPage: bool = False
