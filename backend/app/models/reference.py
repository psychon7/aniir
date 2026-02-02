"""
Reference Table Models

WARNING: This file contains DEPRECATED/REMOVED models.

- Currency: Use app.models.currency.Currency instead (maps to TR_CUR_Currency)
- Status: Use app.models.status.Status instead (maps to TR_STT_Status)

Note: The old TR_STA_Status table doesn't exist - the actual table is TR_STT_Status.

Disabled on: 2026-02-01
"""

# Import the correct models for backward compatibility
from app.models.currency import Currency
from app.models.status import Status

__all__ = ['Currency', 'Status']
