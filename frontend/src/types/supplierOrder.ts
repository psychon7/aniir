/**
 * Supplier Order entity representing a purchase order to a supplier
 */
export interface SupplierOrder {
  id: number
  code: string | null
  name: string | null
  supplierId: number
  supplierContactId: number | null
  societyId: number
  creatorId: number
  purchaseIntentId: number | null
  currencyId: number
  vatId: number
  internalComment: string | null
  supplierComment: string | null
  createdAt: string
  updatedAt: string
  expectedDeliveryDate: string | null
  file: string | null
  discountAmount: number | null
  needToPay: number | null
  paidAmount: number | null
  totalHt: number | null
  totalTtc: number | null
  isStarted: boolean | null
  isCanceled: boolean | null
  displayName: string
  balanceDue: number
  // Resolved lookup names (from detail endpoint)
  supplierName?: string
  supplierReference?: string
  societyName?: string
  currencyCode?: string
  currencySymbol?: string
  vatRate?: number
  creatorName?: string
  lines?: SupplierOrderLine[]
  lineCount?: number
  totalQuantity?: number
}

/**
 * Supplier Order line item
 */
export interface SupplierOrderLine {
  id: number
  orderId: number
  productId: number | null
  productInstanceId: number | null
  purchaseIntentLineId: number | null
  lineOrder: number | null
  quantity: number | null
  description: string | null
  unitPrice: number | null
  discountAmount: number | null
  totalPrice: number | null
  priceWithDiscount: number | null
  totalCrudePrice: number | null
  vatId: number | null
  lineTotal: number
  // Resolved lookup names (for display)
  productCode?: string
  productName?: string
}

/**
 * DTO for creating a new supplier order line
 */
export interface SupplierOrderLineCreateDto {
  prd_id?: number
  pit_id?: number
  pil_id?: number
  sol_order?: number
  sol_quantity: number
  sol_description: string
  sol_unit_price: number
  sol_discount_amount?: number
  vat_id?: number
}

/**
 * DTO for updating a supplier order line
 */
export interface SupplierOrderLineUpdateDto extends Partial<SupplierOrderLineCreateDto> {
  id: number
}

/**
 * DTO for creating a new supplier order
 */
export interface SupplierOrderCreateDto {
  sod_code?: string
  sod_name?: string
  sup_id: number
  sco_id?: number
  soc_id: number
  cur_id: number
  vat_id: number
  sod_inter_comment?: string
  sod_supplier_comment?: string
  sod_d_exp_delivery?: string
  sod_file?: string
  sod_discount_amount?: number
  pin_id?: number
  usr_creator_id: number
  lines?: SupplierOrderLineCreateDto[]
}

/**
 * DTO for updating an existing supplier order
 */
export interface SupplierOrderUpdateDto {
  id: number
  sod_code?: string
  sod_name?: string
  sup_id?: number
  sco_id?: number
  cur_id?: number
  vat_id?: number
  sod_inter_comment?: string
  sod_supplier_comment?: string
  sod_d_exp_delivery?: string
  sod_file?: string
  sod_discount_amount?: number
  pin_id?: number
}

/**
 * Search/filter parameters for supplier order list
 */
export interface SupplierOrderSearchParams {
  search?: string
  supplier_id?: number
  society_id?: number
  currency_id?: number
  is_started?: boolean
  is_canceled?: boolean
  date_from?: string
  date_to?: string
  exp_delivery_from?: string
  exp_delivery_to?: string
  min_amount?: number
  max_amount?: number
  creator_id?: number
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Supplier Order list item (summary view for tables)
 */
export interface SupplierOrderListItem {
  id: number
  code: string | null
  name: string | null
  supplierId: number
  supplierName?: string
  totalHt: number | null
  totalTtc: number | null
  createdAt: string
  expectedDeliveryDate: string | null
  isStarted: boolean | null
  isCanceled: boolean | null
  currencyCode?: string
}

/**
 * Request to confirm a supplier order
 */
export interface ConfirmSupplierOrderRequest {
  notes?: string
}

/**
 * Request to cancel a supplier order
 */
export interface CancelSupplierOrderRequest {
  reason: string
}

/**
 * Response from confirming a supplier order
 */
export interface ConfirmSupplierOrderResponse {
  success: boolean
  orderId: number
  confirmedAt: string
  message: string
}

/**
 * Response from cancelling a supplier order
 */
export interface CancelSupplierOrderResponse {
  success: boolean
  orderId: number
  canceledAt: string
  reason: string
  message: string
}
