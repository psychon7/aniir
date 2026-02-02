/**
 * Brand entity representing a product brand in the ERP system
 */
export interface Brand {
  braId: number
  socId: number
  braCode: string
  braName: string
  braDescription?: string
  braIsActived: boolean
  fId?: string
}

/**
 * DTO for creating a new brand
 */
export interface BrandCreateDto {
  braCode: string
  braName: string
  braDescription?: string
  braIsActived?: boolean
}

/**
 * DTO for updating an existing brand
 */
export interface BrandUpdateDto extends Partial<BrandCreateDto> {
  braId: number
}

/**
 * Search/filter parameters for brand list
 */
export interface BrandSearchParams {
  search?: string
  isActive?: boolean
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Brand list item (summary view)
 */
export interface BrandListItem {
  braId: number
  braCode: string
  braName: string
  braDescription?: string
  braIsActived: boolean
}
