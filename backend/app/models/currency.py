"""
Currency model.
Maps to existing TR_CUR_Currency table.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    Integer, String, DateTime, ForeignKey, Numeric
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.society import Society


class Currency(Base):
    """
    Currency reference table model.
    Maps to existing TR_CUR_Currency table.

    This is a reference table that stores currency definitions
    (e.g., USD, EUR, MAD) with their symbols and numeric identifiers.
    """
    __tablename__ = "TR_CUR_Currency"

    # Primary Key
    cur_id: Mapped[int] = mapped_column(
        "cur_id",
        Integer,
        primary_key=True,
        autoincrement=True
    )

    # Currency Info
    cur_designation: Mapped[str] = mapped_column(
        "cur_designation",
        String(20),
        nullable=False
    )
    cur_ci_num: Mapped[int] = mapped_column(
        "cur_ci_num",
        Integer,
        nullable=False
    )
    cur_symbol: Mapped[str] = mapped_column(
        "cur_symbol",
        String(10),
        nullable=False
    )

    # Foreign Key to Language
    lng_id: Mapped[int] = mapped_column(
        "lng_id",
        Integer,
        ForeignKey("TR_LNG_Language.lng_id"),
        nullable=False
    )

    # Relationships
    # Exchange rates where this currency is the base currency
    exchange_rates: Mapped[List["MainCurrency"]] = relationship(
        "MainCurrency",
        foreign_keys="MainCurrency.cur_id",
        back_populates="currency",
        lazy="selectin"
    )

    # Exchange rates where this currency is the target currency
    exchange_rates_as_target: Mapped[List["MainCurrency"]] = relationship(
        "MainCurrency",
        foreign_keys="MainCurrency.cur_id2",
        back_populates="target_currency",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Currency(cur_id={self.cur_id}, designation='{self.cur_designation}', symbol='{self.cur_symbol}')>"

    @property
    def display_name(self) -> str:
        """Get currency's display name with symbol."""
        return f"{self.cur_designation} ({self.cur_symbol})"


class MainCurrency(Base):
    """
    Currency exchange rate model.
    Maps to existing TR_MCU_Main_Currency table.

    Stores exchange rates between currencies with in/out rates
    and the date when the rate was effective.
    """
    __tablename__ = "TR_MCU_Main_Currency"

    # Primary Key
    mcu_id: Mapped[int] = mapped_column(
        "mcu_id",
        Integer,
        primary_key=True,
        autoincrement=True
    )

    # Foreign Key to base Currency
    cur_id: Mapped[int] = mapped_column(
        "cur_id",
        Integer,
        ForeignKey("TR_CUR_Currency.cur_id"),
        nullable=False
    )

    # Exchange Rates
    mcu_rate_in: Mapped[Decimal] = mapped_column(
        "mcu_rate_in",
        Numeric(10, 5),
        nullable=False
    )
    mcu_rate_out: Mapped[Decimal] = mapped_column(
        "mcu_rate_out",
        Numeric(10, 5),
        nullable=False
    )
    mcu_rate_date: Mapped[datetime] = mapped_column(
        "mcu_rate_date",
        DateTime,
        nullable=False
    )

    # Foreign Key to Language
    lng_id: Mapped[int] = mapped_column(
        "lng_id",
        Integer,
        ForeignKey("TR_LNG_Language.lng_id"),
        nullable=False
    )

    # Foreign Key to target Currency
    cur_id2: Mapped[int] = mapped_column(
        "cur_id2",
        Integer,
        ForeignKey("TR_CUR_Currency.cur_id"),
        nullable=False
    )

    # Relationships
    currency: Mapped["Currency"] = relationship(
        "Currency",
        foreign_keys=[cur_id],
        back_populates="exchange_rates"
    )
    target_currency: Mapped["Currency"] = relationship(
        "Currency",
        foreign_keys=[cur_id2],
        back_populates="exchange_rates_as_target"
    )

    def __repr__(self) -> str:
        return f"<MainCurrency(mcu_id={self.mcu_id}, rate_in={self.mcu_rate_in}, rate_out={self.mcu_rate_out})>"

    @property
    def rate_info(self) -> str:
        """Get exchange rate info string."""
        return f"In: {self.mcu_rate_in}, Out: {self.mcu_rate_out} (as of {self.mcu_rate_date})"
