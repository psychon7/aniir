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
    supplier_orders,
    supplier_invoices,
    products,
    brands,  # ENABLED: Wave 4 Brands
    quotes,
    orders,
    invoices,
    deliveries,
    payments,  # ENABLED: Wave 2 Payment Recording
    # accounting,
    currencies,
    # landed_cost,
    warehouse,  # ENABLED: Wave 1 Quick Win
    logistics,  # ENABLED: Wave 1 Quick Win
    projects,
    drive,  # ENABLED: Wave 1 Quick Win
    lookups,
    lookup,  # Frontend alias for lookups (singular /lookup/)
    # x3_export,
    purchase_intents,
    tasks,  # ENABLED: Wave 3 Calendar/Tasks
    product_attributes,  # ENABLED: Wave 3 Product Attributes
)

# =============================================================================
# Import routers from api/v1/endpoints/*.py (additional endpoints)
# =============================================================================
from app.api.v1.endpoints import (
    chat,  # ENABLED: Wave 1 Quick Win
    health,
    i18n,
    email,  # ENABLED: Wave 1 Quick Win
    email_logs,  # ENABLED: Wave 1 Quick Win
    pdf,
    pdf_status,
    invoice_pdf,
    import_data,  # ENABLED: Wave 4 Data Import
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
api_router.include_router(product_attributes.router)  # ENABLED: Wave 3 Product Attributes
api_router.include_router(brands.router)  # ENABLED: Wave 4 Brands

# -----------------------------------------------------------------------------
# Sales & Orders
# -----------------------------------------------------------------------------
api_router.include_router(quotes.router)
api_router.include_router(orders.router)
api_router.include_router(invoices.router)
api_router.include_router(deliveries.router)

# -----------------------------------------------------------------------------
# Purchasing
# -----------------------------------------------------------------------------
api_router.include_router(purchase_intents.router)
api_router.include_router(supplier_orders.router)
api_router.include_router(supplier_invoices.router)

# -----------------------------------------------------------------------------
# Finance & Accounting
# -----------------------------------------------------------------------------
# api_router.include_router(accounting.router)
api_router.include_router(payments.router)  # ENABLED: Wave 2 Payment Recording
api_router.include_router(currencies.router)
# api_router.include_router(landed_cost.router)

# -----------------------------------------------------------------------------
# Operations & Warehouse
# -----------------------------------------------------------------------------
api_router.include_router(warehouse.router)  # ENABLED: Wave 1 Quick Win
api_router.include_router(logistics.router)  # ENABLED: Wave 1 Quick Win
api_router.include_router(projects.router)

# -----------------------------------------------------------------------------
# Communication & Files
# -----------------------------------------------------------------------------
api_router.include_router(chat.router)  # ENABLED: Wave 1 Quick Win
api_router.include_router(drive.router)  # ENABLED: Wave 1 Quick Win
# api_router.include_router(attachments.router)

# -----------------------------------------------------------------------------
# Calendar & Tasks
# -----------------------------------------------------------------------------
api_router.include_router(tasks.router)  # ENABLED: Wave 3 Calendar/Tasks

# -----------------------------------------------------------------------------
# System & Utilities
# -----------------------------------------------------------------------------
api_router.include_router(lookups.router)
api_router.include_router(lookup.router)  # Frontend alias (singular /lookup/)
api_router.include_router(health.router)
api_router.include_router(i18n.router)
api_router.include_router(email.router)  # ENABLED: Wave 1 Quick Win
api_router.include_router(email_logs.router)  # ENABLED: Wave 1 Quick Win
api_router.include_router(import_data.router)  # ENABLED: Wave 4 Data Import

# -----------------------------------------------------------------------------
# PDF Generation
# -----------------------------------------------------------------------------
api_router.include_router(pdf.router, prefix="/pdf", tags=["PDF Generation"])
api_router.include_router(pdf_status.router, prefix="/pdf-status", tags=["PDF Status"])
api_router.include_router(invoice_pdf.router, prefix="/invoice-pdf", tags=["Invoice PDF"])

# -----------------------------------------------------------------------------
# Integrations (DISABLED)
# -----------------------------------------------------------------------------
# api_router.include_router(integrations_router)
# api_router.include_router(x3_export.router)
