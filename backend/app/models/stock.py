"""
Stock model.

WARNING: This model is DISABLED because table TM_STK_Stock does NOT exist
in the actual database. It was a fictional table created during development
without database access.

If stock functionality is needed, actual database tables must be created first,
or this model must be mapped to existing tables (if any).

Disabled on: 2026-02-01
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

# These models are DISABLED - see module docstring
# No actual TM_STK_Stock table exists in the database


# Placeholder class for import compatibility (will cause runtime errors if used)
class Stock:
    """DISABLED: No database table exists. This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("Stock model is disabled - no database table exists")


# Original model code commented out below:
# from sqlalchemy import (
#     Integer, String, DateTime, Numeric, Text, ForeignKey, Boolean
# )
# from sqlalchemy.orm import relationship, Mapped, mapped_column
# from sqlalchemy.sql import func
# from app.models.base import Base

# class Stock(Base):
#     __tablename__ = "TM_STK_Stock"
#     ... (entire class definition removed - see original file in git history)
