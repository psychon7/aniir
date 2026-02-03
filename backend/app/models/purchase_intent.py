"""
SQLAlchemy models for Purchase Intents.

This module contains:
- PurchaseIntent: Purchase Intent model (TM_PIN_Purchase_Intent)
- PurchaseIntentLine: Purchase Intent line items (TM_PIL_PurchaseIntent_Lines)

Actual DB tables:
- TM_PIN_Purchase_Intent: Purchase intent headers
- TM_PIL_PurchaseIntent_Lines: Purchase intent line items
"""
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.product import Product, ProductInstance
    from app.models.user import User
    from app.models.society import Society


# =============================================================================
# PurchaseIntent Model (TM_PIN_Purchase_Intent)
# =============================================================================


class PurchaseIntent(Base):
    """
    Purchase Intent model.
    Maps to TM_PIN_Purchase_Intent table.

    Actual DB schema:
      pin_id: int NOT NULL [PK]
      pin_code: nvarchar(50) - Reference code
      pin_name: nvarchar(1000)
      pin_inter_comment: nvarchar(4000) - Internal comment
      pin_supplier_comment: nvarchar(4000) - Comment for supplier
      soc_id: int FK -> TR_SOC_Society.soc_id
      pin_d_creation: datetime
      pin_d_update: datetime
      pin_creator_id: int FK -> TM_USR_User.usr_id
      pin_closed: bit - Whether the intent is closed
    """
    __tablename__ = "TM_PIN_Purchase_Intent"

    # Primary Key
    pin_id: Mapped[int] = mapped_column("pin_id", Integer, primary_key=True, autoincrement=True)

    # Reference code
    pin_code: Mapped[Optional[str]] = mapped_column("pin_code", String(50), nullable=True)

    # Name/Description
    pin_name: Mapped[Optional[str]] = mapped_column("pin_name", String(1000), nullable=True)

    # Comments
    pin_inter_comment: Mapped[Optional[str]] = mapped_column("pin_inter_comment", String(4000), nullable=True)
    pin_supplier_comment: Mapped[Optional[str]] = mapped_column("pin_supplier_comment", String(4000), nullable=True)

    # Society reference
    soc_id: Mapped[Optional[int]] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=True)

    # Dates
    pin_d_creation: Mapped[Optional[datetime]] = mapped_column("pin_d_creation", DateTime, nullable=True)
    pin_d_update: Mapped[Optional[datetime]] = mapped_column("pin_d_update", DateTime, nullable=True)

    # Creator
    pin_creator_id: Mapped[Optional[int]] = mapped_column("pin_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)

    # Status
    pin_closed: Mapped[Optional[bool]] = mapped_column("pin_closed", Boolean, nullable=True, default=False)

    # Relationships
    lines: Mapped[List["PurchaseIntentLine"]] = relationship(
        "PurchaseIntentLine",
        back_populates="purchase_intent",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<PurchaseIntent(pin_id={self.pin_id}, code='{self.pin_code}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.pin_id

    @property
    def code(self) -> Optional[str]:
        return self.pin_code

    @property
    def name(self) -> Optional[str]:
        return self.pin_name


# =============================================================================
# PurchaseIntentLine Model (TM_PIL_PurchaseIntent_Lines)
# =============================================================================


class PurchaseIntentLine(Base):
    """
    Purchase Intent Line model.
    Maps to TM_PIL_PurchaseIntent_Lines table.

    Actual DB schema:
      pil_id: int NOT NULL [PK]
      pin_id: int FK -> TM_PIN_Purchase_Intent.pin_id
      prd_id: int FK -> TM_PRD_Product.prd_id
      pit_id: int FK -> TM_PIT_Product_Instance.pit_id
      pil_order: int - Line order/sequence
      pil_quantity: int - Quantity
      pil_description: nvarchar(1000) - Line description
    """
    __tablename__ = "TM_PIL_PurchaseIntent_Lines"

    # Primary Key
    pil_id: Mapped[int] = mapped_column("pil_id", Integer, primary_key=True, autoincrement=True)

    # Foreign key to PurchaseIntent
    pin_id: Mapped[int] = mapped_column("pin_id", Integer, ForeignKey("TM_PIN_Purchase_Intent.pin_id"), nullable=False)

    # Product reference
    prd_id: Mapped[Optional[int]] = mapped_column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=True)

    # Product instance reference
    pit_id: Mapped[Optional[int]] = mapped_column("pit_id", Integer, ForeignKey("TM_PIT_Product_Instance.pit_id"), nullable=True)

    # Line order/sequence
    pil_order: Mapped[Optional[int]] = mapped_column("pil_order", Integer, nullable=True)

    # Quantity
    pil_quantity: Mapped[Optional[int]] = mapped_column("pil_quantity", Integer, nullable=True)

    # Description
    pil_description: Mapped[Optional[str]] = mapped_column("pil_description", String(1000), nullable=True)

    # Relationship to purchase intent
    purchase_intent: Mapped["PurchaseIntent"] = relationship("PurchaseIntent", back_populates="lines")

    def __repr__(self) -> str:
        desc = self.pil_description[:30] if self.pil_description else 'N/A'
        return f"<PurchaseIntentLine(pil_id={self.pil_id}, description='{desc}...')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.pil_id

    @property
    def description(self) -> Optional[str]:
        return self.pil_description

    @property
    def quantity(self) -> Optional[int]:
        return self.pil_quantity

    @property
    def order(self) -> Optional[int]:
        return self.pil_order
