/**
 * Quote entity representing a cost plan / quotation
 */
export interface Quote {
  id?: number  // Alias for cplId for convenience
  cplId: number
  fId: string
  cplCode: string
  cplName: string
  clientCompanyName: string
  cplClient?: Client
  socId: number
  prjId: number
  prjFId: string
  prjName: string
  prjCode: string
  vatId: number
  cplDateCreation: string
  cplDateUpdate: string
  cstId: number
  costPlanStatut: string
  cliId: number
  cliFId: string
  pcoId: number
  pmoId: number
  cplDateValidity: string
  cplDatePreDelivery?: string
  cplHeaderText?: string
  cplFooterText?: string
  ccoIdInvoicing?: number
  cplClientComment?: string
  cplInterComment?: string
  usrCreatorId: number
  cplAmount?: number
  cplAmountTtc?: number
  cplPurchaseAmount?: number
  cplMarginAmount?: number
  cplInvoicedAmount?: number
  costPlanLines?: QuoteLine[]
  paymentMode?: string
  paymentCondition?: string
  creator?: User
  cplDiscountPercentage?: number
  cplDiscountAmount?: number
  usrCom1?: number
  usrCom2?: number
  usrCom3?: number
  usrCommercial1?: string
  usrCommercial2?: string
  usrCommercial3?: string
  userComment?: string
  userFlag?: string
  cliAbbr?: string
  currencySymbol?: string
  cplFromSite: boolean
  cplKeyProject: boolean
}

/**
 * Quote line item
 */
export interface QuoteLine {
  clnId: number
  cplId: number
  cplFId: string
  clnLevel1?: number
  clnLevel2?: number
  clnDescription?: string
  prdId?: number
  prdName?: string
  prdFId?: string
  pitId?: number
  pitName?: string
  pitFId?: string
  clnPurchasePrice?: number
  clnUnitPrice?: number
  clnQuantity?: number
  clnTotalPrice?: number
  clnTotalCrudePrice?: number
  vatId?: number
  vatLabel?: string
  ltpId: number
  lineType?: string
  vatRate: number
  socId: number
  clnPrdName?: string
  prdImgPath?: string
  clnDiscountPercentage?: number
  clnDiscountAmount?: number
  clnPriceWithDiscountHt?: number
  clnMargin?: number
  clnPrdDes?: string
  isAcc: boolean
  ptyId: number
  pilId: number
  solId: number
  pinFId?: string
  sodFId?: string
}

/**
 * Quote general info / summary
 */
export interface QuoteSummary {
  cplId: number
  fId: string
  cplDiscountPercentage?: number
  cplDiscountAmount?: number
  totalAmountHt?: number
  totalAmountTtc?: number
  totalMargin?: number
  totalPurchasePrice?: number
  totalSalePrice?: number
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
