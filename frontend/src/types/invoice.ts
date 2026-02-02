/**
 * Invoice entity representing a client invoice in the ERP system
 */
export interface Invoice {
  id: number
  fId?: string
  code: string
  name: string

  // Client info
  clientId: number
  clientFId?: string
  clientName: string
  clientAbbreviation?: string

  // Project info
  projectId?: number
  projectFId?: string
  projectCode?: string
  projectName?: string

  // Order info
  orderId?: number
  orderFId?: string
  orderCode?: string
  orderName?: string

  // Cost Plan info
  costPlanId?: number
  costPlanFId?: string
  costPlanCode?: string
  costPlanName?: string

  // Dates
  creationDate: string
  updateDate?: string
  invoiceDate?: string
  termDate?: string
  cashingDate?: string

  // Financial
  currencyId: number
  currencySymbol?: string
  vatId?: number
  discountPercentage?: number
  discountAmount?: number
  amountHt?: number
  amountTtc?: number
  paidAmount?: number
  restToPay?: number
  margin?: number

  // Payment
  paymentConditionId: number
  paymentCondition?: string
  paymentModeId: number
  paymentMode?: string

  // Status flags
  isInvoice: boolean
  isInvoiced: boolean
  isFullPaid?: boolean
  keyProject: boolean
  canCreateDeliveryForm?: boolean

  // Text content
  headerText?: string
  footerText?: string
  clientComment?: string
  internalComment?: string

  // Bank info
  bankId?: number
  bankName?: string
  bankIban?: string
  bankBic?: string

  // Trade terms
  tradeTermsId?: number
  tradeTerms?: string

  // Credit note reference
  creditNoteInvoiceId?: number
  creditNoteInvoiceFId?: string
  creditNoteInvoiceCode?: string

  // Contact info
  contactInvoicingId?: number
  contactFirstname?: string
  contactLastname?: string
  contactAddress1?: string
  contactAddress2?: string
  contactPostcode?: string
  contactCity?: string
  contactCountry?: string
  contactPhone?: string
  contactFax?: string
  contactMobile?: string
  contactEmail?: string

  // Commercials
  commercial1Id?: number
  commercial1Name?: string
  commercial2Id?: number
  commercial2Name?: string
  commercial3Id?: number
  commercial3Name?: string

  // Delegator
  delegatorId?: number
  delegatorName?: string

  // Creator
  creatorId: number
  creatorName?: string

  // Related data
  lines?: InvoiceLine[]
  payments?: InvoicePayment[]
  supplierOrders?: KeyValueItem[]
  logistics?: KeyValueItem[]
}

/**
 * Invoice list item (summary view)
 */
export interface InvoiceListItem {
  id: number
  code: string
  name: string
  clientId: number
  clientName: string
  clientAbbreviation?: string
  projectId?: number
  projectCode?: string
  projectName?: string
  orderId?: number
  orderCode?: string
  orderName?: string
  creationDate: string
  invoiceDate?: string
  termDate?: string
  amountHt?: number
  amountTtc?: number
  paidAmount?: number
  restToPay?: number
  isInvoice: boolean
  isInvoiced: boolean
  isFullPaid?: boolean
  keyProject: boolean
  currencySymbol?: string
  paymentComments?: string
  // Alias fields for backward compatibility with different backend formats
  reference?: string
  totalAmount?: number
  dueDate?: string
  currency?: string
  statusName?: string
  // Raw backend fields (snake_case)
  cin_code?: string
  cin_date?: string
  cin_due_date?: string
  cin_total?: number
  cin_is_paid?: boolean
}

/**
 * Invoice line item
 */
export interface InvoiceLine {
  id: number
  invoiceId: number
  productId?: number
  productFId?: string
  productName?: string
  productDescription?: string
  description?: string
  reference?: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
  totalPriceWithDiscount?: number
  purchasePrice?: number
  totalCrudePrice?: number
  discountPercentage?: number
  discountAmount?: number
  margin?: number
  vatId?: number
  vatLabel?: string
  vatRate: number
  lineTypeId: number
  lineType?: string
  level1?: number
  level2?: number
  productImagePath?: string
  logisticsQuantity?: number
  deliveryFormQuantity?: number
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
