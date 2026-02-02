"""
Health check endpoints for monitoring.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db


router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    timestamp: datetime
    database: str
    version: str


class DatabaseHealthResponse(BaseModel):
    """Detailed database health response."""
    connected: bool
    server: str | None
    database: str | None
    version: str | None
    error: str | None


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        database="sql_server",
        version="1.0.0"
    )


@router.get("/health/db", response_model=DatabaseHealthResponse)
async def database_health_check(db: Session = Depends(get_db)):
    """
    Database connectivity health check.
    Returns detailed database connection status.
    """
    try:
        # Test connection
        result = db.execute(text("SELECT @@SERVERNAME, DB_NAME(), @@VERSION"))
        row = result.fetchone()
        
        return DatabaseHealthResponse(
            connected=True,
            server=row[0],
            database=row[1],
            version=row[2][:100] if row[2] else None,
            error=None
        )
    except Exception as e:
        return DatabaseHealthResponse(
            connected=False,
            server=None,
            database=None,
            version=None,
            error=str(e)
        )


@router.get("/health/tables")
async def tables_health_check(db: Session = Depends(get_db)):
    """
    Check if expected tables exist.
    Returns list of found and missing tables.
    """
    expected_tables = [
        "TR_BU_BusinessUnit",
        "TR_STA_Status",
        "TM_CLI_Client",
        "TM_PRD_Product",
    ]
    
    found = []
    missing = []
    
    for table in expected_tables:
        try:
            result = db.execute(text(
                f"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
                f"WHERE TABLE_NAME = :table"
            ), {"table": table})
            count = result.fetchone()[0]
            
            if count > 0:
                found.append(table)
            else:
                missing.append(table)
        except Exception:
            missing.append(table)
    
    return {
        "status": "healthy" if not missing else "degraded",
        "found": found,
        "missing": missing,
        "total_expected": len(expected_tables),
        "total_found": len(found)
    }
