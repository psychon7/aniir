"""
StockMovement and StockMovementLine models.

WARNING: These models are DISABLED because tables TM_STK_StockMovement and
TM_STK_StockMovementLine do NOT exist in the actual database. They were fictional
tables created during development without database access.

The actual database has TM_SRV_Shipping_Receiving and TM_SRL_Shipping_Receiving_Line
tables which are mapped in shipment.py.

If stock movement functionality is needed, use the ShippingReceiving model in shipment.py
or create the actual database tables first.

Disabled on: 2026-02-01
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from enum import Enum

# These models are DISABLED - see module docstring
# No actual TM_STK_StockMovement or TM_STK_StockMovementLine tables exist


class MovementType(str, Enum):
    """Type of stock movement."""
    RECEIPT = "RECEIPT"
    SHIPMENT = "SHIPMENT"
    TRANSFER = "TRANSFER"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN_IN = "RETURN_IN"
    RETURN_OUT = "RETURN_OUT"
    DAMAGE = "DAMAGE"
    DESTROY = "DESTROY"
    LOAN_OUT = "LOAN_OUT"
    LOAN_IN = "LOAN_IN"


class MovementStatus(str, Enum):
    """Status of stock movement."""
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    PARTIALLY = "PARTIALLY"


# Placeholder classes for import compatibility (will cause runtime errors if used)
class StockMovement:
    """DISABLED: No database table exists. This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("StockMovement model is disabled - no database table exists")


class StockMovementLine:
    """DISABLED: No database table exists. This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("StockMovementLine model is disabled - no database table exists")


# Original model code removed - see git history
# class StockMovement(Base):
#     __tablename__ = "TM_STK_StockMovement"
#     ... (entire class definition removed for brevity)

# class StockMovementLine(Base):
#     __tablename__ = "TM_STK_StockMovementLine"
#     ... (entire class definition removed for brevity)
