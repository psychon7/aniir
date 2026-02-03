"""
Activity model.

Maps to existing TR_ACT_Activity table.
This reference table stores business activity types used for
categorizing clients and other entities.

Actual DB schema:
  act_id: int NOT NULL [PK]
  act_designation: nvarchar(20) NOT NULL
  act_isactive: bit NOT NULL
"""
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class Activity(Base):
    """
    Activity reference table model.

    Maps to existing TR_ACT_Activity table.
    Stores business activity types (e.g., Manufacturing, Services,
    Retail, Wholesale) used for categorizing clients.
    """
    __tablename__ = "TR_ACT_Activity"
    __table_args__ = {'extend_existing': True}

    # Primary Key
    act_id: Mapped[int] = mapped_column(
        "act_id",
        Integer,
        primary_key=True,
        autoincrement=True
    )

    # Activity Info
    act_designation: Mapped[str] = mapped_column(
        "act_designation",
        String(20),
        nullable=False
    )

    # Active flag
    act_isactive: Mapped[bool] = mapped_column(
        "act_isactive",
        Boolean,
        nullable=False,
        default=True
    )

    def __repr__(self) -> str:
        return f"<Activity(act_id={self.act_id}, designation='{self.act_designation}')>"

    @property
    def display_name(self) -> str:
        """Get activity's display name."""
        return self.act_designation

    @property
    def is_active(self) -> bool:
        """Alias for act_isactive for schema compatibility."""
        return self.act_isactive
