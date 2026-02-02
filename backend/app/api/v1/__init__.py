"""
API v1 router aggregation.

All API routes are registered here and mounted under /api/v1 prefix.
"""
from fastapi import APIRouter

# =============================================================================
# Import routers from api/v1/*.py (main routers)
# =============================================================================
from app.api.v1 import (
    auth,
    users,
    clients,
    # client_types,
    suppliers,
    products,
    quotes,
    orders,
    invoices,
    deliveries,
    # accounting,
    currencies,
    # landed_cost,
    # warehouse,
    # logistics,
    projects,
    # drive,
    lookups,
    lookup,  # Frontend alias for lookups (singular /lookup/)
    # x3_export,
)

# =============================================================================
# Import routers from api/v1/endpoints/*.py (additional endpoints)
# =============================================================================
from app.api.v1.endpoints import (
    # chat,
    health,
    i18n,
    # email,
    # email_logs,
    # pdf,
    # pdf_status,
    # invoice_pdf,
    # invoice_status,
    # attachments,
)

# =============================================================================
# Import integration routers (DISABLED for now)
# =============================================================================
# from app.api.v1.integrations import integrations_router

# =============================================================================
# Create main API router
# =============================================================================
api_router = APIRouter(prefix="/api/v1")

# -----------------------------------------------------------------------------
# Authentication & Users
# -----------------------------------------------------------------------------
api_router.include_router(auth.router)
api_router.include_router(users.router)

# -----------------------------------------------------------------------------
# Core Business Entities
# -----------------------------------------------------------------------------
api_router.include_router(clients.router)
# api_router.include_router(client_types.router)
api_router.include_router(suppliers.router)
api_router.include_router(products.router)

# -----------------------------------------------------------------------------
# Sales & Orders
# -----------------------------------------------------------------------------
api_router.include_router(quotes.router)
api_router.include_router(orders.router)
api_router.include_router(invoices.router)
api_router.include_router(deliveries.router)

# -----------------------------------------------------------------------------
# Finance & Accounting
# -----------------------------------------------------------------------------
# api_router.include_router(accounting.router)
api_router.include_router(currencies.router)
# api_router.include_router(landed_cost.router)

# -----------------------------------------------------------------------------
# Operations & Warehouse
# -----------------------------------------------------------------------------
# api_router.include_router(warehouse.router)
# api_router.include_router(logistics.router)
api_router.include_router(projects.router)

# -----------------------------------------------------------------------------
# Communication & Files
# -----------------------------------------------------------------------------
# api_router.include_router(chat.router)
# api_router.include_router(drive.router)
# api_router.include_router(attachments.router)

# -----------------------------------------------------------------------------
# System & Utilities
# -----------------------------------------------------------------------------
api_router.include_router(lookups.router)
api_router.include_router(lookup.router)  # Frontend alias (singular /lookup/)
api_router.include_router(health.router)
api_router.include_router(i18n.router)
# api_router.include_router(email.router)
# api_router.include_router(email_logs.router)

# -----------------------------------------------------------------------------
# PDF Generation (DISABLED)
# -----------------------------------------------------------------------------
# api_router.include_router(pdf.router)
# api_router.include_router(pdf_status.router)
# api_router.include_router(invoice_pdf.router)
# api_router.include_router(invoice_status.router)

# -----------------------------------------------------------------------------
# Integrations (DISABLED)
# -----------------------------------------------------------------------------
# api_router.include_router(integrations_router)
# api_router.include_router(x3_export.router)
