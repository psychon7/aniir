/**
 * TypeScript types for Accounts Receivable Aging Report
 */

/**
 * Invoice item in aging report
 */
export interface InvoiceAgingItem {
  invoiceId: number
  invoiceReference: string
  invoiceDate: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  balanceDue: number
  daysOverdue: number
  bucket: AgingBucket
}

/**
 * Aging bucket categories
 */
export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+'

/**
 * Client item in aging report
 */
export interface ClientAgingItem {
  clientId: number
  clientReference: string
  clientName: string
  buckets: AgingBuckets
  total: number
  invoices: InvoiceAgingItem[]
}

/**
 * Aging bucket amounts
 */
export interface AgingBuckets {
  '0-30': number
  '31-60': number
  '61-90': number
  '90+': number
}

/**
 * Summary totals for aging report
 */
export interface AgingSummary {
  '0-30': number
  '31-60': number
  '61-90': number
  '90+': number
}

/**
 * Filters applied to the aging report
 */
export interface AgingFilters {
  companyId?: number
  buId?: number
  clientId?: number
  minAmount?: number
  currencyId?: number
  search?: string
}

/**
 * Response from the receivables aging API
 */
export interface ReceivablesAgingResponse {
  success: boolean
  asOfDate: string
  summary: AgingSummary
  totalReceivables: number
  byClient: ClientAgingItem[]
  filters: AgingFilters
}

/**
 * Search params for receivables aging
 */
export interface ReceivablesAgingParams {
  companyId?: number
  buId?: number
  clientId?: number
  minAmount?: number
  currencyId?: number
  includeInvoices?: boolean
  asOfDate?: string
  search?: string
}

/**
 * Export format options for aging report
 */
export type ExportFormat = 'csv' | 'pdf' | 'xlsx'
