/**
 * Purchase Intent entity representing an internal purchase request
 */
export interface PurchaseIntent {
  id: number
  code: string | null
  name: string | null
  internalComment: string | null
  supplierComment: string | null
  societyId: number | null
  creatorId: number | null
  isClosed: boolean | null
  createdAt: string | null
  updatedAt: string | null
  lines?: PurchaseIntentLine[]
}

/**
 * Purchase Intent line item
 */
export interface PurchaseIntentLine {
  id: number
  purchaseIntentId: number
  productId: number | null
  productInstanceId: number | null
  lineOrder: number | null
  quantity: number | null
  description: string | null
  // Additional fields for display (populated from joins)
  productName?: string
  productReference?: string
}

/**
 * DTO for creating a new purchase intent
 */
export interface PurchaseIntentCreateDto {
  pin_code?: string | null
  pin_name?: string | null
  pin_inter_comment?: string | null
  pin_supplier_comment?: string | null
  soc_id?: number | null
  pin_creator_id?: number | null
  lines?: PurchaseIntentLineCreateDto[]
}

/**
 * DTO for creating a purchase intent line
 */
export interface PurchaseIntentLineCreateDto {
  prd_id?: number | null
  pit_id?: number | null
  pil_order?: number | null
  pil_quantity?: number | null
  pil_description?: string | null
}

/**
 * DTO for updating an existing purchase intent
 */
export interface PurchaseIntentUpdateDto {
  pin_code?: string | null
  pin_name?: string | null
  pin_inter_comment?: string | null
  pin_supplier_comment?: string | null
  soc_id?: number | null
  pin_closed?: boolean | null
}

/**
 * DTO for updating a purchase intent line
 */
export interface PurchaseIntentLineUpdateDto {
  prd_id?: number | null
  pit_id?: number | null
  pil_order?: number | null
  pil_quantity?: number | null
  pil_description?: string | null
}

/**
 * Search/filter parameters for purchase intent list
 */
export interface PurchaseIntentSearchParams {
  search?: string
  societyId?: number
  creatorId?: number
  isClosed?: boolean
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Purchase Intent list item (summary view)
 */
export interface PurchaseIntentListItem {
  id: number
  code: string | null
  name: string | null
  societyId: number | null
  creatorId: number | null
  isClosed: boolean | null
  createdAt: string | null
  updatedAt: string | null
}
