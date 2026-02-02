"""
Category model.
Maps to actual TM_CAT_Category table.

Actual DB schema:
  cat_id: int NOT NULL [PK]
  cat_name: nvarchar(200) NOT NULL
  cat_sub_name_1: nvarchar(200) NULL
  cat_sub_name_2: nvarchar(200) NULL
  cat_order: int NOT NULL
  cat_is_actived: bit NOT NULL
  cat_image_path: nvarchar(2000) NULL
  cat_display_in_menu: bit NOT NULL
  cat_display_in_exhibition: bit NOT NULL
  cat_parent_cat_id: int NULL -> TM_CAT_Category.cat_id
  soc_id: int NOT NULL -> TR_SOC_Society.soc_id
  cat_description: nvarchar(2000) NULL
"""
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.category import Category as CategoryType


class Category(Base):
    """
    Category model.
    Maps to actual TM_CAT_Category table.

    Categories support hierarchical structure through cat_parent_cat_id.
    """
    __tablename__ = "TM_CAT_Category"

    # Primary Key
    cat_id: Mapped[int] = mapped_column("cat_id", Integer, primary_key=True, autoincrement=True)

    # Category Info
    cat_name: Mapped[str] = mapped_column("cat_name", String(200), nullable=False)
    cat_sub_name_1: Mapped[Optional[str]] = mapped_column("cat_sub_name_1", String(200), nullable=True)
    cat_sub_name_2: Mapped[Optional[str]] = mapped_column("cat_sub_name_2", String(200), nullable=True)

    # Order and status
    cat_order: Mapped[int] = mapped_column("cat_order", Integer, nullable=False, default=0)
    cat_is_actived: Mapped[bool] = mapped_column("cat_is_actived", Boolean, nullable=False, default=True)

    # Display settings
    cat_image_path: Mapped[Optional[str]] = mapped_column("cat_image_path", String(2000), nullable=True)
    cat_display_in_menu: Mapped[bool] = mapped_column("cat_display_in_menu", Boolean, nullable=False, default=True)
    cat_display_in_exhibition: Mapped[bool] = mapped_column("cat_display_in_exhibition", Boolean, nullable=False, default=False)

    # Self-reference for hierarchy
    cat_parent_cat_id: Mapped[Optional[int]] = mapped_column("cat_parent_cat_id", Integer, ForeignKey("TM_CAT_Category.cat_id"), nullable=True)

    # Society
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)

    # Description
    cat_description: Mapped[Optional[str]] = mapped_column("cat_description", String(2000), nullable=True)

    # Self-referential relationship for parent-child hierarchy
    parent: Mapped[Optional["Category"]] = relationship(
        "Category",
        remote_side="Category.cat_id",
        back_populates="children",
        lazy="selectin"
    )

    children: Mapped[List["Category"]] = relationship(
        "Category",
        back_populates="parent",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Category(cat_id={self.cat_id}, name='{self.cat_name}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.cat_id

    @property
    def code(self) -> str:
        return str(self.cat_id)  # No code column, use ID

    @property
    def name(self) -> str:
        return self.cat_name

    @property
    def parent_id(self) -> Optional[int]:
        return self.cat_parent_cat_id

    @property
    def display_name(self) -> str:
        return self.cat_name

    @property
    def is_active(self) -> bool:
        return self.cat_is_actived

    @property
    def is_root(self) -> bool:
        return self.cat_parent_cat_id is None

    @property
    def has_children(self) -> bool:
        return len(self.children) > 0 if self.children else False

    def get_ancestors(self) -> List["Category"]:
        ancestors = []
        current = self.parent
        while current is not None:
            ancestors.append(current)
            current = current.parent
        return ancestors

    def get_full_path(self, separator: str = " > ") -> str:
        ancestors = self.get_ancestors()
        path_parts = [a.cat_name for a in reversed(ancestors)]
        path_parts.append(self.cat_name)
        return separator.join(path_parts)
