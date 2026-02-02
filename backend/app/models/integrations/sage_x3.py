"""
Sage X3 Integration Models - DISABLED.

WARNING: Tables TM_INT_X3CustomerMap, TM_INT_X3ProductMap, TM_INT_X3ExportLog
do NOT exist in the database (DEV_ERP_ECOLED).

These models have been converted to disabled placeholders to prevent SQLAlchemy errors.

To re-enable: Create the database tables, then restore the SQLAlchemy model definitions.
Original model definitions can be found in version control history.

Disabled on: 2026-02-01
Reason: Database alignment - tables do not exist in production database
"""
from enum import Enum


class X3ExportStatus(str, Enum):
    """Export status enumeration - kept for reference in services."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"


class X3ExportType(str, Enum):
    """Export type enumeration - kept for reference in services."""
    INVOICES = "INVOICES"
    PAYMENTS = "PAYMENTS"
    CUSTOMERS = "CUSTOMERS"
    PRODUCTS = "PRODUCTS"


class X3CustomerMap:
    """
    DISABLED: Table TM_INT_X3CustomerMap does not exist in the database.

    This was a model for mapping customers between ERP and Sage X3.
    """
    __disabled__ = True
    __tablename__ = "TM_INT_X3CustomerMap"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "X3CustomerMap model is disabled - table TM_INT_X3CustomerMap does not exist. "
            "Create the Sage X3 integration tables first."
        )


class X3ProductMap:
    """
    DISABLED: Table TM_INT_X3ProductMap does not exist in the database.

    This was a model for mapping products between ERP and Sage X3.
    """
    __disabled__ = True
    __tablename__ = "TM_INT_X3ProductMap"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "X3ProductMap model is disabled - table TM_INT_X3ProductMap does not exist."
        )


class X3ExportLog:
    """
    DISABLED: Table TM_INT_X3ExportLog does not exist in the database.

    This was a model for tracking X3 export operations.
    """
    __disabled__ = True
    __tablename__ = "TM_INT_X3ExportLog"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "X3ExportLog model is disabled - table TM_INT_X3ExportLog does not exist."
        )
