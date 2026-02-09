"""
Lookup API Router (Singular - alias for lookups).

This router provides the /lookup/ endpoints that the frontend expects.
It serves as an alias/redirect layer to the main /lookups/ endpoints.

Frontend calls:
- /lookup/client-types → maps to /lookups/client-types
- /lookup/client-statuses → maps to /lookups/statuses?entity_type=Client
- /lookup/countries → maps to internal countries list
- etc.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, text

from app.database import get_db
from app.services.lookup_service import (
    LookupService,
    get_lookup_service,
    LookupServiceError,
    LookupNotFoundError
)
from app.models.country import Country
from app.models.language import Language
from app.models.society import Society
from app.models.business_unit import BusinessUnit

router = APIRouter(prefix="/lookup", tags=["Lookup (Frontend Alias)"])


# ==========================================================================
# Response Wrapper
# ==========================================================================

def wrap_response(data):
    """Wrap data in the format frontend expects: { success: true, data: [...] }"""
    return {"success": True, "data": data}


def handle_error(error: LookupServiceError) -> HTTPException:
    """Convert LookupServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST
    if isinstance(error, LookupNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    return HTTPException(
        status_code=status_code,
        detail={"success": False, "error": {"code": error.code, "message": error.message}}
    )


# ==========================================================================
# Countries (Frontend expects this)
# ==========================================================================

@router.get("/countries", summary="Get countries for dropdown")
async def get_countries(
    db: Session = Depends(get_db)
):
    """Get countries - frontend alias endpoint."""
    try:
        result = db.execute(select(Country).order_by(Country.ctr_name).limit(300))
        countries = result.scalars().all()
        return wrap_response([{"id": c.ctr_id, "name": c.ctr_name} for c in countries])
    except Exception as e:
        return wrap_response([])  # Return empty on error


# ==========================================================================
# Currencies
# ==========================================================================

@router.get("/currencies", summary="Get currencies for dropdown")
async def get_currencies(
    service: LookupService = Depends(get_lookup_service)
):
    """Get currencies - frontend alias endpoint."""
    try:
        currencies = await service.get_currencies()
        return wrap_response([{"id": c.cur_id, "name": c.cur_designation} for c in currencies])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Client Types
# ==========================================================================

@router.get("/client-types", summary="Get client types for dropdown")
async def get_client_types(
    service: LookupService = Depends(get_lookup_service)
):
    """Get client types - frontend alias endpoint."""
    try:
        client_types = await service.get_client_types()
        return wrap_response([{"id": ct.cty_id, "name": ct.cty_description} for ct in client_types])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Client Statuses (mapped from generic statuses)
# ==========================================================================

@router.get("/client-statuses", summary="Get client statuses for dropdown")
async def get_client_statuses(
    service: LookupService = Depends(get_lookup_service)
):
    """Get client statuses - frontend alias endpoint."""
    try:
        statuses = await service.get_statuses(entity_type="Client")
        return wrap_response([{"id": s.stt_id, "name": s.stt_value} for s in statuses])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Order Statuses
# ==========================================================================

@router.get("/order-statuses", summary="Get order statuses for dropdown")
async def get_order_statuses(
    service: LookupService = Depends(get_lookup_service)
):
    """Get order statuses - frontend alias endpoint."""
    try:
        statuses = await service.get_statuses(entity_type="Order")
        return wrap_response([{"id": s.stt_id, "name": s.stt_value} for s in statuses])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Invoice Statuses
# ==========================================================================

@router.get("/invoice-statuses", summary="Get invoice statuses for dropdown")
async def get_invoice_statuses(
    service: LookupService = Depends(get_lookup_service)
):
    """Get invoice statuses - frontend alias endpoint."""
    try:
        statuses = await service.get_statuses(entity_type="Invoice")
        return wrap_response([{"id": s.stt_id, "name": s.stt_value} for s in statuses])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Payment Statuses
# ==========================================================================

@router.get("/payment-statuses", summary="Get payment statuses for dropdown")
async def get_payment_statuses(
    service: LookupService = Depends(get_lookup_service)
):
    """Get payment statuses - frontend alias endpoint."""
    try:
        statuses = await service.get_statuses(entity_type="Payment")
        return wrap_response([{"id": s.stt_id, "name": s.stt_value} for s in statuses])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Payment Modes
# ==========================================================================

@router.get("/payment-modes", summary="Get payment modes for dropdown")
async def get_payment_modes(
    service: LookupService = Depends(get_lookup_service)
):
    """Get payment modes - frontend alias endpoint."""
    try:
        payment_modes = await service.get_payment_modes()
        return wrap_response([{"id": pm.pmo_id, "name": pm.pmo_designation} for pm in payment_modes])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Payment Terms
# ==========================================================================

@router.get("/payment-terms", summary="Get payment terms for dropdown")
async def get_payment_terms(
    service: LookupService = Depends(get_lookup_service)
):
    """Get payment terms - frontend alias endpoint."""
    try:
        payment_terms = await service.get_payment_terms()
        return wrap_response([{"id": pt.pco_id, "name": pt.pco_designation} for pt in payment_terms])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# VAT Rates
# ==========================================================================

@router.get("/vat-rates", summary="Get VAT rates for dropdown")
async def get_vat_rates(
    service: LookupService = Depends(get_lookup_service)
):
    """Get VAT rates - frontend alias endpoint."""
    try:
        vat_rates = await service.get_vat_rates()
        return wrap_response([{"id": v.vat_id, "name": v.vat_designation} for v in vat_rates])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Units of Measure
# ==========================================================================

@router.get("/units-of-measure", summary="Get units of measure for dropdown")
async def get_units_of_measure(
    service: LookupService = Depends(get_lookup_service)
):
    """Get units of measure - frontend alias endpoint."""
    try:
        uoms = await service.get_units_of_measure()
        return wrap_response([{"id": u.uom_id, "name": u.uom_name, "code": u.uom_code} for u in uoms])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Categories
# ==========================================================================

@router.get("/categories", summary="Get product categories for dropdown")
async def get_categories(
    service: LookupService = Depends(get_lookup_service)
):
    """Get product categories - frontend alias endpoint."""
    try:
        categories = await service.get_categories()
        return wrap_response([{"id": c.cat_id, "name": c.cat_name} for c in categories])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Business Units
# ==========================================================================

@router.get("/business-units", summary="Get business units for dropdown")
async def get_business_units(
    db: Session = Depends(get_db)
):
    """Get business units - frontend alias endpoint."""
    try:
        result = db.execute(
            select(BusinessUnit)
            .where(BusinessUnit.bu_is_active == True)
            .order_by(BusinessUnit.bu_name)
            .limit(100)
        )
        bus = result.scalars().all()
        return wrap_response([{"id": bu.bu_id, "name": bu.bu_name, "code": bu.bu_code, "color": bu.bu_color} for bu in bus])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Languages
# ==========================================================================

@router.get("/languages", summary="Get languages for dropdown")
async def get_languages(
    db: Session = Depends(get_db)
):
    """Get languages - frontend alias endpoint."""
    try:
        result = db.execute(select(Language).order_by(Language.lng_name).limit(100))
        langs = result.scalars().all()
        return wrap_response([{"id": l.lng_id, "name": l.lng_name} for l in langs])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Societies
# ==========================================================================

@router.get("/societies", summary="Get societies for dropdown")
async def get_societies(
    db: Session = Depends(get_db)
):
    """Get societies - frontend alias endpoint."""
    try:
        result = db.execute(select(Society).order_by(Society.soc_name).limit(100))
        socs = result.scalars().all()
        return wrap_response([{"id": s.soc_id, "name": s.soc_name} for s in socs])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Warehouses
# ==========================================================================

@router.get("/warehouses", summary="Get warehouses for dropdown")
async def get_warehouses(
    service: LookupService = Depends(get_lookup_service)
):
    """Get warehouses - frontend alias endpoint."""
    try:
        warehouses = await service.get_warehouses()
        return wrap_response([{"id": w.whs_id, "name": w.whs_name} for w in warehouses])
    except Exception as e:
        return wrap_response([])


# ==========================================================================
# Carriers
# ==========================================================================

@router.get("/carriers", summary="Get carriers for dropdown")
async def get_carriers(
    db: Session = Depends(get_db)
):
    """Get carriers - frontend alias endpoint."""
    # Carriers table may not exist, return empty
    return wrap_response([])


@router.get("/carriers/active", summary="Get active carriers for dropdown")
async def get_active_carriers(
    db: Session = Depends(get_db)
):
    """Get active carriers - frontend alias endpoint."""
    return wrap_response([])


# ==========================================================================
# Supplier Types
# ==========================================================================

@router.get("/supplier-types", summary="Get supplier types for dropdown")
async def get_supplier_types(
    db: Session = Depends(get_db)
):
    """Get supplier types - frontend alias endpoint."""
    # Supplier types may not exist, return empty
    return wrap_response([])


# ==========================================================================
# All Lookups (Aggregated)
# ==========================================================================

@router.get("/all", summary="Get all lookups in one request")
async def get_all_lookups(
    db: Session = Depends(get_db),
    service: LookupService = Depends(get_lookup_service)
):
    """Get all lookups for initial app loading - frontend alias endpoint."""
    try:
        # Get data from service where available
        currencies = await service.get_currencies()
        statuses = await service.get_statuses()
        categories = await service.get_categories()
        client_types = await service.get_client_types()
        vat_rates = await service.get_vat_rates()
        payment_modes = await service.get_payment_modes()
        payment_terms = await service.get_payment_terms()
        warehouses = await service.get_warehouses()
        
        # Direct DB queries for others
        countries_result = db.execute(select(Country).order_by(Country.ctr_name).limit(300))
        countries = countries_result.scalars().all()
        
        languages_result = db.execute(select(Language).order_by(Language.lng_name).limit(100))
        languages = languages_result.scalars().all()
        
        societies_result = db.execute(select(Society).order_by(Society.soc_name).limit(100))
        societies = societies_result.scalars().all()
        
        bus_result = db.execute(select(BusinessUnit).where(BusinessUnit.bu_is_active == True).order_by(BusinessUnit.bu_name).limit(100))
        business_units = bus_result.scalars().all()
        
        return wrap_response({
            "countries": [{"id": c.ctr_id, "name": c.ctr_name} for c in countries],
            "currencies": [{"id": c.cur_id, "name": c.cur_designation} for c in currencies],
            "vatRates": [{"id": v.vat_id, "name": v.vat_designation} for v in vat_rates],
            "paymentModes": [{"id": pm.pmo_id, "name": pm.pmo_designation} for pm in payment_modes],
            "paymentTerms": [{"id": pt.pco_id, "name": pt.pco_designation} for pt in payment_terms],
            "clientTypes": [{"id": ct.cty_id, "name": ct.cty_description} for ct in client_types],
            "clientStatuses": [{"id": s.stt_id, "name": s.stt_value} for s in statuses if getattr(s, 'stt_tab_name', None) == "Client" or getattr(s, 'stt_tab_name', None) is None],
            "businessUnits": [{"id": bu.bu_id, "name": bu.bu_name, "code": bu.bu_code, "color": bu.bu_color} for bu in business_units],
            "languages": [{"id": l.lng_id, "name": l.lng_name} for l in languages],
            "societies": [{"id": s.soc_id, "name": s.soc_name} for s in societies],
            "productCategories": [{"id": c.cat_id, "name": c.cat_name} for c in categories],
            "orderStatuses": [{"id": s.stt_id, "name": s.stt_value} for s in statuses if getattr(s, 'stt_tab_name', None) == "Order"],
            "invoiceStatuses": [{"id": s.stt_id, "name": s.stt_value} for s in statuses if getattr(s, 'stt_tab_name', None) == "Invoice"],
            "unitsOfMeasure": [{"id": u.uom_id, "name": u.uom_name, "code": u.uom_code} for u in await service.get_units_of_measure()],
            "warehouses": [{"id": w.whs_id, "name": w.whs_name} for w in warehouses],
        })
    except Exception as e:
        # Return empty structure on error
        return wrap_response({
            "countries": [], "currencies": [], "vatRates": [], "paymentModes": [],
            "paymentTerms": [], "clientTypes": [], "clientStatuses": [],
            "businessUnits": [], "languages": [], "societies": [],
            "productCategories": [], "orderStatuses": [], "invoiceStatuses": [],
            "unitsOfMeasure": [], "warehouses": []
        })
