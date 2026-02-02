"""
ERP System Backend Application

FastAPI-based backend for the Enterprise Resource Planning system.
"""

from app.config import settings, get_settings

__version__ = settings.APP_VERSION
__all__ = ["settings", "get_settings"]
