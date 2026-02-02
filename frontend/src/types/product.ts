/**
 * Product entity representing an item in the catalog
 */
export interface Product {
  id: number
  reference: string
  name: string
  description?: string
  categoryId: number
  categoryName: string
  businessUnitId: number
  businessUnitName: string
  basePrice: number
  currencyId: number
  currencyCode: string
  vatRateId: number
  vatRate: number
  unitOfMeasure: string
  minOrderQuantity?: number
  weight?: number
  isActive: boolean
  hasInstances: boolean
  stockQuantity: number
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

/**
 * Product instance (variant) for products with multiple options
 */
export interface ProductInstance {
  id: number
  productId: number
  sku: string
  name: string
  price: number
  stockQuantity: number
  attributes?: Record<string, string>
}

/**
 * DTO for creating a new product
 */
export interface ProductCreateDto {
  reference: string
  name: string
  description?: string
  categoryId: number
  businessUnitId: number
  basePrice: number
  currencyId: number
  vatRateId: number
  unitOfMeasure: string
  minOrderQuantity?: number
  weight?: number
  hasInstances: boolean
}

/**
 * DTO for updating an existing product
 */
export interface ProductUpdateDto extends Partial<ProductCreateDto> {
  id: number
  isActive?: boolean
}

/**
 * Search/filter parameters for product list
 */
export interface ProductSearchParams {
  search?: string
  categoryId?: number
  businessUnitId?: number
  isActive?: boolean
  minPrice?: number
  maxPrice?: number
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Product list item (summary view)
 */
export interface ProductListItem {
  id: number
  reference: string
  name: string
  categoryName: string
  businessUnitName: string
  basePrice: number
  currencyCode: string
  stockQuantity: number
  isActive: boolean
}
