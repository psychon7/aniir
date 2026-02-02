"""
API v1 router aggregating all endpoint routers.
"""
from fastapi import APIRouter

# Import all endpoint routers from the v1 directory
from app.api.v1 import (
    auth,
    users,
    clients,
    suppliers,
    products,
    orders,
    quotes,
    invoices,
    deliveries,
    projects,
    currencies,
    client_types,
    lookups,
    warehouse,
    drive,
    accounting,
    logistics,
    landed_cost,
    x3_export,
)

# Import from endpoints subdirectory
from app.api.v1.endpoints import (
    chat,
    health,
    email_logs,
)

api_router = APIRouter(prefix="/api/v1")

# Core authentication and user management
api_router.include_router(auth.router)
api_router.include_router(users.router)

# Entity management (CRM)
api_router.include_router(clients.router)
api_router.include_router(suppliers.router)
api_router.include_router(client_types.router)

# Product catalog
api_router.include_router(products.router)

# Sales workflow
api_router.include_router(quotes.router)
api_router.include_router(orders.router)
api_router.include_router(invoices.router)
api_router.include_router(deliveries.router)
api_router.include_router(projects.router)

# Reference data
api_router.include_router(currencies.router)
api_router.include_router(lookups.router)

# Operations
api_router.include_router(warehouse.router)
api_router.include_router(logistics.router)
api_router.include_router(landed_cost.router)
api_router.include_router(accounting.router)

# File management
api_router.include_router(drive.router)

# Integrations
api_router.include_router(x3_export.router)

# Utility endpoints
api_router.include_router(chat.router)
api_router.include_router(health.router)
api_router.include_router(email_logs.router)
