"""
Application configuration settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application Settings
    APP_NAME: str = "ERP API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "ECOLED ERP Backend API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    API_BASE_URL: str = "http://localhost:8000"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "mssql+pymssql://iZ9x6t9u0t5n8Z%5CAdministrator:2%4024Courtry@47.254.130.238:1433/DEV_ERP_ECOLED"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_TOKEN_BLACKLIST_PREFIX: str = "erp:auth:blacklist:"
    REDIS_USER_TOKENS_PREFIX: str = "erp:auth:user_tokens:"

    # Email Settings
    EMAIL_FROM_ADDRESS: str = "noreply@ecoled.com"
    EMAIL_FROM_NAME: str = "ECOLED ERP"
    ACCOUNTING_CC_EMAIL: Optional[str] = None

    # Reference code generation (legacy compatibility)
    CODE_TYPE: int = 2

    # Storage Provider: "local", "azure_blob", or "aws_s3"
    STORAGE_PROVIDER: str = "local"

    # Azure Blob Storage (if STORAGE_PROVIDER = "azure_blob")
    AZURE_STORAGE_ACCOUNT: Optional[str] = None
    AZURE_STORAGE_KEY: Optional[str] = None
    AZURE_STORAGE_CONTAINER: str = "uploads"

    # AWS S3 (if STORAGE_PROVIDER = "aws_s3")
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # Local Storage (if STORAGE_PROVIDER = "local")
    LOCAL_STORAGE_PATH: str = "./uploads"

    # MinIO Settings (S3-compatible local storage)
    MINIO_ENDPOINT: str = "localhost:9010"
    MINIO_ACCESS_KEY: Optional[str] = None
    MINIO_SECRET_KEY: Optional[str] = None

    # Sage X3 Integration (optional)
    X3_API_BASE_URL: Optional[str] = None
    X3_API_KEY: Optional[str] = None
    X3_API_SECRET: Optional[str] = None
    X3_COMPANY_CODE: str = "001"
    X3_ENDPOINT_NAME: str = "MAIN"
    X3_LANGUAGE: str = "FRA"
    X3_TIMEOUT_SECONDS: int = 30
    X3_BATCH_SIZE: int = 100
    X3_EXPORT_DIRECTORY: str = "./exports/x3"

    # Webhook Idempotency
    WEBHOOK_IDEMPOTENCY_TTL_HOURS: int = 24

    # Shopify Integration
    SHOPIFY_API_KEY: Optional[str] = None
    SHOPIFY_API_SECRET: Optional[str] = None
    SHOPIFY_WEBHOOK_SECRET: Optional[str] = None
    SHOPIFY_SCOPES: str = "read_products,write_products,read_orders,write_orders,read_inventory,write_inventory"

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"  # Ignore extra fields in .env
    }


settings = Settings()
