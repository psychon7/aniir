/**
 * Order entity representing a customer order
 */
export interface Order {
  id: number
  reference: string
  clientId: number
  clientName: string
  clientReference: string
  statusId: number
  statusName: string
  orderDate: string
  expectedDeliveryDate?: string
  deliveryDate?: string
  totalHT: number
  totalTVA: number
  totalTTC: number
  currencyId: number
  currencyCode: string
  paymentModeId?: number
  paymentModeName?: string
  shippingAddress?: string
  billingAddress?: string
  notes?: string
  societyId: number
  societyName: string
  createdBy: number
  createdByName: string
  createdAt: string
  updatedAt: string
}

/**
 * Order line item
 */
export interface OrderLine {
  id: number
  orderId: number
  productId: number
  productReference: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
  notes?: string
}

/**
 * DTO for creating a new order
 */
export interface OrderCreateDto {
  clientId: number
  expectedDeliveryDate?: string
  paymentModeId?: number
  shippingAddress?: string
  billingAddress?: string
  notes?: string
  societyId: number
  lines: OrderLineCreateDto[]
}

/**
 * DTO for creating an order line
 */
export interface OrderLineCreateDto {
  productId: number
  quantity: number
  unitPrice: number
  discount?: number
  notes?: string
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
  clientName: string
  orderDate: string
  statusId: number
  statusName: string
  totalTTC: number
  currencyCode: string
}
