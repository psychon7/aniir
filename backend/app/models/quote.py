"""
Quote and Quote Line models.

WARNING: These models are DISABLED because tables TM_QUO_Quote and TM_QUO_QuoteLine
do NOT exist in the actual database. They were fictional tables created during
development without database access.

If quote functionality is needed, the actual database tables must be created first,
or these models must be mapped to existing tables (if any).

Disabled on: 2026-02-01
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

# These models are DISABLED - see module docstring

# from sqlalchemy import (
#     Column, Integer, String, DateTime, Numeric, Text, ForeignKey, Boolean
# )
# from sqlalchemy.orm import relationship, Mapped, mapped_column
# from sqlalchemy.sql import func
# from app.models.base import Base

# if TYPE_CHECKING:
#     from app.models.vat_rate import VatRate


# Quote and QuoteLine are DISABLED - no actual database tables exist
# All code below is commented out because there is no TM_QUO_Quote or TM_QUO_QuoteLine in the DB

# class Quote(Base):
#     __tablename__ = "TM_QUO_Quote"
#     quo_id: Mapped[int] = mapped_column(...)
#     ... (all fields and methods removed for brevity)

# class QuoteLine(Base):
#     __tablename__ = "TM_QUO_QuoteLine"
#     qul_id: Mapped[int] = mapped_column(...)
#     ... (all fields removed for brevity)

# Placeholder classes for import compatibility (will cause runtime errors if used)
class Quote:
    """DISABLED: No database table exists. This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("Quote model is disabled - no database table exists")


class QuoteLine:
    """DISABLED: No database table exists. This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("QuoteLine model is disabled - no database table exists")
