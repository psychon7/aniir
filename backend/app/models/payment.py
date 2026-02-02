"""
Payment and Payment Allocation SQLAlchemy models.

WARNING: These models are DISABLED because tables TM_PAY_Payment and TM_PAY_PaymentAllocation
do NOT exist in the actual database.

Disabled on: 2026-02-01
"""


# Placeholder classes for import compatibility (will cause runtime errors if used)
class Payment:
    """DISABLED: No database table exists (TM_PAY_Payment). This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("Payment model is disabled - no database table exists (TM_PAY_Payment)")


class PaymentAllocation:
    """DISABLED: No database table exists (TM_PAY_PaymentAllocation). This is a placeholder to prevent import errors."""
    __disabled__ = True

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("PaymentAllocation model is disabled - no database table exists (TM_PAY_PaymentAllocation)")
