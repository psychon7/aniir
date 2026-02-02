"""
SQLAlchemy model for TM_INL_ClientInvoiceLine table

WARNING: This model is DISABLED because table TM_INL_ClientInvoiceLine
does NOT exist in the actual database.

The actual client invoice lines are stored in TM_CIL_ClientInvoice_Lines table.
However, that table is part of the ClientInvoice model in client_invoice.py.

Disabled on: 2026-02-01
"""


# Placeholder class for import compatibility (will cause runtime errors if used)
class ClientInvoiceLine:
    """DISABLED: No database table exists (TM_INL_ClientInvoiceLine). This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("ClientInvoiceLine model is disabled - no database table exists (TM_INL_ClientInvoiceLine)")
