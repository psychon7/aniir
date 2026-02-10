"""Pydantic schemas for Category API requests and responses."""

from typing import Optional, List

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, computed_field


class CategoryBase(BaseModel):
    """Base schema aligned with TM_CAT_Category."""

    model_config = ConfigDict(populate_by_name=True)

    cat_name: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cat_name", "name"),
        description="Category name",
    )
    cat_sub_name_1: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cat_sub_name_1", "subName1"),
        description="Category sub-name 1",
    )
    cat_sub_name_2: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cat_sub_name_2", "subName2"),
        description="Category sub-name 2",
    )
    cat_order: Optional[int] = Field(
        default=0,
        validation_alias=AliasChoices("cat_order", "order"),
        description="Display order",
    )
    cat_is_actived: Optional[bool] = Field(
        default=True,
        validation_alias=AliasChoices("cat_is_actived", "cat_is_active", "isActive"),
        description="Whether category is active",
    )
    cat_image_path: Optional[str] = Field(
        default=None,
        max_length=2000,
        validation_alias=AliasChoices("cat_image_path", "imagePath", "imageUrl"),
        description="Category image path/URL",
    )
    cat_display_in_menu: Optional[bool] = Field(
        default=True,
        validation_alias=AliasChoices("cat_display_in_menu", "displayInMenu"),
        description="Display in menu",
    )
    cat_display_in_exhibition: Optional[bool] = Field(
        default=False,
        validation_alias=AliasChoices("cat_display_in_exhibition", "displayInExhibition"),
        description="Display in exhibition",
    )
    cat_parent_cat_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("cat_parent_cat_id", "cat_parent_id", "parentId"),
        description="Parent category ID",
    )
    soc_id: Optional[int] = Field(
        default=1,
        validation_alias=AliasChoices("soc_id", "societyId"),
        description="Society ID",
    )
    cat_description: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("cat_description", "description"),
        description="Category description",
    )


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""

    cat_name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        validation_alias=AliasChoices("cat_name", "name"),
    )
    soc_id: int = Field(default=1, validation_alias=AliasChoices("soc_id", "societyId"))


class CategoryUpdate(CategoryBase):
    """Schema for updating a category."""


class CategoryResponse(BaseModel):
    """Category response schema."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    cat_id: int = Field(..., description="Category ID")
    cat_name: str = Field(..., description="Category name")
    cat_sub_name_1: Optional[str] = None
    cat_sub_name_2: Optional[str] = None
    cat_order: int = 0
    cat_is_actived: bool = True
    cat_image_path: Optional[str] = None
    cat_display_in_menu: bool = True
    cat_display_in_exhibition: bool = False
    cat_parent_cat_id: Optional[int] = None
    soc_id: int
    cat_description: Optional[str] = None

    @computed_field
    @property
    def display_name(self) -> str:
        return self.cat_name

    @computed_field
    @property
    def is_root(self) -> bool:
        return self.cat_parent_cat_id is None


class CategoryListResponse(BaseModel):
    """Lightweight category list item."""

    model_config = ConfigDict(from_attributes=True)

    cat_id: int
    cat_name: str
    cat_parent_cat_id: Optional[int] = None
    cat_is_actived: bool = True
    cat_order: int = 0
    cat_image_path: Optional[str] = None


class CategoryWithChildrenResponse(CategoryResponse):
    """Category with nested children."""

    children: List["CategoryWithChildrenResponse"] = Field(default_factory=list)


CategoryWithChildrenResponse.model_rebuild()


class CategoryTreeResponse(BaseModel):
    """Tree response wrapper."""

    categories: List[CategoryWithChildrenResponse] = Field(default_factory=list)


class CategoryListPaginatedResponse(BaseModel):
    """Paginated category list response."""

    items: List[CategoryResponse] = Field(default_factory=list)
    total: int = 0
    skip: int = 0
    limit: int = 100


class CategoryAPIResponse(BaseModel):
    """Standard API response wrapper for category operations."""

    success: bool = True
    message: Optional[str] = None
    data: Optional[CategoryResponse] = None


class CategoryErrorResponse(BaseModel):
    """Error response for category operations."""

    success: bool = False
    error: dict
