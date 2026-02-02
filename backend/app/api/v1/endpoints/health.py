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


@router.get("/health/debug")
async def debug_check():
    """Debug endpoint to check env and network."""
    import os
    import socket
    
    db_url = os.getenv("DATABASE_URL", "NOT SET")
    # Mask password
    db_url_masked = "****" 
    if db_url != "NOT SET" and "@" in db_url:
        parts = db_url.split("@")
        db_url_masked = f"****@{parts[-1]}" if len(parts) > 1 else "****"
    
    # Test network connectivity to DB
    db_host = "47.254.130.238"
    db_port = 1433
    can_connect = False
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((db_host, db_port))
        can_connect = (result == 0)
        sock.close()
    except:
        pass
    
    # Get outbound IP
    outbound_ip = "unknown"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        outbound_ip = s.getsockname()[0]
        s.close()
    except:
        pass
    
    return {
        "database_url": db_url_masked,
        "can_reach_db_port": can_connect,
        "db_host": db_host,
        "db_port": db_port,
        "outbound_ip": outbound_ip,
        "environment": os.getenv("ENVIRONMENT", "NOT SET"),
    }


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


@router.get("/health/env")
async def env_check():
    """Check environment variables (for debugging)."""
    import os
    import socket
    
    db_url = os.getenv("DATABASE_URL", "NOT SET")
    # Mask password for security
    if ":" in db_url and "@" in db_url:
        parts = db_url.split("@")
        if len(parts) == 2:
            creds = parts[0].split("://")[1] if "://" in parts[0] else parts[0]
            user = creds.split(":")[0] if ":" in creds else creds
            db_url_masked = f"...://{user}:****@{parts[1]}"
        else:
            db_url_masked = "****"
    else:
        db_url_masked = db_url
    
    # Try to resolve/ping the DB server
    db_host = "47.254.130.238"
    db_port = 1433
    can_connect = False
    connect_error = None
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((db_host, db_port))
        can_connect = (result == 0)
        sock.close()
    except Exception as e:
        connect_error = str(e)
    
    return {
        "database_url_masked": db_url_masked,
        "db_host": db_host,
        "db_port": db_port,
        "can_reach_db_port": can_connect,
        "connect_error": connect_error,
        "environment": os.getenv("ENVIRONMENT", "NOT SET"),
    }


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
