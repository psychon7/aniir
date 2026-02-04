/**
 * Quote entity representing a cost plan / quotation
 */
export interface Quote {
  id: number
  reference: string
  name?: string

  clientId?: number
  clientName?: string
  clientReference?: string

  projectId?: number
  projectCode?: string
  projectName?: string

  quoteDate: string
  validUntil: string

  statusId?: number
  statusName?: string

  currencyId?: number
  currency?: string

  subtotal?: number
  taxAmount?: number
  totalAmount?: number
  discountAmount?: number

  lines?: QuoteLine[]
}

/**
 * Quote list item (summary view)
 */
export interface QuoteListItem {
  id: number
  reference: string
  clientName?: string
  quoteDate: string
  validUntil: string
  statusId?: number
  statusName?: string
  totalAmount?: number
}

/**
 * Quote line item
 */
export interface QuoteLine {
  id: number
  productId?: number
  productReference?: string
  productName?: string
  description?: string
  quantity: number
  unitPrice: number
  lineTotal: number
  vatRate?: number
  discountAmount?: number
  discountPercent?: number
}

/**
 * Quote general info / summary
 */
export interface QuoteSummary {
  subtotal?: number
  taxAmount?: number
  totalAmount?: number
  discountAmount?: number
}

/**
 * DTO for creating a new quote
 */
export interface QuoteCreateDto {
  name: string
  clientId: number
  projectId?: number
  vatId?: number
  paymentConditionId?: number
  paymentModeId?: number
  validityDate?: string
  preDeliveryDate?: string
  headerText?: string
  footerText?: string
  invoicingContactId?: number
  clientComment?: string
  internalComment?: string
  discountPercentage?: number
  discountAmount?: number
  commercial1Id?: number
  commercial2Id?: number
  commercial3Id?: number
  isKeyProject?: boolean
  lines?: QuoteLineCreateDto[]
}

/**
 * DTO for updating an existing quote
 */
export interface QuoteUpdateDto {
  name?: string
  clientId?: number
  projectId?: number
  vatId?: number
  paymentConditionId?: number
  paymentModeId?: number
  statusId?: number
  validityDate?: string
  preDeliveryDate?: string
  headerText?: string
  footerText?: string
  invoicingContactId?: number
  clientComment?: string
  internalComment?: string
  discountPercentage?: number
  discountAmount?: number
  commercial1Id?: number
  commercial2Id?: number
  commercial3Id?: number
  isKeyProject?: boolean
}

/**
 * DTO for creating a quote line
 */
export interface QuoteLineCreateDto {
  level1?: number
  level2?: number
  description?: string
  productId?: number
  productName?: string
  productInstanceId?: number
  productInstanceName?: string
  purchasePrice?: number
  unitPrice?: number
  quantity?: number
  vatId?: number
  lineTypeId: number
  discountPercentage?: number
  discountAmount?: number
  productDescription?: string
}

/**
 * DTO for updating a quote line
 */
export interface QuoteLineUpdateDto {
  level1?: number
  level2?: number
  description?: string
  productId?: number
  productName?: string
  productInstanceId?: number
  productInstanceName?: string
  purchasePrice?: number
  unitPrice?: number
  quantity?: number
  vatId?: number
  lineTypeId?: number
  discountPercentage?: number
  discountAmount?: number
  productDescription?: string
}

/**
 * Search/filter parameters for quote list
 */
export interface QuoteSearchParams {
  search?: string
  quoteName?: string
  quoteCode?: string
  clientName?: string
  projectCode?: string
  projectName?: string
  statusId?: number
  dateFrom?: string
  dateTo?: string
  keyword?: string
  fromSite?: boolean
  isKeyProject?: boolean
  page?: number
  pageSize?: number
}

/**
 * Request for changing quote status
 */
export interface QuoteStatusChangeRequest {
  quoteIds: number[]
  statusId: number
}

/**
 * Request for updating quote discount
 */
export interface QuoteDiscountRequest {
  discountPercentage?: number
  discountAmount?: number
}

/**
 * Request for updating quote commercials
 */
export interface QuoteCommercialRequest {
  commercial1Id?: number
  commercial2Id?: number
  commercial3Id?: number
}

/**
 * Request for duplicating a quote
 */
export interface QuoteDuplicateRequest {
  sameProject?: boolean
}

/**
 * Request payload for converting a quote to an order
 */
export interface QuoteConvertRequest {
  includeAllLines?: boolean
  lineIds?: number[]
  orderDate?: string
  notes?: string
}

/**
 * Response payload for converting a quote to an order
 */
export interface QuoteConvertResponse {
  quoteId: number
  orderId: number
  orderReference: string
  convertedAt: string
  linesConverted: number
}

/**
 * Quote status constants
 */
export const QuoteStatus = {
  IN_PROGRESS: 1,
  WON: 2,
  LOST: 3,
  ABANDONED: 4,
  CANCELLED: 5,
  TO_VALIDATE: 6,
  CLOSED: 7,
  DRAFT: 8,
} as const

export type QuoteStatusType = typeof QuoteStatus[keyof typeof QuoteStatus]

/**
 * Quote status labels
 */
export const QuoteStatusLabels: Record<number, string> = {
  1: 'In Progress',
  2: 'Won',
  3: 'Lost',
  4: 'Abandoned',
  5: 'Cancelled',
  6: 'To Validate',
  7: 'Closed',
  8: 'Draft',
}

/**
 * Line type constants
 */
export const LineType = {
  TEXT: 1,
  SALE: 2,
  TEXT_DESCRIPTION: 3,
  VARIANT: 4,
  SUBTOTAL: 5,
  TOTAL: 6,
} as const

export type LineTypeType = typeof LineType[keyof typeof LineType]

// Import types that are referenced but defined elsewhere
interface Client {
  cliId: number
  companyName: string
}

interface User {
  usrId: number
  usrFirstname: string
  usrLastname: string
}
