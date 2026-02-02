import { delay } from '../delay'
import { mockPayments, getNextPaymentId, getNextPaymentReference, paymentStatuses } from '../data/payments'
import type { Payment, PaymentCreateDto, PaymentUpdateDto, PaymentSearchParams } from '@/types/payment'
import type { ApiResponse, PagedResponse } from '@/types/api'

// In-memory data store (mutated by CRUD operations)
let payments = [...mockPayments]

/**
 * Get all payments with pagination and filtering
 */
export async function getPayments(params: PaymentSearchParams = {}): Promise<PagedResponse<Payment>> {
  await delay(400)

  let filtered = [...payments]

  // Apply search filter
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.reference.toLowerCase().includes(search) ||
        p.clientName.toLowerCase().includes(search) ||
        p.invoiceReference?.toLowerCase().includes(search) ||
        p.bankReference?.toLowerCase().includes(search) ||
        p.transactionId?.toLowerCase().includes(search)
    )
  }

  // Apply client filter
  if (params.clientId) {
    filtered = filtered.filter((p) => p.clientId === params.clientId)
  }

  // Apply invoice filter
  if (params.invoiceId) {
    filtered = filtered.filter((p) => p.invoiceId === params.invoiceId)
  }

  // Apply status filter
  if (params.statusId) {
    filtered = filtered.filter((p) => p.statusId === params.statusId)
  }

  // Apply payment mode filter
  if (params.paymentModeId) {
    filtered = filtered.filter((p) => p.paymentModeId === params.paymentModeId)
  }

  // Apply business unit filter
  if (params.businessUnitId) {
    filtered = filtered.filter((p) => p.businessUnitId === params.businessUnitId)
  }

  // Apply society filter
  if (params.societyId) {
    filtered = filtered.filter((p) => p.societyId === params.societyId)
  }

  // Apply date range filter
  if (params.dateFrom) {
    filtered = filtered.filter((p) => p.paymentDate >= params.dateFrom!)
  }
  if (params.dateTo) {
    filtered = filtered.filter((p) => p.paymentDate <= params.dateTo!)
  }

  // Apply amount range filter
  if (params.minAmount !== undefined) {
    filtered = filtered.filter((p) => p.amount >= params.minAmount!)
  }
  if (params.maxAmount !== undefined) {
    filtered = filtered.filter((p) => p.amount <= params.maxAmount!)
  }

  // Apply sorting
  const sortBy = params.sortBy || 'paymentDate'
  const sortOrder = params.sortOrder || 'desc'
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof Payment]
    const bVal = b[sortBy as keyof Payment]
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
 * Get a single payment by ID
 */
export async function getPaymentById(id: number): Promise<ApiResponse<Payment>> {
  await delay(300)

  const payment = payments.find((p) => p.id === id)
  if (!payment) {
    throw new Error(`Payment with ID ${id} not found`)
  }

  return {
    success: true,
    data: payment,
  }
}

/**
 * Create a new payment
 */
export async function createPayment(dto: PaymentCreateDto): Promise<ApiResponse<Payment>> {
  await delay(500)

  const id = getNextPaymentId()
  const reference = getNextPaymentReference()

  // Get client name from mock clients (simplified lookup)
  const clientNames: Record<number, string> = {
    1: 'Acme Corporation',
    2: 'TechStart SAS',
    3: 'Global Industries GmbH',
    5: 'Metro Services Ltd',
    7: 'Illumina Italia SpA',
    8: 'Shenzhen Electronics Ltd',
    9: 'Belgian Lights BVBA',
  }

  // Get status name
  const statusName = paymentStatuses.find(s => s.key === dto.statusId)?.value || 'Unknown'

  // Get payment mode name (simplified)
  const paymentModeNames: Record<number, string> = {
    1: 'Bank Transfer',
    2: 'Credit Card',
    3: 'Check',
    4: 'Cash',
    5: 'PayPal',
    6: 'Direct Debit',
  }

  // Get currency code (simplified)
  const currencyCodes: Record<number, string> = {
    1: 'EUR',
    2: 'USD',
    3: 'GBP',
    4: 'CNY',
    5: 'JPY',
    6: 'CHF',
  }

  // Get business unit name (simplified)
  const businessUnitNames: Record<number, string> = {
    1: 'LED Division',
    2: 'Domotics',
    3: 'HVAC',
    4: 'Wave Concept',
    5: 'Accessories',
  }

  // Get society name (simplified)
  const societyNames: Record<number, string> = {
    1: 'ECOLED EUROPE',
    2: 'ECOLED HK',
  }

  const newPayment: Payment = {
    id,
    reference,
    clientId: dto.clientId,
    clientName: clientNames[dto.clientId] || 'Unknown Client',
    invoiceId: dto.invoiceId,
    invoiceReference: dto.invoiceId ? `INV-${String(dto.invoiceId).padStart(4, '0')}` : undefined,
    amount: dto.amount,
    currencyId: dto.currencyId,
    currencyCode: currencyCodes[dto.currencyId] || 'EUR',
    paymentDate: dto.paymentDate,
    paymentModeId: dto.paymentModeId,
    paymentModeName: paymentModeNames[dto.paymentModeId] || 'Other',
    bankAccount: dto.bankAccount,
    bankReference: dto.bankReference,
    checkNumber: dto.checkNumber,
    transactionId: dto.transactionId,
    statusId: dto.statusId,
    statusName,
    businessUnitId: dto.businessUnitId,
    businessUnitName: dto.businessUnitId ? businessUnitNames[dto.businessUnitId] : undefined,
    societyId: dto.societyId,
    societyName: societyNames[dto.societyId] || 'Unknown',
    notes: dto.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'current_user',
    isReconciled: false,
  }

  payments.push(newPayment)

  return {
    success: true,
    data: newPayment,
    message: 'Payment created successfully',
  }
}

/**
 * Update an existing payment
 */
export async function updatePayment(dto: PaymentUpdateDto): Promise<ApiResponse<Payment>> {
  await delay(400)

  const index = payments.findIndex((p) => p.id === dto.id)
  if (index === -1) {
    throw new Error(`Payment with ID ${dto.id} not found`)
  }

  const existing = payments[index]

  // Get status name if changed
  const statusName = dto.statusId
    ? paymentStatuses.find(s => s.key === dto.statusId)?.value || existing.statusName
    : existing.statusName

  const updated: Payment = {
    ...existing,
    ...dto,
    statusName,
    updatedAt: new Date().toISOString(),
  }

  payments[index] = updated

  return {
    success: true,
    data: updated,
    message: 'Payment updated successfully',
  }
}

/**
 * Delete a payment
 */
export async function deletePayment(id: number): Promise<ApiResponse<void>> {
  await delay(300)

  const index = payments.findIndex((p) => p.id === id)
  if (index === -1) {
    throw new Error(`Payment with ID ${id} not found`)
  }

  // Hard delete for payments (or could implement soft delete if needed)
  payments.splice(index, 1)

  return {
    success: true,
    data: undefined,
    message: 'Payment deleted successfully',
  }
}

/**
 * Reset mock data to initial state (useful for testing)
 */
export function resetMockPayments(): void {
  payments = [...mockPayments]
}

/**
 * Export payments to CSV format
 */
export async function exportPaymentsToCSV(params: PaymentSearchParams = {}): Promise<string> {
  await delay(600)

  // Get filtered data (without pagination)
  const result = await getPayments({ ...params, page: 1, pageSize: 10000 })

  const headers = [
    'Reference',
    'Client',
    'Invoice',
    'Amount',
    'Currency',
    'Payment Date',
    'Payment Mode',
    'Status',
    'Bank Reference',
    'Business Unit',
    'Notes',
  ]

  const rows = result.data.map((p) => [
    p.reference,
    p.clientName,
    p.invoiceReference || '',
    p.amount.toFixed(2),
    p.currencyCode,
    p.paymentDate,
    p.paymentModeName,
    p.statusName,
    p.bankReference || p.transactionId || p.checkNumber || '',
    p.businessUnitName || '',
    p.notes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Get payment statuses for lookups
 */
export async function getPaymentStatuses(): Promise<ApiResponse<Array<{ key: number; value: string }>>> {
  await delay(100)
  return {
    success: true,
    data: paymentStatuses,
  }
}
