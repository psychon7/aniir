/**
 * Supplier Invoice entity representing a supplier invoice in the ERP system
 * Maps to TM_SIN_Supplier_Invoice table
 */
export interface SupplierInvoice {
  id: number
  code: string | null
  name: string | null

  // Supplier info
  supplierId: number
  supplierName?: string
  supplierReference?: string
  supplierContactId?: number

  // Society info
  societyId: number
  societyName?: string

  // Linked supplier order (optional)
  supplierOrderId?: number
  supplierOrderCode?: string

  // Currency
  currencyId: number
  currencyCode?: string
  currencySymbol?: string

  // VAT
  vatId: number
  vatRate?: number

  // Bank
  bankAccountId?: number

  // Dates
  createdAt: string
  updatedAt: string

  // Comments
  internalComment?: string
  supplierComment?: string

  // File attachment
  file?: string

  // Amounts
  discountAmount?: number
  totalHt?: number
  totalTtc?: number

  // Payment status
  isPaid: boolean
  bankReceiptFile?: string
  bankReceiptNumber?: string

  // Production tracking
  productionStarted?: boolean
  productionStartDate?: string
  productionCompletePreDate?: string
  productionCompleteDate?: string
  productionComplete?: boolean
  allProductStored?: boolean

  // Creator
  creatorId: number
  creatorName?: string

  // Computed fields
  displayName?: string
  paymentStatus?: string
  lineCount?: number
  totalQuantity?: number

  // Related data
  lines?: SupplierInvoiceLine[]
}

/**
 * Supplier Invoice list item (summary view)
 */
export interface SupplierInvoiceListItem {
  id: number
  code: string | null
  name: string | null
  supplierId: number
  supplierName?: string
  supplierReference?: string
  societyId: number
  societyName?: string
  supplierOrderId?: number
  supplierOrderCode?: string
  currencyId: number
  currencyCode?: string
  currencySymbol?: string
  createdAt: string
  updatedAt: string
  isPaid: boolean
  bankReceiptNumber?: string
  productionStarted?: boolean
  productionComplete?: boolean
  discountAmount?: number
  displayName?: string
  paymentStatus?: string
}

/**
 * Supplier Invoice line item
 */
export interface SupplierInvoiceLine {
  id: number
  invoiceId: number
  productId?: number
  productInstanceId?: number
  supplierOrderLineId?: number
  lineOrder?: number
  quantity?: number
  description?: string
  unitPrice?: number
  discountAmount?: number
  totalPrice?: number
  priceWithDiscount?: number
  totalCrudePrice?: number
  vatId?: number
  lineTotal?: number
}

/**
 * DTO for creating a new supplier invoice line
 */
export interface SupplierInvoiceLineCreateDto {
  prd_id?: number
  pit_id?: number
  sol_id?: number
  sil_order?: number
  sil_quantity: number
  sil_description: string
  sil_unit_price: number
  sil_discount_amount?: number
  vat_id?: number
}

/**
 * DTO for updating a supplier invoice line
 */
export interface SupplierInvoiceLineUpdateDto {
  prd_id?: number
  pit_id?: number
  sol_id?: number
  sil_order?: number
  sil_quantity?: number
  sil_description?: string
  sil_unit_price?: number
  sil_discount_amount?: number
  vat_id?: number
}

/**
 * DTO for creating a new supplier invoice
 */
export interface SupplierInvoiceCreateDto {
  sin_code?: string
  sin_name?: string
  sup_id: number
  sco_id?: number
  soc_id: number
  sod_id?: number
  cur_id: number
  vat_id: number
  bac_id?: number
  sin_inter_comment?: string
  sin_supplier_comment?: string
  sin_file?: string
  sin_discount_amount?: number
  usr_creator_id: number
  lines?: SupplierInvoiceLineCreateDto[]
}

/**
 * DTO for updating an existing supplier invoice
 */
export interface SupplierInvoiceUpdateDto {
  sin_code?: string
  sin_name?: string
  sup_id?: number
  sco_id?: number
  sod_id?: number
  cur_id?: number
  vat_id?: number
  bac_id?: number
  sin_inter_comment?: string
  sin_supplier_comment?: string
  sin_file?: string
  sin_discount_amount?: number
}

/**
 * Request to mark invoice as paid
 */
export interface MarkPaidRequest {
  bank_receipt_number?: string
  bank_receipt_file?: string
  notes?: string
}

/**
 * Response from marking invoice as paid
 */
export interface MarkPaidResponse {
  success: boolean
  invoiceId: number
  paidAt: string
  bankReceiptNumber?: string
  message: string
}

/**
 * Request to mark invoice as unpaid
 */
export interface MarkUnpaidRequest {
  reason: string
}

/**
 * Response from marking invoice as unpaid
 */
export interface MarkUnpaidResponse {
  success: boolean
  invoiceId: number
  unmarkedAt: string
  reason: string
  message: string
}

/**
 * Request to start production
 */
export interface StartProductionRequest {
  notes?: string
}

/**
 * Response from starting production
 */
export interface StartProductionResponse {
  success: boolean
  invoiceId: number
  startedAt: string
  message: string
}

/**
 * Request to complete production
 */
export interface CompleteProductionRequest {
  notes?: string
}

/**
 * Response from completing production
 */
export interface CompleteProductionResponse {
  success: boolean
  invoiceId: number
  completedAt: string
  message: string
}

/**
 * Search/filter parameters for supplier invoice list
 */
export interface SupplierInvoiceSearchParams {
  search?: string
  supplierId?: number
  societyId?: number
  currencyId?: number
  supplierOrderId?: number
  isPaid?: boolean
  productionStarted?: boolean
  productionComplete?: boolean
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  creatorId?: number
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
