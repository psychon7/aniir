"""
Language Model.

Maps to TR_LNG_Language table in the database.
"""
from sqlalchemy import Column, Integer, String
from app.models.base import Base


class Language(Base):
    """Language model for TR_LNG_Language table."""
    
    __tablename__ = "TR_LNG_Language"
    
    lng_id = Column(Integer, primary_key=True, autoincrement=True)
    lng_label = Column(String(80), nullable=False)
    
    # Aliases for consistent naming
    @property
    def id(self):
        return self.lng_id
    
    @property
    def name(self):
        return self.lng_label
    
    # Alias for compatibility
    @property
    def lng_name(self):
        return self.lng_label
    
    def __repr__(self):
        return f"<Language(id={self.lng_id}, label='{self.lng_label}')>"
