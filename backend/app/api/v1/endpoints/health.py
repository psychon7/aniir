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
    
    result = {
        "status": "ok",
        "environment": os.getenv("ENVIRONMENT", "NOT SET"),
        "db_host": "47.254.130.238",
        "db_port": 1433,
    }
    
    # Mask database URL
    try:
        db_url = os.getenv("DATABASE_URL", "NOT_SET")
        if db_url != "NOT_SET" and "@" in db_url:
            parts = db_url.split("@")
            result["database_url"] = f"****@{parts[-1]}" if len(parts) > 1 else "****"
        else:
            result["database_url"] = "NOT_SET"
    except Exception as e:
        result["database_url"] = f"error: {str(e)}"
    
    # Test DB port connectivity
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        connect_result = sock.connect_ex(("47.254.130.238", 1433))
        result["can_reach_db_port"] = (connect_result == 0)
        sock.close()
    except Exception as e:
        result["can_reach_db_port"] = False
        result["port_error"] = str(e)
    
    # Get outbound IP
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        result["outbound_ip"] = s.getsockname()[0]
        s.close()
    except Exception as e:
        result["outbound_ip"] = "unknown"
        result["ip_error"] = str(e)
    
    return result


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
    Check if expected tables exist and return row counts.
    Returns list of tables with their data counts.
    """
    tables_to_check = [
        ("TM_CLI_CLient", "Clients"),
        ("TM_SUP_Supplier", "Suppliers"),
        ("TM_PRD_Product", "Products"),
        ("TM_COD_Client_Order", "Client Orders"),
        ("TM_CIN_Client_Invoice", "Client Invoices"),
        ("TM_CPL_Cost_Plan", "Quotes/CostPlans"),
        ("TM_DFO_Delivery_Form", "Deliveries"),
        ("TM_PRJ_Project", "Projects"),
        ("TM_CPY_ClientInvoice_Payment", "Payments"),
        ("TM_CON_CONSIGNEE", "Consignees"),
        ("TM_CCO_Client_Contact", "Client Contacts"),
        ("TM_SCO_Supplier_Contact", "Supplier Contacts"),
        ("TR_CUR_Currency", "Currencies"),
        ("TR_PMO_Payment_Mode", "Payment Modes"),
        ("TR_PCO_Payment_Condition", "Payment Terms"),
        ("TR_CTY_Client_Type", "Client Types"),
        ("TR_STY_Supplier_Type", "Supplier Types"),
        ("TR_SOC_Society", "Societies"),
        ("TR_COU_Country", "Countries"),
    ]
    
    results = []
    total_records = 0
    
    for table, description in tables_to_check:
        try:
            result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.fetchone()[0]
            total_records += count
            results.append({
                "table": table,
                "description": description,
                "count": count,
                "has_data": count > 0
            })
        except Exception as e:
            results.append({
                "table": table,
                "description": description,
                "count": 0,
                "has_data": False,
                "error": str(e)[:100]
            })
    
    tables_with_data = [r for r in results if r.get("has_data")]
    
    return {
        "status": "healthy",
        "total_tables_checked": len(results),
        "tables_with_data": len(tables_with_data),
        "total_records": total_records,
        "tables": results
    }


# =============================================================================
# Migration Endpoints
# =============================================================================

@router.get("/health/migrations")
async def migration_status():
    """Check database migration status."""
    try:
        from app.migrations.runner import MigrationRunner
        runner = MigrationRunner()
        return runner.get_migration_status()
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }


@router.post("/admin/run-migrations")
async def run_migrations():
    """Manually trigger pending migrations (admin only)."""
    try:
        from app.migrations.runner import MigrationRunner
        runner = MigrationRunner()
        successful, failed = runner.run_pending_migrations()
        return {
            "status": "completed",
            "successful": successful,
            "failed": failed,
            "migrations_dir": str(runner.migrations_dir),
            "migrations_dir_exists": runner.migrations_dir.exists()
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }
