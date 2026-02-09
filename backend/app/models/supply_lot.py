"""
Supply Lot SQLAlchemy Models

DEPRECATED: This module is deprecated. All supply lot and landed cost functionality
has been consolidated into `app.models.landed_cost`. Use that module instead.

The canonical models are:
  - app.models.landed_cost.SupplyLot (TM_LOT_SupplyLot)
  - app.models.landed_cost.SupplyLotItem (TM_LOT_SupplyLotItem)
  - app.models.landed_cost.FreightCost (TM_FRC_FreightCost)

Deprecated on: 2026-02-09
See: app/models/landed_cost.py
"""

import warnings

warnings.warn(
    "app.models.supply_lot is deprecated. Use app.models.landed_cost instead.",
    DeprecationWarning,
    stacklevel=2,
)


# Placeholder classes kept for backward compatibility (will cause runtime errors if used)
class SupplyLot:
    """DEPRECATED: Use app.models.landed_cost.SupplyLot instead."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "SupplyLot from supply_lot.py is deprecated. "
            "Use app.models.landed_cost.SupplyLot instead."
        )


class SupplyLotLine:
    """DEPRECATED: Use app.models.landed_cost.SupplyLotItem instead."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "SupplyLotLine from supply_lot.py is deprecated. "
            "Use app.models.landed_cost.SupplyLotItem instead."
        )


class SupplyLotCost:
    """DEPRECATED: Use app.models.landed_cost.FreightCost instead."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "SupplyLotCost from supply_lot.py is deprecated. "
            "Use app.models.landed_cost.FreightCost instead."
        )
