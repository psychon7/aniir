"""
Supply Lot SQLAlchemy Models

WARNING: These models are DISABLED because tables TM_SUP_SupplyLot, TM_SUP_SupplyLotLine,
and TM_SUP_SupplyLotCost do NOT exist in the actual database. They were fictional tables
created during development without database access.

If supply lot functionality is needed, actual database tables must be created first,
or these models must be mapped to existing tables (if any).

Disabled on: 2026-02-01
"""

# These models are DISABLED - see module docstring
# No actual TM_SUP_SupplyLot, TM_SUP_SupplyLotLine, or TM_SUP_SupplyLotCost tables exist


# Placeholder classes for import compatibility (will cause runtime errors if used)
class SupplyLot:
    """DISABLED: No database table exists. This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("SupplyLot model is disabled - no database table exists")


class SupplyLotLine:
    """DISABLED: No database table exists. This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("SupplyLotLine model is disabled - no database table exists")


class SupplyLotCost:
    """DISABLED: No database table exists. This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("SupplyLotCost model is disabled - no database table exists")


# Original model code removed - see git history
# class SupplyLot(Base):
#     __tablename__ = "TM_SUP_SupplyLot"
#     ... (entire class definition removed for brevity)

# class SupplyLotLine(Base):
#     __tablename__ = "TM_SUP_SupplyLotLine"
#     ... (entire class definition removed for brevity)

# class SupplyLotCost(Base):
#     __tablename__ = "TM_SUP_SupplyLotCost"
#     ... (entire class definition removed for brevity)
