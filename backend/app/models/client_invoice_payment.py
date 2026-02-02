"""
Client Invoice Payment SQLAlchemy Model

Maps to actual TM_CPY_ClientInvoice_Payment table.

Actual DB schema:
  cpy_id: int NOT NULL [PK]
  cin_id: int NOT NULL -> TM_CIN_Client_Invoice.cin_id
  cpy_amount: decimal NOT NULL
  cpy_d_create: datetime NOT NULL
  cpy_file: nvarchar(1000) NULL
  cpy_comment: nvarchar(400) NULL
  cpy_guid: nvarchar(200) NULL
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.invoice import ClientInvoice


class ClientInvoicePayment(Base):
    """
    Client Invoice Payment model.
    Maps to actual TM_CPY_ClientInvoice_Payment table.
    """
    __tablename__ = "TM_CPY_ClientInvoice_Payment"

    # Primary key
    cpy_id: Mapped[int] = mapped_column("cpy_id", Integer, primary_key=True, autoincrement=True)

    # Foreign key to invoice
    cin_id: Mapped[int] = mapped_column("cin_id", Integer, ForeignKey("TM_CIN_Client_Invoice.cin_id"), nullable=False)

    # Payment amount
    cpy_amount: Mapped[Decimal] = mapped_column("cpy_amount", Numeric(18, 2), nullable=False)

    # Creation date
    cpy_d_create: Mapped[datetime] = mapped_column("cpy_d_create", DateTime, nullable=False)

    # File attachment
    cpy_file: Mapped[Optional[str]] = mapped_column("cpy_file", String(1000), nullable=True)

    # Comment
    cpy_comment: Mapped[Optional[str]] = mapped_column("cpy_comment", String(400), nullable=True)

    # GUID for external reference
    cpy_guid: Mapped[Optional[str]] = mapped_column("cpy_guid", String(200), nullable=True)

    # Relationships
    invoice: Mapped["ClientInvoice"] = relationship("ClientInvoice", back_populates="payments")

    def __repr__(self) -> str:
        return f"<ClientInvoicePayment(cpy_id={self.cpy_id}, amount={self.cpy_amount}, invoice={self.cin_id})>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.cpy_id

    @property
    def pay_id(self) -> int:
        return self.cpy_id

    @property
    def invoice_id(self) -> int:
        return self.cin_id

    @property
    def amount(self) -> Decimal:
        return self.cpy_amount

    @property
    def payment_date(self) -> datetime:
        return self.cpy_d_create

    @property
    def notes(self) -> Optional[str]:
        return self.cpy_comment
