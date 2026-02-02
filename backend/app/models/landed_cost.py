"""
Landed Cost models for supply lot costing.

WARNING: These models are DISABLED because tables TM_LOT_SupplyLot, TM_LOT_SupplyLotItem,
TM_FRC_FreightCost, TM_LCL_LandedCostLog, TR_LCP_LandedCostProfile, TR_LCC_LandedCostComponent,
TM_PLC_ProductLandedCost, and TM_LCH_LandedCostHistory do NOT exist in the actual database.
They were fictional tables created during development without database access.

If landed cost functionality is needed, actual database tables must be created first,
or these models must be mapped to existing tables (if any).

Disabled on: 2026-02-01
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum


# Keep enums for any code that imports them
class AllocationStrategy(str, Enum):
    """Cost allocation strategy options."""
    WEIGHT = "WEIGHT"
    VOLUME = "VOLUME"
    VALUE = "VALUE"
    MIXED = "MIXED"


class LotStatus(str, Enum):
    """Supply lot status options."""
    DRAFT = "DRAFT"
    IN_TRANSIT = "IN_TRANSIT"
    ARRIVED = "ARRIVED"
    CLEARED = "CLEARED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class FreightCostType(str, Enum):
    """Type of freight cost."""
    FREIGHT = "FREIGHT"
    CUSTOMS = "CUSTOMS"
    INSURANCE = "INSURANCE"
    LOCAL = "LOCAL"
    HANDLING = "HANDLING"
    OTHER = "OTHER"


# These models are DISABLED - see module docstring
# No actual TM_LOT_* or TM_FRC_* tables exist in the database


# Placeholder classes for import compatibility (will cause runtime errors if used)
class SupplyLot:
    """DISABLED: No database table exists (TM_LOT_SupplyLot). This is a placeholder."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("SupplyLot model (landed_cost.py) is disabled - no database table exists")


class SupplyLotItem:
    """DISABLED: No database table exists (TM_LOT_SupplyLotItem). This is a placeholder."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("SupplyLotItem model is disabled - no database table exists")


class FreightCost:
    """DISABLED: No database table exists (TM_FRC_FreightCost). This is a placeholder."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("FreightCost model is disabled - no database table exists")


class LandedCostAllocationLog:
    """DISABLED: No database table exists (TM_LCL_LandedCostLog). This is a placeholder."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("LandedCostAllocationLog model is disabled - no database table exists")


class LandedCostProfile:
    """DISABLED: No database table exists (TR_LCP_LandedCostProfile). This is a placeholder."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("LandedCostProfile model is disabled - no database table exists")


class LandedCostComponent:
    """DISABLED: No database table exists (TR_LCC_LandedCostComponent). This is a placeholder."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("LandedCostComponent model is disabled - no database table exists")


class ProductLandedCost:
    """DISABLED: No database table exists (TM_PLC_ProductLandedCost). This is a placeholder."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("ProductLandedCost model is disabled - no database table exists")


class LandedCostHistory:
    """DISABLED: No database table exists (TM_LCH_LandedCostHistory). This is a placeholder."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("LandedCostHistory model is disabled - no database table exists")


# Original model code removed - see git history
# All TM_LOT_*, TM_FRC_*, TM_LCL_*, TR_LCP_*, TR_LCC_*, TM_PLC_*, TM_LCH_* tables were fictional
