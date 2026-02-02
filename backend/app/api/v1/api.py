"""
API v1 router aggregation.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    clients,
    products,
    orders,
    invoices,
    landed_cost,  # Add this import
    # ... other endpoints
)

api_router = APIRouter()

# ... existing routes ...

api_router.include_router(
    landed_cost.router,
    prefix="/landed-cost",
    tags=["Landed Cost"]
)
