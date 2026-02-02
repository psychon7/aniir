# Services Module
# This module provides a centralized export of all services.
# Services that fail to import are gracefully skipped to allow the app to start.

import logging

logger = logging.getLogger(__name__)

# Core services that must be available
__all__ = []

# Auth Service - Core requirement
try:
    from app.services.auth_service import (
        AuthService,
        AuthServiceError,
        InvalidCredentialsError,
        UserNotFoundError,
        UserInactiveError,
        InvalidTokenError,
        TokenExpiredError,
        RefreshTokenInvalidError,
        TokenPayload,
    )
    __all__.extend([
        "AuthService", "AuthServiceError", "InvalidCredentialsError",
        "UserNotFoundError", "UserInactiveError", "InvalidTokenError",
        "TokenExpiredError", "RefreshTokenInvalidError", "TokenPayload",
    ])
except ImportError as e:
    logger.warning(f"Failed to import auth_service: {e}")

# Dependencies - from app.dependencies
try:
    from app.dependencies import (
        get_auth_service,
        get_current_user,
        get_current_active_user,
        get_current_admin_user,
    )
    __all__.extend([
        "get_auth_service", "get_current_user",
        "get_current_active_user", "get_current_admin_user",
    ])
except ImportError as e:
    logger.warning(f"Failed to import dependencies: {e}")

# Token Blacklist Service
try:
    from app.services.token_blacklist_service import (
        TokenBlacklistService,
        get_token_blacklist_service,
    )
    __all__.extend(["TokenBlacklistService", "get_token_blacklist_service"])
except ImportError as e:
    logger.warning(f"Failed to import token_blacklist_service: {e}")

# Product Service
try:
    from app.services.product_service import (
        ProductService,
        ProductServiceError,
        ProductNotFoundError,
    )
    __all__.extend([
        "ProductService", "ProductServiceError", "ProductNotFoundError",
    ])
except ImportError as e:
    logger.warning(f"Failed to import product_service: {e}")

# Client Service
try:
    from app.services.client_service import (
        ClientService,
        ClientServiceError,
        ClientNotFoundError,
        get_client_service,
    )
    __all__.extend([
        "ClientService", "ClientServiceError", "ClientNotFoundError",
        "get_client_service",
    ])
except ImportError as e:
    logger.warning(f"Failed to import client_service: {e}")

# Drive Service
try:
    from app.services.drive_service import (
        DriveService,
        get_drive_service,
    )
    __all__.extend(["DriveService", "get_drive_service"])
except ImportError as e:
    logger.warning(f"Failed to import drive_service: {e}")

# Accounting Service
try:
    from app.services.accounting_service import (
        AccountingService,
        get_accounting_service,
    )
    __all__.extend(["AccountingService", "get_accounting_service"])
except ImportError as e:
    logger.warning(f"Failed to import accounting_service: {e}")

# Landed Cost Service
try:
    from app.services.landed_cost_service import (
        LandedCostService,
    )
    __all__.extend(["LandedCostService"])
except ImportError as e:
    logger.warning(f"Failed to import landed_cost_service: {e}")

# Invoice Service
try:
    from app.services.invoice_service import (
        InvoiceService,
        get_invoice_service,
    )
    __all__.extend(["InvoiceService", "get_invoice_service"])
except ImportError as e:
    logger.warning(f"Failed to import invoice_service: {e}")

# Currency Service
try:
    from app.services.currency_service import (
        CurrencyService,
        get_currency_service,
    )
    __all__.extend(["CurrencyService", "get_currency_service"])
except ImportError as e:
    logger.warning(f"Failed to import currency_service: {e}")

# Client Type Service
try:
    from app.services.client_type_service import (
        ClientTypeService,
        get_client_type_service,
    )
    __all__.extend(["ClientTypeService", "get_client_type_service"])
except ImportError as e:
    logger.warning(f"Failed to import client_type_service: {e}")

# Project Service
try:
    from app.services.project_service import (
        ProjectService,
    )
    __all__.extend(["ProjectService"])
except ImportError as e:
    logger.warning(f"Failed to import project_service: {e}")

# Storage Service
try:
    from app.services.storage_service import (
        StorageService,
        get_storage_service,
    )
    __all__.extend(["StorageService", "get_storage_service"])
except ImportError as e:
    logger.warning(f"Failed to import storage_service: {e}")

# PDF Service
try:
    from app.services.pdf_service import (
        PDFService,
        get_pdf_service,
    )
    __all__.extend(["PDFService", "get_pdf_service"])
except ImportError as e:
    logger.warning(f"Failed to import pdf_service: {e}")

# Email Service
try:
    from app.services.email_service import (
        EmailService,
        get_email_service,
    )
    __all__.extend(["EmailService", "get_email_service"])
except ImportError as e:
    logger.warning(f"Failed to import email_service: {e}")

# Statement Service
try:
    from app.services.statement_service import (
        StatementService,
        get_statement_service,
    )
    __all__.extend(["StatementService", "get_statement_service"])
except ImportError as e:
    logger.warning(f"Failed to import statement_service: {e}")

# User Service
try:
    from app.services.user_service import (
        UserService,
        get_user_service,
    )
    __all__.extend(["UserService", "get_user_service"])
except ImportError as e:
    logger.warning(f"Failed to import user_service: {e}")
