"""
Application Configuration Module

Handles all configuration settings for the ERP system including:
- SQL Server database connection
- API settings
- Security settings
- CORS configuration
"""

from functools import lru_cache
from typing import List, Optional, Union
from pydantic import field_validator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    All settings can be overridden via environment variables or .env file.
    Environment variables take precedence over .env file values.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # ==========================================================================
    # APPLICATION SETTINGS
    # ==========================================================================
    
    APP_NAME: str = "ERP System API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Enterprise Resource Planning System - FastAPI Backend"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # ==========================================================================
    # API SETTINGS
    # ==========================================================================
    
    API_V1_PREFIX: str = "/api/v1"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # ==========================================================================
    # SQL SERVER DATABASE SETTINGS
    # ==========================================================================
    
    # Database connection parameters
    DB_DRIVER: str = "ODBC Driver 17 for SQL Server"
    DB_SERVER: str = "localhost"
    DB_PORT: int = 1433
    DB_NAME: str = "ERP_DB"
    DB_USER: str = "sa"
    DB_PASSWORD: str = ""
    
    # Connection pool settings
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600  # Recycle connections after 1 hour
    DB_POOL_PRE_PING: bool = True  # Verify connections before use
    
    # Query settings
    DB_ECHO: bool = False  # Log SQL queries (set True for debugging)
    DB_ECHO_POOL: bool = False  # Log connection pool events
    
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """
        Construct SQL Server connection URL for SQLAlchemy.
        
        Uses pyodbc with ODBC Driver 17 for SQL Server.
        Format: mssql+pyodbc://user:password@server:port/database?driver=ODBC+Driver+17+for+SQL+Server
        """
        # URL-encode the driver name (spaces become +)
        driver_encoded = self.DB_DRIVER.replace(" ", "+")
        
        # Build connection string
        if self.DB_PASSWORD:
            return (
                f"mssql+pyodbc://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_SERVER}:{self.DB_PORT}/{self.DB_NAME}"
                f"?driver={driver_encoded}"
                f"&TrustServerCertificate=yes"
            )
        else:
            # Windows Authentication (Trusted Connection)
            return (
                f"mssql+pyodbc://@{self.DB_SERVER}:{self.DB_PORT}/{self.DB_NAME}"
                f"?driver={driver_encoded}"
                f"&Trusted_Connection=yes"
                f"&TrustServerCertificate=yes"
            )
    
    @computed_field
    @property
    def DATABASE_URL_ASYNC(self) -> str:
        """
        Construct async SQL Server connection URL for SQLAlchemy async engine.
        
        Uses aioodbc for async operations.
        """
        driver_encoded = self.DB_DRIVER.replace(" ", "+")
        
        if self.DB_PASSWORD:
            return (
                f"mssql+aioodbc://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_SERVER}:{self.DB_PORT}/{self.DB_NAME}"
                f"?driver={driver_encoded}"
                f"&TrustServerCertificate=yes"
            )
        else:
            return (
                f"mssql+aioodbc://@{self.DB_SERVER}:{self.DB_PORT}/{self.DB_NAME}"
                f"?driver={driver_encoded}"
                f"&Trusted_Connection=yes"
                f"&TrustServerCertificate=yes"
            )
    
    # ==========================================================================
    # SECURITY SETTINGS
    # ==========================================================================
    
    # JWT Settings
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Password hashing
    PASSWORD_MIN_LENGTH: int = 8
    
    # ==========================================================================
    # CORS SETTINGS
    # ==========================================================================
    
    # Can be set as comma-separated string: "http://localhost:3000,http://example.com"
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",      # React dev server
        "http://localhost:5173",      # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v) -> List[str]:
        """Parse CORS origins from comma-separated string or list."""
        if v is None or v == "":
            return [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
            ]
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        # Fallback to default
        return [
            "http://localhost:3000",
            "http://localhost:5173",
        ]
    
    # ==========================================================================
    # PAGINATION SETTINGS
    # ==========================================================================
    
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # ==========================================================================
    # FILE UPLOAD SETTINGS
    # ==========================================================================
    
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".jpg", ".jpeg", ".png", ".xlsx", ".csv"]
    
    # ==========================================================================
    # LOGGING SETTINGS
    # ==========================================================================
    
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: Optional[str] = None  # Set to file path to enable file logging
    
    # ==========================================================================
    # REDIS / CELERY SETTINGS
    # ==========================================================================

    REDIS_URL: str = "redis://localhost:6379/0"
    APP_TIMEZONE: str = "Europe/Paris"

    # ==========================================================================
    # EMAIL SETTINGS
    # ==========================================================================

    EMAIL_PROVIDER: str = "smtp"  # "smtp" or "ses"
    EMAIL_FROM_ADDRESS: Optional[str] = None
    EMAIL_FROM_NAME: Optional[str] = None
    ACCOUNTING_CC_EMAIL: Optional[str] = None

    # SMTP Settings
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True

    # AWS SES Settings (if EMAIL_PROVIDER = "ses")
    SES_REGION: Optional[str] = None
    SES_CONFIGURATION_SET: Optional[str] = None

    # ==========================================================================
    # AWS SETTINGS (for S3, SES, etc.)
    # ==========================================================================

    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # ==========================================================================
    # WEBHOOK SETTINGS
    # ==========================================================================

    WEBHOOK_IDEMPOTENCY_TTL_HOURS: int = 24
    WEBHOOK_IDEMPOTENCY_ENABLED: bool = True

    # ==========================================================================
    # SHOPIFY INTEGRATION
    # ==========================================================================

    SHOPIFY_API_KEY: Optional[str] = None
    SHOPIFY_API_SECRET: Optional[str] = None
    SHOPIFY_WEBHOOK_SECRET: Optional[str] = None
    SHOPIFY_SCOPES: str = "read_products,write_products,read_orders,write_orders,read_inventory,write_inventory"

    # ==========================================================================
    # BUSINESS SETTINGS
    # ==========================================================================

    # Default society ID for single-tenant operations
    DEFAULT_SOCIETY_ID: int = 1
    
    # Reference number formats
    CLIENT_REF_PREFIX: str = "CLI"
    SUPPLIER_REF_PREFIX: str = "SUP"
    PRODUCT_REF_PREFIX: str = "PRD"
    QUOTE_REF_PREFIX: str = "QUO"
    ORDER_REF_PREFIX: str = "ORD"
    INVOICE_REF_PREFIX: str = "INV"
    
    # ==========================================================================
    # HELPER METHODS
    # ==========================================================================
    
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.ENVIRONMENT.lower() == "development"
    
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.ENVIRONMENT.lower() == "production"
    
    def is_testing(self) -> bool:
        """Check if running in testing mode."""
        return self.ENVIRONMENT.lower() == "testing"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses lru_cache to ensure settings are only loaded once.
    Call get_settings.cache_clear() to reload settings.
    
    Returns:
        Settings: Application settings instance
    """
    return Settings()


# Convenience export for direct import
settings = get_settings()
