"""
Custom exception classes for business logic errors.
"""
from typing import Optional, Dict, Any


class BusinessError(Exception):
    """Base business logic exception."""

    def __init__(
        self,
        message: str,
        code: str = "BUSINESS_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(BusinessError):
    """Input validation failed."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "VALIDATION_ERROR", details)


class EntityNotFoundError(BusinessError):
    """Requested entity not found."""

    def __init__(self, entity_type: str, entity_id: Any):
        super().__init__(
            f"{entity_type} with ID {entity_id} not found",
            "NOT_FOUND",
            {"entity_type": entity_type, "entity_id": entity_id}
        )


class InsufficientFundsError(BusinessError):
    """Insufficient funds for allocation."""

    def __init__(
        self,
        payment_id: int,
        requested: float,
        available: float
    ):
        super().__init__(
            f"Insufficient unallocated funds on payment {payment_id}",
            "INSUFFICIENT_FUNDS",
            {
                "payment_id": payment_id,
                "requested_amount": requested,
                "available_amount": available
            }
        )


class AllocationError(BusinessError):
    """Payment allocation error."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "ALLOCATION_ERROR", details)


class InvoiceAlreadyPaidError(BusinessError):
    """Invoice is already fully paid."""

    def __init__(self, invoice_id: int):
        super().__init__(
            f"Invoice {invoice_id} is already fully paid",
            "INVOICE_ALREADY_PAID",
            {"invoice_id": invoice_id}
        )


class InvalidStatusTransitionError(BusinessError):
    """Invalid status change."""

    def __init__(
        self,
        entity_type: str,
        entity_id: int,
        current_status: str,
        target_status: str
    ):
        super().__init__(
            f"Cannot change {entity_type} {entity_id} from {current_status} to {target_status}",
            "INVALID_STATUS_TRANSITION",
            {
                "entity_type": entity_type,
                "entity_id": entity_id,
                "current_status": current_status,
                "target_status": target_status
            }
        )


class DuplicateReferenceError(BusinessError):
    """Reference already exists."""

    def __init__(self, entity_type: str, reference: str):
        super().__init__(
            f"{entity_type} with reference {reference} already exists",
            "DUPLICATE_REFERENCE",
            {"entity_type": entity_type, "reference": reference}
        )


class CreditLimitExceededError(BusinessError):
    """Client credit limit exceeded."""

    def __init__(
        self,
        client_id: int,
        credit_limit: float,
        outstanding: float,
        new_amount: float
    ):
        super().__init__(
            f"Credit limit exceeded for client {client_id}",
            "CREDIT_LIMIT_EXCEEDED",
            {
                "client_id": client_id,
                "credit_limit": credit_limit,
                "outstanding_amount": outstanding,
                "new_amount": new_amount
            }
        )
