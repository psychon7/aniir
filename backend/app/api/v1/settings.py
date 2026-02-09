"""
Settings API Router.

Provides REST API endpoints for:
- Enterprise/Society settings management
- Company information CRUD
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Path

from app.services.society_service import (
    SocietyService,
    get_society_service,
    SocietyServiceError,
    SocietyNotFoundError,
)
from app.schemas.society import SocietySettingsResponse, SocietyUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_society_error(error: SocietyServiceError) -> HTTPException:
    """Convert SocietyServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, SocietyNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        }
    )


# ==========================================================================
# Enterprise Settings Endpoints
# ==========================================================================

@router.get(
    "/enterprise",
    response_model=SocietySettingsResponse,
    summary="Get enterprise settings",
    description="""
    Get the default enterprise (society) settings.

    Returns the first active society as the enterprise configuration.
    """
)
async def get_enterprise_settings(
    service: SocietyService = Depends(get_society_service)
):
    """Get the default enterprise settings."""
    society = await service.get_default_society()
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "NO_ENTERPRISE_CONFIGURED",
                    "message": "No active enterprise (society) found",
                    "details": {}
                }
            }
        )
    return society


@router.put(
    "/enterprise/{soc_id}",
    response_model=SocietySettingsResponse,
    summary="Update enterprise settings",
    description="Update the enterprise (society) settings."
)
async def update_enterprise_settings(
    soc_id: int = Path(..., gt=0, description="Society ID"),
    data: SocietyUpdate = ...,
    service: SocietyService = Depends(get_society_service)
):
    """Update enterprise settings."""
    try:
        society = await service.update_society(soc_id, data)
        return society
    except SocietyServiceError as e:
        raise handle_society_error(e)


@router.get(
    "/societies",
    response_model=List[SocietySettingsResponse],
    summary="List all societies",
    description="Get a list of all societies (legal entities)."
)
async def list_societies(
    service: SocietyService = Depends(get_society_service)
):
    """List all societies."""
    societies = await service.get_all_societies()
    return societies


@router.get(
    "/societies/{soc_id}",
    response_model=SocietySettingsResponse,
    summary="Get society by ID",
    description="Get detailed information about a specific society."
)
async def get_society(
    soc_id: int = Path(..., gt=0, description="Society ID"),
    service: SocietyService = Depends(get_society_service)
):
    """Get a specific society by ID."""
    try:
        society = await service.get_society(soc_id)
        return society
    except SocietyServiceError as e:
        raise handle_society_error(e)
