import { delay } from '../delay'
import {
  mockOrders,
  mockOrderLines,
  getNextOrderId,
  getNextOrderLineId,
} from '../data/orders'
import type {
  Order,
  OrderLine,
  OrderCreateDto,
  OrderUpdateDto,
  OrderSearchParams,
  OrderLineCreateDto,
} from '@/types/order'
import type { ApiResponse, PagedResponse } from '@/types/api'

// DTO for updating order line (matches api/orders.ts)
interface OrderLineUpdateDto extends Partial<OrderLineCreateDto> {
  id: number
}

// In-memory data store (mutated by CRUD operations)
let orders = [...mockOrders]
let orderLines = [...mockOrderLines]

// Order status constants
const ORDER_STATUSES: Record<number, string> = {
  1: 'Draft',
  2: 'Confirmed',
  3: 'Processing',
  4: 'Ready for Delivery',
  5: 'Partially Delivered',
  6: 'Delivered',
  7: 'Invoiced',
  8: 'Cancelled',
}

// ============================================
// ORDER CRUD OPERATIONS
// ============================================

/**
 * Get all orders with pagination and filtering
 */
export async function getOrders(params: OrderSearchParams = {}): Promise<PagedResponse<Order>> {
  await delay(400)

  let filtered = [...orders]

  // Apply search filter
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (o) =>
        o.reference.toLowerCase().includes(search) ||
        o.clientName.toLowerCase().includes(search) ||
        o.notes?.toLowerCase().includes(search)
    )
  }

  // Apply client filter
  if (params.clientId) {
    filtered = filtered.filter((o) => o.clientId === params.clientId)
  }

  // Apply status filter
  if (params.statusId) {
    filtered = filtered.filter((o) => o.statusId === params.statusId)
  }

  // Apply society filter
  if (params.societyId) {
    filtered = filtered.filter((o) => o.societyId === params.societyId)
  }

  // Apply date range filter
  if (params.dateFrom) {
    const fromDate = new Date(params.dateFrom)
    filtered = filtered.filter((o) => new Date(o.orderDate) >= fromDate)
  }

  if (params.dateTo) {
    const toDate = new Date(params.dateTo)
    filtered = filtered.filter((o) => new Date(o.orderDate) <= toDate)
  }

  // Apply sorting
  const sortBy = params.sortBy || 'orderDate'
  const sortOrder = params.sortOrder || 'desc'
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof Order]
    const bVal = b[sortBy as keyof Order]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })

  // Apply pagination
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (page - 1) * pageSize
  const data = filtered.slice(startIndex, startIndex + pageSize)

  return {
    success: true,
    data,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Get a single order by ID
 */
export async function getOrderById(id: number): Promise<ApiResponse<Order>> {
  await delay(300)

  const order = orders.find((o) => o.id === id)
  if (!order) {
    throw new Error(`Order with ID ${id} not found`)
  }

  return {
    success: true,
    data: order,
  }
}

/**
 * Create a new order
 */
export async function createOrder(dto: OrderCreateDto): Promise<ApiResponse<Order>> {
  await delay(500)

  const id = getNextOrderId()
  const now = new Date().toISOString()
  const year = new Date().getFullYear()
  const reference = `ORD-${year}-${String(id).padStart(4, '0')}`

  // Calculate totals from lines
  let totalHT = 0
  const newLines: OrderLine[] = []

  if (dto.lines && dto.lines.length > 0) {
    for (const lineDto of dto.lines) {
      const lineId = getNextOrderLineId()
      const discount = lineDto.discount || 0
      const lineTotal = lineDto.quantity * lineDto.unitPrice * (1 - discount / 100)

      const line: OrderLine = {
        id: lineId,
        orderId: id,
        productId: lineDto.productId,
        productReference: `PRD-${String(lineDto.productId).padStart(4, '0')}`,
        productName: `Product ${lineDto.productId}`,
        quantity: lineDto.quantity,
        unitPrice: lineDto.unitPrice,
        discount,
        lineTotal,
        notes: lineDto.notes,
      }

      newLines.push(line)
      totalHT += lineTotal
    }

    orderLines.push(...newLines)
  }

  const totalTVA = totalHT * 0.2 // Assume 20% VAT
  const totalTTC = totalHT + totalTVA

  const newOrder: Order = {
    id,
    reference,
    clientId: dto.clientId,
    clientName: `Client ${dto.clientId}`,
    clientReference: `CLI-${String(dto.clientId).padStart(4, '0')}`,
    statusId: 1, // Draft
    statusName: 'Draft',
    orderDate: now,
    expectedDeliveryDate: dto.expectedDeliveryDate,
    totalHT,
    totalTVA,
    totalTTC,
    currencyId: 1,
    currencyCode: 'EUR',
    paymentModeId: dto.paymentModeId,
    paymentModeName: dto.paymentModeId === 1 ? 'Bank Transfer' : 'Other',
    shippingAddress: dto.shippingAddress,
    billingAddress: dto.billingAddress,
    notes: dto.notes,
    societyId: dto.societyId,
    societyName: dto.societyId === 1 ? 'ECOLED EUROPE' : 'ECOLED HK',
    createdBy: 1,
    createdByName: 'Admin User',
    createdAt: now,
    updatedAt: now,
  }

  orders.push(newOrder)

  return {
    success: true,
    data: newOrder,
    message: 'Order created successfully',
  }
}

/**
 * Update an existing order
 */
export async function updateOrder(dto: OrderUpdateDto): Promise<ApiResponse<Order>> {
  await delay(400)

  const index = orders.findIndex((o) => o.id === dto.id)
  if (index === -1) {
    throw new Error(`Order with ID ${dto.id} not found`)
  }

  const existing = orders[index]

  // Check if order can be updated (only Draft and Confirmed can be edited)
  if (existing.statusId > 2) {
    throw new Error('Cannot update order that is already being processed')
  }

  const updated: Order = {
    ...existing,
    clientId: dto.clientId ?? existing.clientId,
    expectedDeliveryDate: dto.expectedDeliveryDate ?? existing.expectedDeliveryDate,
    paymentModeId: dto.paymentModeId ?? existing.paymentModeId,
    shippingAddress: dto.shippingAddress ?? existing.shippingAddress,
    billingAddress: dto.billingAddress ?? existing.billingAddress,
    notes: dto.notes ?? existing.notes,
    societyId: dto.societyId ?? existing.societyId,
    statusId: dto.statusId ?? existing.statusId,
    statusName: dto.statusId ? ORDER_STATUSES[dto.statusId] : existing.statusName,
    updatedAt: new Date().toISOString(),
  }

  orders[index] = updated

  return {
    success: true,
    data: updated,
    message: 'Order updated successfully',
  }
}

/**
 * Delete an order (soft delete)
 */
export async function deleteOrder(id: number): Promise<ApiResponse<void>> {
  await delay(300)

  const index = orders.findIndex((o) => o.id === id)
  if (index === -1) {
    throw new Error(`Order with ID ${id} not found`)
  }

  const order = orders[index]

  // Only allow deletion of draft orders
  if (order.statusId !== 1) {
    throw new Error('Only draft orders can be deleted')
  }

  // Remove order and its lines
  orders.splice(index, 1)
  orderLines = orderLines.filter((l) => l.orderId !== id)

  return {
    success: true,
    data: undefined,
    message: 'Order deleted successfully',
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: number,
  statusId: number
): Promise<ApiResponse<Order>> {
  await delay(300)

  const index = orders.findIndex((o) => o.id === id)
  if (index === -1) {
    throw new Error(`Order with ID ${id} not found`)
  }

  const statusName = ORDER_STATUSES[statusId]
  if (!statusName) {
    throw new Error(`Invalid status ID: ${statusId}`)
  }

  orders[index] = {
    ...orders[index],
    statusId,
    statusName,
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    data: orders[index],
    message: `Order status updated to ${statusName}`,
  }
}

/**
 * Confirm a draft order
 */
export async function confirmOrder(id: number): Promise<ApiResponse<Order>> {
  await delay(400)

  const index = orders.findIndex((o) => o.id === id)
  if (index === -1) {
    throw new Error(`Order with ID ${id} not found`)
  }

  const order = orders[index]
  if (order.statusId !== 1) {
    throw new Error('Only draft orders can be confirmed')
  }

  // Check if order has lines
  const lines = orderLines.filter((l) => l.orderId === id)
  if (lines.length === 0) {
    throw new Error('Cannot confirm order without lines')
  }

  orders[index] = {
    ...order,
    statusId: 2,
    statusName: 'Confirmed',
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    data: orders[index],
    message: 'Order confirmed successfully',
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(id: number, reason?: string): Promise<ApiResponse<Order>> {
  await delay(400)

  const index = orders.findIndex((o) => o.id === id)
  if (index === -1) {
    throw new Error(`Order with ID ${id} not found`)
  }

  const order = orders[index]

  // Cannot cancel if already delivered or invoiced
  if (order.statusId >= 6) {
    throw new Error('Cannot cancel delivered or invoiced orders')
  }

  orders[index] = {
    ...order,
    statusId: 8,
    statusName: 'Cancelled',
    notes: reason ? `${order.notes || ''}\n[Cancelled: ${reason}]`.trim() : order.notes,
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    data: orders[index],
    message: 'Order cancelled successfully',
  }
}

/**
 * Duplicate an order
 */
export async function duplicateOrder(id: number): Promise<ApiResponse<Order>> {
  await delay(500)

  const original = orders.find((o) => o.id === id)
  if (!original) {
    throw new Error(`Order with ID ${id} not found`)
  }

  const originalLines = orderLines.filter((l) => l.orderId === id)

  // Create new order with copied data
  const newId = getNextOrderId()
  const now = new Date().toISOString()
  const year = new Date().getFullYear()
  const reference = `ORD-${year}-${String(newId).padStart(4, '0')}`

  const newOrder: Order = {
    ...original,
    id: newId,
    reference,
    statusId: 1,
    statusName: 'Draft',
    orderDate: now,
    deliveryDate: undefined,
    createdAt: now,
    updatedAt: now,
    notes: `Duplicated from ${original.reference}`,
  }

  // Copy lines
  const newLines: OrderLine[] = originalLines.map((line) => ({
    ...line,
    id: getNextOrderLineId(),
    orderId: newId,
  }))

  orders.push(newOrder)
  orderLines.push(...newLines)

  return {
    success: true,
    data: newOrder,
    message: 'Order duplicated successfully',
  }
}

// ============================================
// ORDER LINES CRUD OPERATIONS
// ============================================

/**
 * Get all lines for an order
 */
export async function getOrderLines(orderId: number): Promise<ApiResponse<OrderLine[]>> {
  await delay(250)

  const order = orders.find((o) => o.id === orderId)
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`)
  }

  const lines = orderLines.filter((l) => l.orderId === orderId)

  return {
    success: true,
    data: lines,
  }
}

/**
 * Get a specific order line
 */
export async function getOrderLine(
  orderId: number,
  lineId: number
): Promise<ApiResponse<OrderLine>> {
  await delay(200)

  const line = orderLines.find((l) => l.orderId === orderId && l.id === lineId)
  if (!line) {
    throw new Error(`Order line with ID ${lineId} not found in order ${orderId}`)
  }

  return {
    success: true,
    data: line,
  }
}

/**
 * Add a new line to an order
 */
export async function addOrderLine(
  orderId: number,
  dto: OrderLineCreateDto
): Promise<ApiResponse<OrderLine>> {
  await delay(400)

  const orderIndex = orders.findIndex((o) => o.id === orderId)
  if (orderIndex === -1) {
    throw new Error(`Order with ID ${orderId} not found`)
  }

  const order = orders[orderIndex]

  // Only allow adding lines to Draft or Confirmed orders
  if (order.statusId > 2) {
    throw new Error('Cannot add lines to orders that are being processed')
  }

  const lineId = getNextOrderLineId()
  const discount = dto.discount || 0
  const lineTotal = dto.quantity * dto.unitPrice * (1 - discount / 100)

  const newLine: OrderLine = {
    id: lineId,
    orderId,
    productId: dto.productId,
    productReference: `PRD-${String(dto.productId).padStart(4, '0')}`,
    productName: `Product ${dto.productId}`,
    quantity: dto.quantity,
    unitPrice: dto.unitPrice,
    discount,
    lineTotal,
    notes: dto.notes,
  }

  orderLines.push(newLine)

  // Recalculate order totals
  recalculateOrderTotalsInternal(orderId)

  return {
    success: true,
    data: newLine,
    message: 'Order line added successfully',
  }
}

/**
 * Add multiple lines to an order
 */
export async function addOrderLines(
  orderId: number,
  lines: OrderLineCreateDto[]
): Promise<ApiResponse<OrderLine[]>> {
  await delay(500)

  const orderIndex = orders.findIndex((o) => o.id === orderId)
  if (orderIndex === -1) {
    throw new Error(`Order with ID ${orderId} not found`)
  }

  const order = orders[orderIndex]

  // Only allow adding lines to Draft or Confirmed orders
  if (order.statusId > 2) {
    throw new Error('Cannot add lines to orders that are being processed')
  }

  const newLines: OrderLine[] = []

  for (const dto of lines) {
    const lineId = getNextOrderLineId()
    const discount = dto.discount || 0
    const lineTotal = dto.quantity * dto.unitPrice * (1 - discount / 100)

    const newLine: OrderLine = {
      id: lineId,
      orderId,
      productId: dto.productId,
      productReference: `PRD-${String(dto.productId).padStart(4, '0')}`,
      productName: `Product ${dto.productId}`,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      discount,
      lineTotal,
      notes: dto.notes,
    }

    newLines.push(newLine)
  }

  orderLines.push(...newLines)

  // Recalculate order totals
  recalculateOrderTotalsInternal(orderId)

  return {
    success: true,
    data: newLines,
    message: `${newLines.length} order lines added successfully`,
  }
}

/**
 * Update an order line
 */
export async function updateOrderLine(
  orderId: number,
  dto: OrderLineUpdateDto
): Promise<ApiResponse<OrderLine>> {
  await delay(400)

  const orderIndex = orders.findIndex((o) => o.id === orderId)
  if (orderIndex === -1) {
    throw new Error(`Order with ID ${orderId} not found`)
  }

  const order = orders[orderIndex]

  // Only allow updating lines on Draft or Confirmed orders
  if (order.statusId > 2) {
    throw new Error('Cannot update lines on orders that are being processed')
  }

  const lineIndex = orderLines.findIndex((l) => l.orderId === orderId && l.id === dto.id)
  if (lineIndex === -1) {
    throw new Error(`Order line with ID ${dto.id} not found in order ${orderId}`)
  }

  const existing = orderLines[lineIndex]
  const quantity = dto.quantity ?? existing.quantity
  const unitPrice = dto.unitPrice ?? existing.unitPrice
  const discount = dto.discount ?? existing.discount
  const lineTotal = quantity * unitPrice * (1 - discount / 100)

  const updated: OrderLine = {
    ...existing,
    productId: dto.productId ?? existing.productId,
    quantity,
    unitPrice,
    discount,
    lineTotal,
    notes: dto.notes ?? existing.notes,
  }

  orderLines[lineIndex] = updated

  // Recalculate order totals
  recalculateOrderTotalsInternal(orderId)

  return {
    success: true,
    data: updated,
    message: 'Order line updated successfully',
  }
}

/**
 * Delete an order line
 */
export async function deleteOrderLine(orderId: number, lineId: number): Promise<ApiResponse<void>> {
  await delay(300)

  const orderIndex = orders.findIndex((o) => o.id === orderId)
  if (orderIndex === -1) {
    throw new Error(`Order with ID ${orderId} not found`)
  }

  const order = orders[orderIndex]

  // Only allow deleting lines from Draft or Confirmed orders
  if (order.statusId > 2) {
    throw new Error('Cannot delete lines from orders that are being processed')
  }

  const lineIndex = orderLines.findIndex((l) => l.orderId === orderId && l.id === lineId)
  if (lineIndex === -1) {
    throw new Error(`Order line with ID ${lineId} not found in order ${orderId}`)
  }

  orderLines.splice(lineIndex, 1)

  // Recalculate order totals
  recalculateOrderTotalsInternal(orderId)

  return {
    success: true,
    data: undefined,
    message: 'Order line deleted successfully',
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Internal function to recalculate order totals
 */
function recalculateOrderTotalsInternal(orderId: number): void {
  const orderIndex = orders.findIndex((o) => o.id === orderId)
  if (orderIndex === -1) return

  const lines = orderLines.filter((l) => l.orderId === orderId)
  const totalHT = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const totalTVA = totalHT * 0.2 // Assume 20% VAT
  const totalTTC = totalHT + totalTVA

  orders[orderIndex] = {
    ...orders[orderIndex],
    totalHT,
    totalTVA,
    totalTTC,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Recalculate order totals (API endpoint)
 */
export async function recalculateOrderTotals(orderId: number): Promise<ApiResponse<Order>> {
  await delay(300)

  const orderIndex = orders.findIndex((o) => o.id === orderId)
  if (orderIndex === -1) {
    throw new Error(`Order with ID ${orderId} not found`)
  }

  recalculateOrderTotalsInternal(orderId)

  return {
    success: true,
    data: orders[orderIndex],
    message: 'Order totals recalculated',
  }
}

// ============================================
// EXPORT OPERATIONS
// ============================================

/**
 * Export orders to CSV format
 */
export async function exportOrdersToCSV(params: OrderSearchParams = {}): Promise<string> {
  await delay(600)

  // Get filtered data (without pagination)
  const result = await getOrders({ ...params, page: 1, pageSize: 10000 })

  const headers = [
    'Reference',
    'Client',
    'Order Date',
    'Status',
    'Total HT',
    'Total TTC',
    'Currency',
    'Society',
  ]

  const rows = result.data.map((o) => [
    o.reference,
    o.clientName,
    new Date(o.orderDate).toLocaleDateString(),
    o.statusName,
    o.totalHT.toFixed(2),
    o.totalTTC.toFixed(2),
    o.currencyCode,
    o.societyName,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Export order to PDF (mock returns empty blob)
 */
export async function exportOrderToPDF(id: number): Promise<Blob> {
  await delay(800)

  const order = orders.find((o) => o.id === id)
  if (!order) {
    throw new Error(`Order with ID ${id} not found`)
  }

  // Return mock PDF blob
  return new Blob(['Mock PDF content for order ' + order.reference], { type: 'application/pdf' })
}

// ============================================
// RESET FUNCTION
// ============================================

/**
 * Reset mock data to initial state (useful for testing)
 */
export function resetMockOrders(): void {
  orders = [...mockOrders]
  orderLines = [...mockOrderLines]
}
