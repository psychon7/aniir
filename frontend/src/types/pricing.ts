/**
 * Client Product Price - Custom pricing for specific client/product combinations
 */
export interface ClientProductPrice {
  id: number
  clientId: number
  productId: number
  unitPrice: number
  discountPercent?: number
  minQuantity?: number
  maxQuantity?: number
  currencyId?: number
  validFrom?: string
  validTo?: string
  isActive: boolean
  notes?: string
  createdAt?: string
  updatedAt?: string
  // Resolved fields
  productReference?: string
  productName?: string
  currencyCode?: string
  isValidNow?: boolean
}

/**
 * DTO for creating a client product price
 */
export interface ClientProductPriceCreateDto {
  cpp_cli_id: number
  cpp_prd_id: number
  cpp_unit_price: number
  cpp_discount_percent?: number
  cpp_min_quantity?: number
  cpp_max_quantity?: number
  cpp_cur_id?: number
  cpp_valid_from?: string
  cpp_valid_to?: string
  cpp_notes?: string
  cpp_is_active?: boolean
}

/**
 * DTO for updating a client product price
 */
export interface ClientProductPriceUpdateDto {
  cpp_unit_price?: number
  cpp_discount_percent?: number
  cpp_min_quantity?: number
  cpp_max_quantity?: number
  cpp_cur_id?: number
  cpp_valid_from?: string
  cpp_valid_to?: string
  cpp_notes?: string
  cpp_is_active?: boolean
}

/**
 * Supplier Product Price - Cost information from a specific supplier
 */
export interface SupplierProductPrice {
  id: number
  supplierId: number
  productId: number
  unitCost: number
  supplierRef?: string
  supplierProductName?: string
  discountPercent?: number
  minOrderQty?: number
  leadTimeDays?: number
  currencyId?: number
  validFrom?: string
  validTo?: string
  priority: number
  isPreferred: boolean
  isActive: boolean
  notes?: string
  createdAt?: string
  updatedAt?: string
  // Resolved fields
  productReference?: string
  productName?: string
  currencyCode?: string
  isValidNow?: boolean
}

/**
 * Supplier's product view (combines product + pricing info)
 */
export interface SupplierProduct {
  priceId: number
  productId: number
  productReference?: string
  productName?: string
  supplierRef?: string
  supplierProductName?: string
  unitCost: number
  discountPercent?: number
  minOrderQty?: number
  leadTimeDays?: number
  currencyCode?: string
  isPreferred: boolean
  priority: number
  isActive: boolean
}

/**
 * DTO for creating a supplier product price
 */
export interface SupplierProductPriceCreateDto {
  spp_sup_id: number
  spp_prd_id: number
  spp_unit_cost: number
  spp_supplier_ref?: string
  spp_supplier_name?: string
  spp_discount_percent?: number
  spp_min_order_qty?: number
  spp_lead_time_days?: number
  spp_cur_id?: number
  spp_valid_from?: string
  spp_valid_to?: string
  spp_priority?: number
  spp_is_preferred?: boolean
  spp_notes?: string
  spp_is_active?: boolean
}

/**
 * DTO for updating a supplier product price
 */
export interface SupplierProductPriceUpdateDto {
  spp_unit_cost?: number
  spp_supplier_ref?: string
  spp_supplier_name?: string
  spp_discount_percent?: number
  spp_min_order_qty?: number
  spp_lead_time_days?: number
  spp_cur_id?: number
  spp_valid_from?: string
  spp_valid_to?: string
  spp_priority?: number
  spp_is_preferred?: boolean
  spp_notes?: string
  spp_is_active?: boolean
}

/**
 * Best supplier price response
 */
export interface BestSupplierPrice {
  success: boolean
  productId: number
  supplierId: number
  supplierName?: string
  unitCost: number
  leadTimeDays?: number
  isPreferred: boolean
  priceId: number
}

/**
 * Paginated response for client product prices
 */
export interface ClientProductPricePagedResponse {
  success: boolean
  data: ClientProductPrice[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Paginated response for supplier product prices
 */
export interface SupplierProductPricePagedResponse {
  success: boolean
  data: SupplierProductPrice[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Paginated response for supplier products
 */
export interface SupplierProductPagedResponse {
  success: boolean
  data: SupplierProduct[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * API response wrapper for single price
 */
export interface ClientProductPriceResponse {
  success: boolean
  data?: ClientProductPrice
  message?: string
}

export interface SupplierProductPriceResponse {
  success: boolean
  data?: SupplierProductPrice
  message?: string
}
