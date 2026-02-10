export interface Category {
  cat_id: number
  cat_name: string
  cat_sub_name_1?: string | null
  cat_sub_name_2?: string | null
  cat_order?: number
  cat_is_actived?: boolean
  cat_image_path?: string | null
  cat_display_in_menu?: boolean
  cat_display_in_exhibition?: boolean
  cat_parent_cat_id?: number | null
  soc_id: number
  cat_description?: string | null
}

export interface CategoryListResponse {
  items: Category[]
  total: number
  skip: number
  limit: number
}

export interface CategoryCreateDto {
  name: string
  subName1?: string
  subName2?: string
  order?: number
  isActive?: boolean
  imagePath?: string
  displayInMenu?: boolean
  displayInExhibition?: boolean
  parentId?: number
  societyId?: number
  description?: string
}

export interface CategoryUpdateDto extends Partial<CategoryCreateDto> {}

