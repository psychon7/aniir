"""
Legacy Client Invoice model - DISABLED.

WARNING: This model was created with incorrect schema assumptions.
The correct model is app.models.invoice.ClientInvoice which maps to TM_CIN_Client_Invoice.

This file is kept for import compatibility but the class is disabled.

Disabled on: 2026-02-01
Reason: Uses non-existent table and incorrect column names
"""


class LegacyClientInvoice:
    """
    DISABLED: This legacy model used incorrect schema assumptions.

    Use app.models.invoice.ClientInvoice instead which maps to the
    actual TM_CIN_Client_Invoice table.
    """
    __disabled__ = True
    __tablename__ = "TM_CLI_Invoice_LEGACY_UNUSED"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "LegacyClientInvoice is disabled - use app.models.invoice.ClientInvoice instead."
        )
