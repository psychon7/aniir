"""
Database configuration for SQL Server connection.
Uses pymssql with asyncio.to_thread() for async compatibility.

Note: True async (aioodbc) requires ODBC Driver 17 for SQL Server 2008 compatibility.
ODBC Driver 18 requires TLS 1.2+ which older SQL Server versions don't support.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Import Base from models.base for re-export
from app.models.base import Base

# =============================================================================
# Database Engine (pymssql)
# =============================================================================
# Get the complete DATABASE_URL from environment
# Format: mssql+pymssql://user:password@host:port/database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mssql+pymssql://iZ9x6t9u0t5n8Z%5CAdministrator:2%4024Courtry@47.254.130.238:1433/DEV_ERP_ECOLED"
)

# Engine with pymssql for SQL Server 2008
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
    connect_args={
        "tds_version": "7.0",  # SQL Server 2008 compatibility
        "login_timeout": 15,
    }
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =============================================================================
# Dependency Injection
# =============================================================================

def get_db():
    """Dependency for getting database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
