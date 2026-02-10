/**
 * Order entity representing a customer order
 */
export interface Order {
  id: number
  reference: string
  clientId: number
  clientName?: string
  clientReference?: string
  statusId?: number
  statusName?: string
  orderDate: string
  requiredDate?: string
  expectedDeliveryDate?: string
  deliveryDate?: string
  quoteReference?: string

  // Totals (legacy + UI)
  subtotal?: number
  taxAmount?: number
  totalAmount?: number
  totalHT?: number
  totalTVA?: number
  totalTTC?: number

  currencyId?: number
  currencyCode?: string
  currency?: string

  discountAmount?: number
  discountPercentage?: number
  paidAmount?: number
  paymentStatusName?: string

  paymentModeId?: number
  paymentModeName?: string

  shippingAddress?: string
  billingAddress?: string
  notes?: string

  societyId?: number
  societyName?: string

  createdBy?: number
  createdByName?: string
  createdAt?: string
  updatedAt?: string

  lines?: OrderLine[]
}

/**
 * Order line item
 */
export interface OrderLine {
  id: number
  orderId: number
  productId?: number
  productReference?: string
  productName?: string
  description?: string
  quantity: number
  deliveredQuantity?: number
  unitPrice: number
  discount?: number
  lineTotal: number
  notes?: string
}

/**
 * DTO for creating a new order
 */
export interface OrderCreateDto {
  clientId: number
  societyId: number
  vatId: number
  currencyId?: number
  paymentConditionId?: number
  paymentModeId?: number
  projectId?: number
  costPlanId?: number
  orderName?: string
  orderDate?: string
  expectedDeliveryFrom?: string
  expectedDeliveryTo?: string
  headerText?: string
  footerText?: string
  clientComment?: string
  internalComment?: string
  discountPercentage?: number
  discountAmount?: number
  lines: OrderLineCreateDto[]
}

/**
 * DTO for creating an order line
 */
export interface OrderLineCreateDto {
  description: string
  quantity: number
  unitPrice: number
  discountPercentage?: number
  discountAmount?: number
  productId?: number
  productName?: string
  productReference?: string
  vatId?: number
  lineTypeId?: number
}

/**
 * DTO for updating an existing order
 */
export interface OrderUpdateDto extends Partial<Omit<OrderCreateDto, 'lines'>> {
  id: number
  statusId?: number
}

/**
 * Search/filter parameters for order list
 */
export interface OrderSearchParams {
  search?: string
  clientId?: number
  projectId?: number
  statusId?: number
  societyId?: number
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Order list item (summary view)
 */
export interface OrderListItem {
  id: number
  reference: string
  clientName?: string
  orderDate: string
  expectedDeliveryDate?: string
  statusName?: string
  totalAmount?: number
  currencyCode?: string
}

/**
 * Request for updating order-level discount
 */
export interface OrderDiscountRequest {
  discountPercentage?: number
  discountAmount?: number
}

/**
 * Response payload for converting an order to a quote
 */
export interface OrderConvertToQuoteResponse {
  orderId: number
  quoteId: number
  quoteReference: string
  convertedAt: string
  linesConverted: number
}
