"""
Database configuration for SQL Server connection.
Uses pymssql with asyncio.to_thread() for async compatibility.

Note: True async (aioodbc) requires ODBC Driver 17 for SQL Server 2008 compatibility.
ODBC Driver 18 requires TLS 1.2+ which older SQL Server versions don't support.
"""
import os
import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator
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
    pool_pre_ping=False,   # Removes SELECT 1 latency on every checkout
    pool_size=20,          # More connections for concurrent requests
    max_overflow=40,       # Allow burst to 60 total connections
    pool_recycle=1800,     # Recycle stale connections every 30 minutes
    pool_timeout=10,       # Fail fast if pool exhausted
    echo=False,
    connect_args={
        "tds_version": "7.0",  # SQL Server 2008 compatibility
        "login_timeout": 10,
    }
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =============================================================================
# Async Session Wrapper (for compatibility with async code)
# =============================================================================

class AsyncSessionWrapper:
    """
    Wrapper to make synchronous SQLAlchemy session work in async context.
    Uses asyncio.to_thread() for blocking operations.
    """
    def __init__(self, sync_session: Session):
        self._session = sync_session

    async def execute(self, statement, *args, **kwargs):
        """Execute a statement asynchronously."""
        return await asyncio.to_thread(self._session.execute, statement, *args, **kwargs)

    async def get(self, entity, ident, *args, **kwargs):
        """Get an entity by primary key asynchronously."""
        return await asyncio.to_thread(self._session.get, entity, ident, *args, **kwargs)

    async def commit(self):
        """Commit the transaction asynchronously."""
        return await asyncio.to_thread(self._session.commit)

    async def rollback(self):
        """Rollback the transaction asynchronously."""
        return await asyncio.to_thread(self._session.rollback)

    async def refresh(self, instance, *args, **kwargs):
        """Refresh an instance asynchronously."""
        return await asyncio.to_thread(self._session.refresh, instance, *args, **kwargs)

    async def flush(self):
        """Flush pending changes asynchronously."""
        return await asyncio.to_thread(self._session.flush)

    async def close(self):
        """Close the session."""
        return await asyncio.to_thread(self._session.close)

    def add(self, instance):
        """Add an instance (sync, no I/O)."""
        self._session.add(instance)

    def delete(self, instance):
        """Delete an instance (sync, no I/O)."""
        self._session.delete(instance)


@asynccontextmanager
async def async_session_maker() -> AsyncGenerator[AsyncSessionWrapper, None]:
    """
    Async context manager for database sessions.
    Wraps synchronous session for async compatibility.
    
    Usage:
        async with async_session_maker() as session:
            result = await session.execute(query)
    """
    session = SessionLocal()
    wrapper = AsyncSessionWrapper(session)
    try:
        yield wrapper
    finally:
        await wrapper.close()


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


async def get_async_db():
    """Dependency for getting async-compatible wrapped database sessions."""
    db = SessionLocal()
    wrapper = AsyncSessionWrapper(db)
    try:
        yield wrapper
    finally:
        await wrapper.close()
