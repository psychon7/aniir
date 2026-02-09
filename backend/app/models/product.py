"""
Product SQLAlchemy Model
Maps to existing TM_PRD_Product table.

Actual DB schema for TM_PRD_Product:
  prd_id: int NOT NULL [PK]
  prd_ref: nvarchar(100) NOT NULL
  soc_id: int NOT NULL
  pty_id: int NOT NULL
  prd_name: nvarchar(200) NOT NULL
  prd_description: nvarchar(4000) NULL
  prd_specifications: xml NULL
  prd_price: decimal NULL
  prd_purchase_price: decimal NULL
  prd_file_name: nvarchar(1000) NULL
  prd_code: nvarchar(10) NULL
  prd_d_creation: datetime NULL
  prd_d_update: datetime NULL
  ... (physical dimensions)
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class ProductInstance(Base):
    """
    Product Instance model - represents specific instances/SKUs of products.
    Maps to TM_PIT_Product_Instance table.

    Actual DB schema:
      pit_id: int NOT NULL [PK]
      prd_id: int NOT NULL [FK -> TM_PRD_Product]
      pty_id: int NOT NULL [FK -> TM_PTY_Product_Type]
      pit_price: decimal NULL
      pit_ref: nvarchar(200) NULL
      pit_description: nvarchar(4000) NULL
      pit_prd_info: xml NULL
      pit_purchase_price: decimal NULL
      pit_tmp_ref: nvarchar(100) NULL
      pit_inventory_threshold: int NOT NULL
    """
    __tablename__ = "TM_PIT_Product_Instance"
    __table_args__ = {'extend_existing': True}

    pit_id = Column("pit_id", Integer, primary_key=True, autoincrement=True)
    prd_id = Column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=False)
    pty_id = Column("pty_id", Integer, ForeignKey("TM_PTY_Product_Type.pty_id"), nullable=False)

    pit_ref = Column("pit_ref", String(200), nullable=True)
    pit_description = Column("pit_description", String(4000), nullable=True)
    pit_price = Column("pit_price", Numeric(18, 4), nullable=True)
    pit_purchase_price = Column("pit_purchase_price", Numeric(18, 4), nullable=True)
    pit_inventory_threshold = Column("pit_inventory_threshold", Integer, nullable=False, default=0)
    pit_tmp_ref = Column("pit_tmp_ref", String(100), nullable=True)
    # pit_prd_info is XML - skip mapping (not needed in API)

    # Relationships
    product = relationship("Product", back_populates="instances", lazy="joined")

    @property
    def id(self):
        return self.pit_id


class Product(Base):
    """Maps to TM_PRD_Product table with actual DB column names."""
    __tablename__ = "TM_PRD_Product"

    # Primary key
    prd_id = Column("prd_id", Integer, primary_key=True, autoincrement=True)

    # Reference and name
    prd_ref = Column("prd_ref", String(100), nullable=False)
    prd_name = Column("prd_name", String(200), nullable=False)
    prd_description = Column("prd_description", String(4000), nullable=True)
    prd_sub_name = Column("prd_sub_name", String(200), nullable=True)
    prd_sup_description = Column("prd_sup_description", String(1000), nullable=True)
    prd_code = Column("prd_code", String(10), nullable=True)
    prd_tmp_ref = Column("prd_tmp_ref", String(100), nullable=True)

    # Foreign keys
    soc_id = Column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    pty_id = Column("pty_id", Integer, ForeignKey("TM_PTY_Product_Type.pty_id"), nullable=False)

    # Pricing
    prd_price = Column("prd_price", Numeric(18, 4), nullable=True)
    prd_purchase_price = Column("prd_purchase_price", Numeric(18, 4), nullable=True)

    # File
    prd_file_name = Column("prd_file_name", String(1000), nullable=True)

    # Timestamps
    prd_d_creation = Column("prd_d_creation", DateTime, nullable=True)
    prd_d_update = Column("prd_d_update", DateTime, nullable=True)

    # Physical dimensions
    prd_outside_diameter = Column("prd_outside_diameter", Numeric(18, 4), nullable=True)
    prd_length = Column("prd_length", Numeric(18, 4), nullable=True)
    prd_width = Column("prd_width", Numeric(18, 4), nullable=True)
    prd_height = Column("prd_height", Numeric(18, 4), nullable=True)
    prd_weight = Column("prd_weight", Numeric(18, 4), nullable=True)
    prd_depth = Column("prd_depth", Numeric(18, 4), nullable=True)
    prd_hole_size = Column("prd_hole_size", Numeric(18, 4), nullable=True)

    # Unit dimensions
    prd_unit_length = Column("prd_unit_length", Numeric(18, 4), nullable=True)
    prd_unit_width = Column("prd_unit_width", Numeric(18, 4), nullable=True)
    prd_unit_height = Column("prd_unit_height", Numeric(18, 4), nullable=True)
    prd_unit_weight = Column("prd_unit_weight", Numeric(18, 4), nullable=True)

    # Carton dimensions
    prd_quantity_each_carton = Column("prd_quantity_each_carton", Integer, nullable=True)
    prd_carton_length = Column("prd_carton_length", Numeric(18, 4), nullable=True)
    prd_carton_width = Column("prd_carton_width", Numeric(18, 4), nullable=True)
    prd_carton_height = Column("prd_carton_height", Numeric(18, 4), nullable=True)
    prd_carton_weight = Column("prd_carton_weight", Numeric(18, 4), nullable=True)

    # Relationships (load on access, not eagerly)
    instances = relationship("ProductInstance", back_populates="product")

    # Pricing relationships
    client_prices = relationship("ClientProductPrice", back_populates="product")
    supplier_prices = relationship("SupplierProductPrice", back_populates="product")

    # Property aliases for API compatibility
    @property
    def id(self):
        return self.prd_id

    @property
    def reference(self):
        return self.prd_ref

    @property
    def name(self):
        return self.prd_name

    @property
    def description(self):
        return self.prd_description

    @property
    def purchase_price(self):
        return self.prd_purchase_price

    @property
    def sale_price(self):
        return self.prd_price
