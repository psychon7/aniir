/**
 * Types for payment allocation functionality
 */

/**
 * Invoice available for allocation
 */
export interface AllocatableInvoice {
  id: number
  code: string
  clientId: number
  clientName: string
  invoiceDate: string
  termDate?: string
  totalAmount: number
  paidAmount: number
  balanceDue: number
  currencyCode: string
  isOverdue: boolean
  daysOverdue?: number
}

/**
 * Single allocation item in request
 */
export interface AllocationItem {
  invoiceId: number
  amount: number
}

/**
 * Request to allocate payment to invoices
 */
export interface AllocatePaymentRequest {
  allocations: AllocationItem[]
}

/**
 * Result of a single allocation
 */
export interface AllocationResult {
  invoiceId: number
  invoiceCode?: string
  allocatedAmount: number
  newPaidAmount: number
  newBalanceDue: number
  newStatus: string
}

/**
 * Response from payment allocation
 */
export interface AllocatePaymentResponse {
  success: boolean
  paymentId: number
  totalAllocated: number
  remainingUnallocated: number
  allocations: AllocationResult[]
}

/**
 * Payment with allocation information
 */
export interface PaymentWithAllocation {
  id: number
  reference: string
  clientId: number
  clientName: string
  amount: number
  allocatedAmount: number
  unallocatedAmount: number
  currencyCode: string
  paymentDate: string
  statusName: string
}
