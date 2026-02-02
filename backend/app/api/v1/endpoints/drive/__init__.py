"""
Drive module API endpoints
"""
from fastapi import APIRouter

from .files import router as files_router
from .folders import router as folders_router

router = APIRouter()

router.include_router(files_router, prefix="/files", tags=["drive-files"])
router.include_router(folders_router, prefix="/folders", tags=["drive-folders"])
