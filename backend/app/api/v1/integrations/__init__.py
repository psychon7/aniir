# Integrations API Module
"""
API routers for external system integrations (Sage X3, Shopify, etc.)
"""
from fastapi import APIRouter

from app.api.v1.integrations.x3_export import router as x3_export_router
from app.api.v1.integrations.shopify import router as shopify_router
from app.api.v1.integrations.shopify_oauth import router as shopify_oauth_router
from app.api.v1.integrations.shopify_webhooks import router as shopify_webhooks_router

integrations_router = APIRouter(prefix="/integrations", tags=["Integrations"])

# Include integration routers
integrations_router.include_router(x3_export_router)
integrations_router.include_router(shopify_router)
integrations_router.include_router(shopify_oauth_router)
integrations_router.include_router(shopify_webhooks_router)

__all__ = ["integrations_router"]
