/**
 * Invoice entity representing a client invoice in the ERP system
 */
export interface Invoice {
  id: number
  reference: string

  // Client info
  clientId: number
  clientName?: string

  // Order info
  orderId?: number
  orderReference?: string

  // Dates
  invoiceDate?: string
  dueDate?: string

  // Financial
  currencyId?: number
  currency?: string
  subtotal?: number
  vatAmount?: number
  totalAmount: number
  paidAmount?: number

  // Status
  statusName?: string
  paidAt?: string
  paymentReference?: string

  // Related data
  lines?: InvoiceLine[]
}

/**
 * Invoice list item (summary view)
 */
export interface InvoiceListItem {
  id: number
  reference: string
  clientId?: number
  clientName?: string
  invoiceDate?: string
  dueDate?: string
  totalAmount?: number
  paidAmount?: number
  currency?: string
  statusName?: string
}

/**
 * Invoice line item
 */
export interface InvoiceLine {
  id: number
  invoiceId: number
  productId?: number
  productReference?: string
  productName?: string
  description?: string
  quantity?: number
  unitPrice?: number
  lineTotal?: number
  vatRate?: number
  discountPercent?: number
  discountAmount?: number
}

/**
 * Invoice payment record
 */
export interface InvoicePayment {
  id: number
  invoiceId: number
  amount: number
  paymentDate: string
  comment?: string
  paymentCode?: string
  hasFile: boolean
  fileGuid?: string
}

/**
 * Key-value item for related entities
 */
export interface KeyValueItem {
  key: number
  value: string
  value2?: string
  value3?: string
  fId?: string
}

/**
 * Invoice financial information
 */
export interface InvoiceFinancialInfo {
  invoiceId: number
  totalAmountHt?: number
  totalAmountTtc?: number
  totalMargin?: number
  totalPurchasePrice?: number
  totalSalePrice?: number
  paidAmount?: number
  restToPay?: number
  discountPercentage?: number
  discountAmount?: number
  currencySymbol?: string
}

/**
 * DTO for creating a new invoice
 */
export interface InvoiceCreateDto {
  clientId: number
  projectId?: number
  orderId?: number
  costPlanId?: number
  contactInvoicingId?: number
  currencyId: number
  paymentConditionId?: number
  paymentModeId?: number
  vatId?: number
  name?: string
  invoiceDate?: string
  termDate?: string
  discountPercentage?: number
  discountAmount?: number
  headerText?: string
  footerText?: string
  clientComment?: string
  internalComment?: string
  isInvoice?: boolean
  creditNoteInvoiceId?: number
  bankId?: number
  tradeTermsId?: number
  delegatorId?: number
  commercial1Id?: number
  commercial2Id?: number
  commercial3Id?: number
  lines?: InvoiceLineCreateDto[]
}

/**
 * DTO for creating an invoice line
 */
export interface InvoiceLineCreateDto {
  productId?: number
  description?: string
  reference?: string
  productName?: string
  productDescription?: string
  quantity?: number
  unitPrice?: number
  purchasePrice?: number
  discountPercentage?: number
  discountAmount?: number
  vatId?: number
  lineTypeId?: number
  level1?: number
  level2?: number
}

/**
 * DTO for updating an existing invoice
 */
export interface InvoiceUpdateDto {
  name?: string
  contactInvoicingId?: number
  currencyId?: number
  paymentConditionId?: number
  paymentModeId?: number
  vatId?: number
  invoiceDate?: string
  termDate?: string
  discountPercentage?: number
  discountAmount?: number
  headerText?: string
  footerText?: string
  clientComment?: string
  internalComment?: string
  bankId?: number
  tradeTermsId?: number
  delegatorId?: number
  commercial1Id?: number
  commercial2Id?: number
  commercial3Id?: number
  keyProject?: boolean
}

/**
 * DTO for updating an invoice line
 */
export interface InvoiceLineUpdateDto {
  lineId?: number
  productId?: number
  description?: string
  reference?: string
  productName?: string
  productDescription?: string
  quantity?: number
  unitPrice?: number
  purchasePrice?: number
  discountPercentage?: number
  discountAmount?: number
  vatId?: number
  lineTypeId?: number
  level1?: number
  level2?: number
}

/**
 * DTO for creating an invoice payment
 */
export interface InvoicePaymentCreateDto {
  amount: number
  comment?: string
  paymentDate?: string
}

/**
 * Search/filter parameters for invoice list
 */
export interface InvoiceSearchParams {
  search?: string
  clientId?: number
  projectId?: number
  orderId?: number
  dateFrom?: string
  dateTo?: string
  isInvoice?: boolean
  isPaid?: boolean
  isInvoiced?: boolean
  keyProjectOnly?: boolean
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
