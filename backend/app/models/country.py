"""
Country Model.

Maps to TR_COU_Country table in the database.
"""
from sqlalchemy import Column, Integer, String
from app.models.base import Base


class Country(Base):
    """Country model for TR_COU_Country table."""
    
    __tablename__ = "TR_COU_Country"
    
    cou_id = Column(Integer, primary_key=True, autoincrement=True)
    cou_name = Column(String(200), nullable=False)
    cou_code = Column(String(50), nullable=True)
    cou_iso_code = Column(String(50), nullable=True)
    
    # Aliases for consistent naming
    @property
    def id(self):
        return self.cou_id
    
    @property
    def name(self):
        return self.cou_name
    
    @property
    def code(self):
        return self.cou_code
    
    # Alias for frontend compatibility (uses ctr_ prefix)
    @property
    def ctr_id(self):
        return self.cou_id
    
    @property
    def ctr_name(self):
        return self.cou_name
    
    def __repr__(self):
        return f"<Country(id={self.cou_id}, name='{self.cou_name}')>"
