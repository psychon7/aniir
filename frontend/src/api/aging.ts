import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type {
  AgingAnalysis,
  AgingInvoiceDetail,
  AgingSearchParams,
  AgingTrendPoint,
  BusinessUnitAgingSummary,
} from '@/types/aging'
import type { PagedResponse } from '@/types/api'
import { accountingApi, type RawReceivablesAgingResponse } from './accounting'

type BucketKey = 'current' | 'days_31_60' | 'days_61_90' | 'over_90'

const BUCKET_CONFIG: Array<{
  key: BucketKey
  label: string
  daysFrom: number
  daysTo: number | null
  color: string
}> = [
  { key: 'current', label: 'Current', daysFrom: 0, daysTo: 30, color: '#10B981' },
  { key: 'days_31_60', label: '31-60 Days', daysFrom: 31, daysTo: 60, color: '#F59E0B' },
  { key: 'days_61_90', label: '61-90 Days', daysFrom: 61, daysTo: 90, color: '#F97316' },
  { key: 'over_90', label: '90+ Days', daysFrom: 91, daysTo: null, color: '#EF4444' },
]

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseDateSafe(value: string | undefined): Date {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function getDaysDifference(fromDate: Date, toDate: Date): number {
  const msInDay = 24 * 60 * 60 * 1000
  return Math.max(0, Math.floor((fromDate.getTime() - toDate.getTime()) / msInDay))
}

function normalizeBucketKey(label: string): BucketKey {
  const normalized = label.toLowerCase()
  if (normalized.includes('31-60')) return 'days_31_60'
  if (normalized.includes('61-90')) return 'days_61_90'
  if (normalized.includes('90+') || normalized.includes('over 90')) return 'over_90'
  return 'current'
}

function buildBucketTotals(raw: RawReceivablesAgingResponse): Record<BucketKey, number> {
  const totals: Record<BucketKey, number> = {
    current: 0,
    days_31_60: 0,
    days_61_90: 0,
    over_90: 0,
  }

  for (const bucket of raw.summary?.buckets || []) {
    const key = normalizeBucketKey(bucket.label)
    totals[key] += toNumber(bucket.amount)
  }

  const hasValues = Object.values(totals).some((v) => v > 0)
  if (hasValues) {
    return totals
  }

  for (const client of raw.by_client || []) {
    totals.current += toNumber(client.current) + toNumber(client.days_1_30)
    totals.days_31_60 += toNumber(client.days_31_60)
    totals.days_61_90 += toNumber(client.days_61_90)
    totals.over_90 += toNumber(client.days_over_90)
  }
  return totals
}

function transformAgingAnalysis(
  raw: RawReceivablesAgingResponse,
  params: AgingSearchParams = {}
): AgingAnalysis {
  const bucketTotals = buildBucketTotals(raw)
  const totalOutstanding =
    toNumber(raw.summary?.total_receivables) ||
    bucketTotals.current +
      bucketTotals.days_31_60 +
      bucketTotals.days_61_90 +
      bucketTotals.over_90

  const asOfDate = raw.summary?.as_of_date || new Date().toISOString().slice(0, 10)
  const asOfDateObj = parseDateSafe(asOfDate)

  const clientSummaries = (raw.by_client || [])
    .map((client) => {
      const oldestDate = client.oldest_invoice_date ? parseDateSafe(client.oldest_invoice_date) : undefined
      return {
        clientId: client.client_id,
        clientName: client.client_name || '',
        clientAbbreviation: client.client_reference || undefined,
        current: toNumber(client.current) + toNumber(client.days_1_30),
        thirtyDays: toNumber(client.days_31_60),
        sixtyDays: toNumber(client.days_61_90),
        ninetyPlus: toNumber(client.days_over_90),
        totalOutstanding: toNumber(client.total_outstanding),
        invoiceCount: client.invoice_count ?? 0,
        oldestInvoiceDays: oldestDate ? getDaysDifference(asOfDateObj, oldestDate) : 0,
      }
    })
    .filter((item) => !params.clientId || item.clientId === params.clientId)

  const buckets = BUCKET_CONFIG.map((config) => {
    const amount = bucketTotals[config.key]
    return {
      label: config.label,
      daysFrom: config.daysFrom,
      daysTo: config.daysTo,
      amount,
      percentage: totalOutstanding > 0 ? (amount / totalOutstanding) * 100 : 0,
      invoiceCount: 0,
      color: config.color,
    }
  })

  return {
    generatedDate: asOfDate,
    totalOutstanding,
    buckets,
    clientSummaries,
    businessUnitId: params.businessUnitId,
    businessUnitName: params.businessUnitId ? `Business Unit #${params.businessUnitId}` : undefined,
  }
}

function sortInvoiceDetails(
  items: AgingInvoiceDetail[],
  sortBy: AgingSearchParams['sortBy'],
  sortOrder: AgingSearchParams['sortOrder']
): AgingInvoiceDetail[] {
  const direction = sortOrder === 'asc' ? 1 : -1
  const key = sortBy || 'daysOverdue'

  return [...items].sort((a, b) => {
    let comparison = 0

    if (key === 'invoiceCode') comparison = a.invoiceCode.localeCompare(b.invoiceCode)
    else if (key === 'clientName') comparison = a.clientName.localeCompare(b.clientName)
    else if (key === 'invoiceDate') comparison = a.invoiceDate.localeCompare(b.invoiceDate)
    else if (key === 'dueDate') comparison = a.dueDate.localeCompare(b.dueDate)
    else if (key === 'amountDue') comparison = a.amountDue - b.amountDue
    else comparison = a.daysOverdue - b.daysOverdue

    return comparison * direction
  })
}

function transformInvoiceDetails(
  raw: RawReceivablesAgingResponse,
  params: AgingSearchParams = {}
): PagedResponse<AgingInvoiceDetail> {
  const allItems: AgingInvoiceDetail[] = (raw.invoices || []).map((invoice) => ({
    invoiceId: invoice.invoice_id,
    invoiceCode: invoice.invoice_reference,
    invoiceName: invoice.invoice_reference,
    clientId: invoice.client_id,
    clientName: invoice.client_name,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    daysOverdue: invoice.days_overdue || 0,
    amountDue: toNumber(invoice.remaining_amount),
    amountPaid: toNumber(invoice.paid_amount),
    totalAmount: toNumber(invoice.total_amount),
    currencySymbol: invoice.currency_code || 'EUR',
    businessUnitId: params.businessUnitId,
    businessUnitName: params.businessUnitId ? `Business Unit #${params.businessUnitId}` : undefined,
  }))

  const filtered = allItems.filter((item) => {
    if (params.clientId && item.clientId !== params.clientId) return false
    if (params.minDaysOverdue !== undefined && item.daysOverdue < params.minDaysOverdue) return false
    return true
  })

  const sorted = sortInvoiceDetails(filtered, params.sortBy, params.sortOrder)

  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const start = (page - 1) * pageSize
  const paged = sorted.slice(start, start + pageSize)
  const totalCount = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    success: true,
    data: paged,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Aging API methods
 * Reuses backend receivables aging endpoint for compatibility.
 */
export const agingApi = {
  async getAnalysis(params: AgingSearchParams = {}): Promise<AgingAnalysis> {
    if (isMockEnabled()) {
      return mockHandlers.getAgingAnalysis(params)
    }

    const raw = await accountingApi.getReceivablesAgingRaw({
      asOfDate: params.asOfDate,
      clientId: params.clientId,
      includeInvoices: false,
    })
    return transformAgingAnalysis(raw, params)
  },

  async getInvoiceDetails(params: AgingSearchParams = {}): Promise<PagedResponse<AgingInvoiceDetail>> {
    if (isMockEnabled()) {
      return mockHandlers.getAgingInvoiceDetails(params)
    }

    const raw = await accountingApi.getReceivablesAgingRaw({
      asOfDate: params.asOfDate,
      clientId: params.clientId,
      includeInvoices: true,
    })
    return transformInvoiceDetails(raw, params)
  },

  async getTrendData(months: number = 6): Promise<AgingTrendPoint[]> {
    if (isMockEnabled()) {
      return mockHandlers.getAgingTrendData(months)
    }

    const analysis = await this.getAnalysis()
    const byLabel = new Map(analysis.buckets.map((bucket) => [bucket.label, bucket.amount]))
    const now = new Date()
    const points: AgingTrendPoint[] = []

    for (let i = months - 1; i >= 0; i -= 1) {
      const pointDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const current = byLabel.get('Current') || 0
      const thirtyDays = byLabel.get('31-60 Days') || 0
      const sixtyDays = byLabel.get('61-90 Days') || 0
      const ninetyPlus = byLabel.get('90+ Days') || 0
      const total = current + thirtyDays + sixtyDays + ninetyPlus

      points.push({
        date: pointDate.toISOString().slice(0, 10),
        current,
        thirtyDays,
        sixtyDays,
        ninetyPlus,
        total,
      })
    }

    return points
  },

  async getByBusinessUnit(): Promise<BusinessUnitAgingSummary[]> {
    if (isMockEnabled()) {
      return mockHandlers.getAgingByBusinessUnit()
    }

    const analysis = await this.getAnalysis()
    const current = analysis.buckets.find((b) => b.label === 'Current')?.amount || 0
    const thirtyDays = analysis.buckets.find((b) => b.label === '31-60 Days')?.amount || 0
    const sixtyDays = analysis.buckets.find((b) => b.label === '61-90 Days')?.amount || 0
    const ninetyPlus = analysis.buckets.find((b) => b.label === '90+ Days')?.amount || 0

    return [
      {
        businessUnitId: 0,
        businessUnitName: 'All Business Units',
        totalOutstanding: analysis.totalOutstanding,
        current,
        thirtyDays,
        sixtyDays,
        ninetyPlus,
        clientCount: analysis.clientSummaries.length,
        invoiceCount: analysis.clientSummaries.reduce((sum, item) => sum + item.invoiceCount, 0),
        color: '#3B82F6',
      },
    ]
  },

  async exportCSV(params: AgingSearchParams = {}): Promise<string> {
    if (isMockEnabled()) {
      return mockHandlers.exportAgingToCSV(params)
    }

    return accountingApi.exportReceivablesAging({
      asOfDate: params.asOfDate,
      clientId: params.clientId,
    })
  },
}
