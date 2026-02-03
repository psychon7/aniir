"""
Lookups API Router.

Provides REST API endpoints for accessing all reference/lookup data
used in dropdowns, selections, and initial data loading across the ERP system.

This unified endpoint consolidates access to:
- Currencies
- Statuses (with entity type filtering)
- Categories (with hierarchical support)
- Client Types
- Units of Measure
- VAT Rates
- Payment Modes
- Payment Terms
- Warehouses
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.services.lookup_service import (
    LookupService,
    get_lookup_service,
    LookupServiceError,
    LookupNotFoundError
)
from app.schemas.lookup import (
    CurrencyLookup,
    StatusLookup,
    CategoryLookup,
    CategoryTreeLookup,
    ClientTypeLookup,
    UnitOfMeasureLookup,
    VatRateLookup,
    PaymentModeLookup,
    PaymentTermLookup,
    WarehouseLookup,
    ActivityLookup,
    CivilityLookup,
    AllLookupsResponse
)

router = APIRouter(prefix="/lookups", tags=["Lookups"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_lookup_error(error: LookupServiceError) -> HTTPException:
    """Convert LookupServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, LookupNotFoundError):
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
# Aggregated Lookups Endpoint
# ==========================================================================

@router.get(
    "",
    response_model=AllLookupsResponse,
    summary="Get all lookup data",
    description="""
    Get all lookup/reference data in a single call.

    This endpoint is useful for initial application loading to minimize
    the number of API calls required. Returns all active lookup data by default.

    Use individual endpoints for more granular control or filtering.
    """
)
async def get_all_lookups(
    active_only: bool = Query(True, description="Only return active items"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get all lookup data for initial application loading."""
    try:
        data = await service.get_all_lookups(active_only=active_only)
        return AllLookupsResponse(
            success=True,
            currencies=[CurrencyLookup.model_validate(c) for c in data["currencies"]],
            statuses=[StatusLookup.model_validate(s) for s in data["statuses"]],
            categories=[CategoryLookup.model_validate(c) for c in data["categories"]],
            client_types=[ClientTypeLookup.model_validate(ct) for ct in data["client_types"]],
            units_of_measure=[UnitOfMeasureLookup.model_validate(u) for u in data["units_of_measure"]],
            vat_rates=[VatRateLookup.model_validate(v) for v in data["vat_rates"]],
            payment_modes=[PaymentModeLookup.model_validate(pm) for pm in data["payment_modes"]],
            payment_terms=[PaymentTermLookup.model_validate(pt) for pt in data["payment_terms"]],
            warehouses=[WarehouseLookup.model_validate(w) for w in data["warehouses"]],
            activities=[ActivityLookup.model_validate(a) for a in data["activities"]],
            civilities=[CivilityLookup.model_validate(c) for c in data["civilities"]]
        )
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Currency Endpoints
# ==========================================================================

@router.get(
    "/currencies",
    response_model=List[CurrencyLookup],
    summary="Get currency lookups",
    description="""
    Get currencies for dropdown/selection.

    Returns currency code, symbol, and display name.
    """
)
async def get_currencies(
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get currencies for lookup."""
    try:
        currencies = await service.get_currencies(search=search, limit=limit)
        return [CurrencyLookup.model_validate(c) for c in currencies]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Status Endpoints
# ==========================================================================

@router.get(
    "/statuses",
    response_model=List[StatusLookup],
    summary="Get status lookups",
    description="""
    Get statuses for dropdown/selection.

    Can filter by entity type (Client, Order, Invoice, Quote, CostPlan).
    When entity_type is specified, returns both entity-specific and
    generic (NULL entity_type) statuses.

    Includes badge color for UI display.
    """
)
async def get_statuses(
    entity_type: Optional[str] = Query(
        None,
        description="Entity type filter (Client, Order, Invoice, Quote, CostPlan)"
    ),
    active_only: bool = Query(True, description="Only return active statuses"),
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get statuses for lookup."""
    try:
        statuses = await service.get_statuses(
            entity_type=entity_type,
            active_only=active_only,
            search=search,
            limit=limit
        )
        return [StatusLookup.model_validate(s) for s in statuses]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Category Endpoints
# ==========================================================================

@router.get(
    "/categories",
    response_model=List[CategoryLookup],
    summary="Get category lookups",
    description="""
    Get categories for dropdown/selection.

    Supports filtering by parent (for hierarchical navigation) or
    getting only root categories.
    """
)
async def get_categories(
    parent_id: Optional[int] = Query(None, description="Parent category ID to get children"),
    root_only: bool = Query(False, description="Only return root/top-level categories"),
    active_only: bool = Query(True, description="Only return active categories"),
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get categories for lookup."""
    try:
        categories = await service.get_categories(
            parent_id=parent_id,
            root_only=root_only,
            active_only=active_only,
            search=search,
            limit=limit
        )
        return [CategoryLookup.model_validate(c) for c in categories]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


@router.get(
    "/categories/tree",
    response_model=List[dict],
    summary="Get category tree",
    description="""
    Get categories as a hierarchical tree structure.

    Returns nested category data suitable for tree view components.
    Each category includes its children recursively.
    """
)
async def get_category_tree(
    active_only: bool = Query(True, description="Only return active categories"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get categories as hierarchical tree."""
    try:
        return await service.get_category_tree(active_only=active_only)
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Client Type Endpoints
# ==========================================================================

@router.get(
    "/client-types",
    response_model=List[ClientTypeLookup],
    summary="Get client type lookups",
    description="""
    Get client types for dropdown/selection.

    Client types categorize clients (e.g., Client, Prospect, Delegataire).
    """
)
async def get_client_types(
    active_only: bool = Query(True, description="Only return active client types"),
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get client types for lookup."""
    try:
        client_types = await service.get_client_types(
            active_only=active_only,
            search=search,
            limit=limit
        )
        return [ClientTypeLookup.model_validate(ct) for ct in client_types]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Unit of Measure Endpoints
# ==========================================================================

@router.get(
    "/units-of-measure",
    response_model=List[UnitOfMeasureLookup],
    summary="Get unit of measure lookups",
    description="""
    Get units of measure for dropdown/selection.

    UOMs are used for products, inventory, and order quantities
    (e.g., Piece, Kilogram, Meter, Liter).
    """
)
async def get_units_of_measure(
    active_only: bool = Query(True, description="Only return active UOMs"),
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get units of measure for lookup."""
    try:
        uoms = await service.get_units_of_measure(
            active_only=active_only,
            search=search,
            limit=limit
        )
        return [UnitOfMeasureLookup.model_validate(u) for u in uoms]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# VAT Rate Endpoints
# ==========================================================================

@router.get(
    "/vat-rates",
    response_model=List[VatRateLookup],
    summary="Get VAT rate lookups",
    description="""
    Get VAT rates for dropdown/selection.

    Returns tax rates with percentages for invoicing and pricing.
    """
)
async def get_vat_rates(
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get VAT rates for lookup."""
    try:
        vat_rates = await service.get_vat_rates(search=search, limit=limit)
        return [VatRateLookup.model_validate(v) for v in vat_rates]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Payment Mode Endpoints
# ==========================================================================

@router.get(
    "/payment-modes",
    response_model=List[PaymentModeLookup],
    summary="Get payment mode lookups",
    description="""
    Get payment modes for dropdown/selection.

    Payment modes define how clients pay or are paid
    (e.g., Bank Transfer, Cheque, Cash, Card).
    """
)
async def get_payment_modes(
    active_only: bool = Query(True, description="Only return active payment modes"),
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get payment modes for lookup."""
    try:
        payment_modes = await service.get_payment_modes(
            active_only=active_only,
            search=search,
            limit=limit
        )
        return [PaymentModeLookup.model_validate(pm) for pm in payment_modes]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Payment Term Endpoints
# ==========================================================================

@router.get(
    "/payment-terms",
    response_model=List[PaymentTermLookup],
    summary="Get payment term lookups",
    description="""
    Get payment terms for dropdown/selection.

    Payment terms define when payment is due after invoice date
    (e.g., Net 30, Net 45, 30 days end of month).
    """
)
async def get_payment_terms(
    active_only: bool = Query(True, description="Only return active payment terms"),
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get payment terms for lookup."""
    try:
        payment_terms = await service.get_payment_terms(
            active_only=active_only,
            search=search,
            limit=limit
        )
        return [PaymentTermLookup.model_validate(pt) for pt in payment_terms]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Warehouse Endpoints
# ==========================================================================

@router.get(
    "/warehouses",
    response_model=List[WarehouseLookup],
    summary="Get warehouse lookups",
    description="""
    Get warehouses for dropdown/selection.

    Returns warehouse locations for inventory management.
    Default warehouse appears first in the list.
    """
)
async def get_warehouses(
    active_only: bool = Query(True, description="Only return active warehouses"),
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get warehouses for lookup."""
    try:
        warehouses = await service.get_warehouses(
            active_only=active_only,
            search=search,
            limit=limit
        )
        return [WarehouseLookup.model_validate(w) for w in warehouses]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Activity Endpoints
# ==========================================================================

@router.get(
    "/activities",
    response_model=List[ActivityLookup],
    summary="Get activity lookups",
    description="""
    Get activities for dropdown/selection.

    Activities categorize business sectors or types
    (e.g., Manufacturing, Services, Retail).
    Used for categorizing clients and other entities.
    """
)
async def get_activities(
    active_only: bool = Query(True, description="Only return active activities"),
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get activities for lookup."""
    try:
        activities = await service.get_activities(
            active_only=active_only,
            search=search,
            limit=limit
        )
        return [ActivityLookup.model_validate(a) for a in activities]
    except LookupServiceError as e:
        raise handle_lookup_error(e)


# ==========================================================================
# Civility Endpoints
# ==========================================================================

@router.get(
    "/civilities",
    response_model=List[CivilityLookup],
    summary="Get civility lookups",
    description="""
    Get civilities for dropdown/selection.

    Civilities are formal titles used for addressing people
    (e.g., Mr., Ms., Dr., Prof.).
    Used for contacts and users.
    """
)
async def get_civilities(
    active_only: bool = Query(True, description="Only return active civilities"),
    search: Optional[str] = Query(None, description="Search term for filtering"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: LookupService = Depends(get_lookup_service)
):
    """Get civilities for lookup."""
    try:
        civilities = await service.get_civilities(
            active_only=active_only,
            search=search,
            limit=limit
        )
        return [CivilityLookup.model_validate(c) for c in civilities]
    except LookupServiceError as e:
        raise handle_lookup_error(e)
