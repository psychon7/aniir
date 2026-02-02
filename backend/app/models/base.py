"""
SQLAlchemy Base Model

Provides the declarative base for all models.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    
    All models should inherit from this class.
    """
    pass
