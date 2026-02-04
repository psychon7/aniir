"""
UI-focused Quote schemas aligned to frontend expectations.

These map to TM_CPL_Cost_Plan (quotes) and TM_CLN_CostPlan_Lines (lines),
but expose camelCase fields used by the React UI.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class QuoteLineUI(BaseModel):
    """Quote line item for UI."""
    id: int
    productId: Optional[int] = None
    productReference: Optional[str] = None
    productName: Optional[str] = None
    description: Optional[str] = None
    quantity: Decimal = Field(default=Decimal("0"))
    unitPrice: Decimal = Field(default=Decimal("0"))
    lineTotal: Decimal = Field(default=Decimal("0"))
    vatRate: Optional[Decimal] = None
    discountAmount: Optional[Decimal] = None
    discountPercent: Optional[Decimal] = None


class QuoteDetailUI(BaseModel):
    """Quote detail response for UI."""
    id: int
    reference: str
    name: Optional[str] = None

    clientId: int
    clientName: Optional[str] = None
    clientReference: Optional[str] = None

    projectId: Optional[int] = None
    projectCode: Optional[str] = None
    projectName: Optional[str] = None

    quoteDate: datetime
    validUntil: datetime

    statusId: Optional[int] = None
    statusName: Optional[str] = None

    currencyId: Optional[int] = None
    currency: Optional[str] = None

    subtotal: Decimal = Field(default=Decimal("0"))
    taxAmount: Decimal = Field(default=Decimal("0"))
    totalAmount: Decimal = Field(default=Decimal("0"))
    discountAmount: Optional[Decimal] = None

    lines: List[QuoteLineUI] = Field(default_factory=list)


class QuoteListItemUI(BaseModel):
    """Quote list item for UI tables."""
    id: int
    reference: str
    clientName: Optional[str] = None
    quoteDate: datetime
    validUntil: datetime
    statusId: Optional[int] = None
    statusName: Optional[str] = None
    totalAmount: Decimal = Field(default=Decimal("0"))


class QuoteListPaginatedUI(BaseModel):
    """Paginated response for quotes list (matches frontend PagedResponse)."""
    success: bool = True
    data: List[QuoteListItemUI] = Field(default_factory=list)
    page: int = 1
    pageSize: int = 20
    totalCount: int = 0
    totalPages: int = 0
    hasNextPage: bool = False
    hasPreviousPage: bool = False


class QuoteSummaryUI(BaseModel):
    """Quote summary totals for UI."""
    subtotal: Decimal = Field(default=Decimal("0"))
    taxAmount: Decimal = Field(default=Decimal("0"))
    totalAmount: Decimal = Field(default=Decimal("0"))
    discountAmount: Optional[Decimal] = None
