"""
Accounting module endpoints.
"""
from fastapi import APIRouter
from .payments import router as payments_router

router = APIRouter()
router.include_router(payments_router)
