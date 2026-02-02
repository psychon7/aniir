/**
 * Aging bucket representing a time period for accounts receivable aging
 */
export interface AgingBucket {
  label: string
  daysFrom: number
  daysTo: number | null
  amount: number
  percentage: number
  invoiceCount: number
  color: string
}

/**
 * Client aging summary with breakdown by time period
 */
export interface ClientAgingSummary {
  clientId: number
  clientName: string
  clientAbbreviation?: string
  current: number
  thirtyDays: number
  sixtyDays: number
  ninetyPlus: number
  totalOutstanding: number
  invoiceCount: number
  oldestInvoiceDays: number
}

/**
 * Overall aging analysis with buckets and client breakdown
 */
export interface AgingAnalysis {
  generatedDate: string
  totalOutstanding: number
  buckets: AgingBucket[]
  clientSummaries: ClientAgingSummary[]
  businessUnitId?: number
  businessUnitName?: string
}

/**
 * Aging chart data point for visualization
 */
export interface AgingChartDataPoint {
  name: string
  amount: number
  percentage: number
  invoiceCount: number
  color: string
}

/**
 * Invoice aging detail for drill-down views
 */
export interface AgingInvoiceDetail {
  invoiceId: number
  invoiceCode: string
  invoiceName: string
  clientId: number
  clientName: string
  invoiceDate: string
  dueDate: string
  daysOverdue: number
  amountDue: number
  amountPaid: number
  totalAmount: number
  currencySymbol: string
  businessUnitId?: number
  businessUnitName?: string
}

/**
 * Search/filter parameters for aging analysis
 */
export interface AgingSearchParams {
  clientId?: number
  businessUnitId?: number
  asOfDate?: string
  minDaysOverdue?: number
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Aging trend data point for historical analysis
 */
export interface AgingTrendPoint {
  date: string
  current: number
  thirtyDays: number
  sixtyDays: number
  ninetyPlus: number
  total: number
}

/**
 * Business unit aging summary
 */
export interface BusinessUnitAgingSummary {
  businessUnitId: number
  businessUnitName: string
  totalOutstanding: number
  current: number
  thirtyDays: number
  sixtyDays: number
  ninetyPlus: number
  clientCount: number
  invoiceCount: number
  color: string
}

/**
 * Default aging bucket configuration
 */
export const AGING_BUCKETS_CONFIG = [
  { label: 'Current', daysFrom: 0, daysTo: 30, color: '#10B981' },
  { label: '31-60 Days', daysFrom: 31, daysTo: 60, color: '#F59E0B' },
  { label: '61-90 Days', daysFrom: 61, daysTo: 90, color: '#F97316' },
  { label: '90+ Days', daysFrom: 91, daysTo: null, color: '#EF4444' },
] as const
