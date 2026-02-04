"""
FastAPI application entry point.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs migrations on startup before accepting requests.
    """
    # Startup: Run database migrations
    logger.info("=" * 60)
    logger.info("Application Starting - Running Migration Check")
    logger.info("=" * 60)
    
    try:
        from app.migrations.runner import run_migrations_on_startup
        successful, failed = run_migrations_on_startup()
        
        if failed > 0:
            logger.warning(f"⚠️ Some migrations failed. Successful: {successful}, Failed: {failed}")
        else:
            logger.info(f"✅ Migration check complete. Applied: {successful}")
    except Exception as e:
        logger.error(f"Migration check error (non-fatal): {e}")
        # Don't crash the app - migrations might already be applied
    
    logger.info("=" * 60)
    logger.info("Application Ready")
    logger.info("=" * 60)
    
    yield  # App is running
    
    # Shutdown
    logger.info("Application shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan  # Enable migration on startup
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Include API router (already has /api/v1 prefix)
app.include_router(api_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.APP_VERSION}


@app.get("/health/migrations")
async def migration_status():
    """Check database migration status."""
    try:
        from app.migrations.runner import MigrationRunner
        runner = MigrationRunner()
        return runner.get_migration_status()
    except Exception as e:
        return {"status": "error", "error": str(e)}

