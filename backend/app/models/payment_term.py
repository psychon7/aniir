"""
PaymentTerm (PaymentCondition) model.
Maps to existing TR_PCO_Payment_Condition table.

Actual DB schema:
  pco_id: int NOT NULL [PK]
  pco_designation: nvarchar(500) NOT NULL
  pco_active: bit NOT NULL
  pco_numday: int NOT NULL
  pco_day_additional: int NOT NULL
  pco_end_month: bit NOT NULL
"""
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class PaymentTerm(Base):
    """
    PaymentTerm (PaymentCondition) reference table model.
    Maps to existing TR_PCO_Payment_Condition table.

    This is a reference table that stores payment term definitions
    (e.g., Net 30, Net 45, 30 days end of month) with their calculation rules.
    Payment terms define when payment is due after invoice date.
    """
    __tablename__ = "TR_PCO_Payment_Condition"

    # Primary Key
    pco_id: Mapped[int] = mapped_column(
        "pco_id",
        Integer,
        primary_key=True,
        autoincrement=True
    )

    # Payment Condition Info
    pco_designation: Mapped[str] = mapped_column(
        "pco_designation",
        String(500),
        nullable=False
    )

    pco_active: Mapped[bool] = mapped_column(
        "pco_active",
        Boolean,
        nullable=False,
        default=True
    )

    pco_numday: Mapped[int] = mapped_column(
        "pco_numday",
        Integer,
        nullable=False,
        default=0
    )

    pco_day_additional: Mapped[int] = mapped_column(
        "pco_day_additional",
        Integer,
        nullable=False,
        default=0
    )

    pco_end_month: Mapped[bool] = mapped_column(
        "pco_end_month",
        Boolean,
        nullable=False,
        default=False
    )

    def __repr__(self) -> str:
        return f"<PaymentTerm(pco_id={self.pco_id}, designation='{self.pco_designation}')>"

    @property
    def id(self) -> int:
        return self.pco_id

    @property
    def display_name(self) -> str:
        """Get payment term's display name."""
        return self.pco_designation

    @property
    def is_active(self) -> bool:
        """Check if payment term is active."""
        return self.pco_active

    @property
    def is_end_of_month(self) -> bool:
        """Check if payment is due at end of month."""
        return self.pco_end_month

    @property
    def total_days(self) -> int:
        """Get total number of days for payment (base days + additional)."""
        return self.pco_numday + self.pco_day_additional

    @property
    def term_summary(self) -> str:
        """Get a summary description of the payment term."""
        parts = []
        if self.pco_numday > 0:
            parts.append(f"{self.pco_numday} days")
        if self.pco_end_month:
            parts.append("end of month")
        if self.pco_day_additional > 0:
            parts.append(f"+ {self.pco_day_additional} days")
        return " ".join(parts) if parts else "Immediate"
