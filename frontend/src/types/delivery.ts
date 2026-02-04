/**
 * Delivery form entity representing a delivery in the ERP system
 */
export interface DeliveryForm {
  id: number
  reference: string

  // Client info
  clientId?: number
  clientName?: string

  // Order info
  orderId?: number
  orderReference?: string

  // Dates
  createdAt?: string
  scheduledDate?: string
  expectedDeliveryDate?: string
  deliveryDate?: string

  // Status
  statusName?: string
  isShipped: boolean
  isDelivered: boolean

  // Shipping info
  carrierName?: string
  trackingNumber?: string
  weight?: number
  packages?: number
  shippingAddress?: string

  // Address
  deliveryAddress?: string
  deliveryAddress2?: string
  deliveryCity?: string
  deliveryPostcode?: string
  deliveryCountry?: string

  // Notes
  internalNotes?: string
  deliveryNotes?: string

  // Timeline
  shippedAt?: string
  deliveredAt?: string

  // Lines
  lines?: DeliveryLine[]
}

/**
 * Delivery line item
 */
export interface DeliveryLine {
  id: number
  deliveryId: number
  productId?: number
  productName?: string
  productReference?: string
  description?: string
  quantity?: number
  orderedQuantity?: number
  deliveredQuantity?: number
  unitPrice?: number
  lineTotal?: number
}

/**
 * DTO for creating a new delivery form
 */
export interface DeliveryFormCreateDto {
  orderId?: number
  clientId: number
  projectId?: number
  name?: string
  expectedDeliveryDate?: string
  deliveryAddress?: string
  deliveryAddress2?: string
  deliveryCity?: string
  deliveryPostcode?: string
  deliveryCountry?: string
  internalNotes?: string
  deliveryNotes?: string
  societyId: number
  lines?: DeliveryLineCreateDto[]
}

/**
 * DTO for creating a delivery line
 */
export interface DeliveryLineCreateDto {
  productId?: number
  productName?: string
  productDescription?: string
  reference?: string
  quantity: number
  unitPrice?: number
  notes?: string
}

/**
 * DTO for updating a delivery form
 */
export interface DeliveryFormUpdateDto {
  name?: string
  expectedDeliveryDate?: string
  deliveryAddress?: string
  deliveryAddress2?: string
  deliveryCity?: string
  deliveryPostcode?: string
  deliveryCountry?: string
  internalNotes?: string
  deliveryNotes?: string
}

/**
 * DTO for updating a delivery line
 */
export interface DeliveryLineUpdateDto {
  productId?: number
  productName?: string
  productDescription?: string
  reference?: string
  quantity?: number
  unitPrice?: number
  notes?: string
}

/**
 * Search/filter parameters for delivery list
 */
export interface DeliverySearchParams {
  search?: string
  clientId?: number
  orderId?: number
  projectId?: number
  statusId?: number
  isShipped?: boolean
  isDelivered?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Ship delivery request
 */
export interface DeliveryShipRequest {
  shipDate?: string
  trackingNumber?: string
  carrier?: string
}

/**
 * Deliver request
 */
export interface DeliveryDeliverRequest {
  deliveryDate?: string
  receivedBy?: string
  notes?: string
}
