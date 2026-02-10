"""
Pydantic schemas for Client Activity Feed.
Aggregates quotes, orders, deliveries, invoices, and payments into a unified timeline.
"""
from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ActivityItem(BaseModel):
    """Single activity item in the client timeline."""
    id: int = Field(..., description="Entity primary key")
    entityType: Literal["quote", "order", "delivery", "invoice", "payment"] = Field(
        ..., description="Type of the entity"
    )
    reference: Optional[str] = Field(None, description="Document reference number")
    date: datetime = Field(..., description="Date of the activity")
    amount: Optional[float] = Field(None, description="Amount (HT) if applicable")
    status: Optional[str] = Field(None, description="Current status/state")
    description: Optional[str] = Field(None, description="Short description")


class ActivityResponse(BaseModel):
    """Paginated response for client activity feed."""
    success: bool = True
    data: List[ActivityItem] = Field(default_factory=list)
    totalCount: int = 0
    page: int = 1
    pageSize: int = 20
    hasMore: bool = False
