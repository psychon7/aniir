/**
 * Mock handlers for accounting API
 */
import { delay } from '../delay'
import type {
  AllocatableInvoice,
  AllocatePaymentRequest,
  AllocatePaymentResponse,
  PaymentWithAllocation,
} from '@/types/allocation'
import type {
  ReceivablesAgingParams,
  ReceivablesAgingResponse,
  ClientAgingItem,
  InvoiceAgingItem,
  AgingSummary,
} from '@/types/receivables'
import type {
  AgingAnalysis,
  AgingSearchParams,
  AgingInvoiceDetail,
  AgingTrendPoint,
  BusinessUnitAgingSummary,
  ClientAgingSummary,
  AgingBucket,
} from '@/types/aging'
import type { PagedResponse } from '@/types/api'

// Mock unpaid invoices by client
const mockUnpaidInvoices: Record<number, AllocatableInvoice[]> = {
  1: [
    {
      id: 101,
      code: 'INV-2025-001',
      clientId: 1,
      clientName: 'Acme Corporation',
      invoiceDate: '2025-01-05',
      termDate: '2025-02-04',
      totalAmount: 5000.00,
      paidAmount: 0,
      balanceDue: 5000.00,
      currencyCode: 'EUR',
      isOverdue: false,
      daysOverdue: 0,
    },
    {
      id: 102,
      code: 'INV-2025-002',
      clientId: 1,
      clientName: 'Acme Corporation',
      invoiceDate: '2024-12-15',
      termDate: '2025-01-14',
      totalAmount: 3500.00,
      paidAmount: 1000.00,
      balanceDue: 2500.00,
      currencyCode: 'EUR',
      isOverdue: true,
      daysOverdue: 17,
    },
    {
      id: 103,
      code: 'INV-2025-003',
      clientId: 1,
      clientName: 'Acme Corporation',
      invoiceDate: '2025-01-10',
      termDate: '2025-02-09',
      totalAmount: 1200.00,
      paidAmount: 0,
      balanceDue: 1200.00,
      currencyCode: 'EUR',
      isOverdue: false,
      daysOverdue: 0,
    },
  ],
  2: [
    {
      id: 201,
      code: 'INV-2025-010',
      clientId: 2,
      clientName: 'TechStart Inc.',
      invoiceDate: '2025-01-08',
      termDate: '2025-02-07',
      totalAmount: 8500.00,
      paidAmount: 2000.00,
      balanceDue: 6500.00,
      currencyCode: 'EUR',
      isOverdue: false,
      daysOverdue: 0,
    },
    {
      id: 202,
      code: 'INV-2025-011',
      clientId: 2,
      clientName: 'TechStart Inc.',
      invoiceDate: '2024-11-20',
      termDate: '2024-12-20',
      totalAmount: 2200.00,
      paidAmount: 0,
      balanceDue: 2200.00,
      currencyCode: 'EUR',
      isOverdue: true,
      daysOverdue: 42,
    },
  ],
  3: [
    {
      id: 301,
      code: 'INV-2025-020',
      clientId: 3,
      clientName: 'Global Solutions Ltd.',
      invoiceDate: '2025-01-12',
      termDate: '2025-02-11',
      totalAmount: 15000.00,
      paidAmount: 5000.00,
      balanceDue: 10000.00,
      currencyCode: 'EUR',
      isOverdue: false,
      daysOverdue: 0,
    },
  ],
}

// Mock payments with allocation info
const mockPayments: Record<number, PaymentWithAllocation> = {
  1: {
    id: 1,
    reference: 'PAY-2025-001',
    clientId: 1,
    clientName: 'Acme Corporation',
    amount: 5000.00,
    allocatedAmount: 0,
    unallocatedAmount: 5000.00,
    currencyCode: 'EUR',
    paymentDate: '2025-01-20',
    statusName: 'Completed',
  },
  2: {
    id: 2,
    reference: 'PAY-2025-002',
    clientId: 2,
    clientName: 'TechStart Inc.',
    amount: 3000.00,
    allocatedAmount: 500.00,
    unallocatedAmount: 2500.00,
    currencyCode: 'EUR',
    paymentDate: '2025-01-18',
    statusName: 'Completed',
  },
  3: {
    id: 3,
    reference: 'PAY-2025-003',
    clientId: 3,
    clientName: 'Global Solutions Ltd.',
    amount: 7500.00,
    allocatedAmount: 0,
    unallocatedAmount: 7500.00,
    currencyCode: 'EUR',
    paymentDate: '2025-01-22',
    statusName: 'Completed',
  },
}

/**
 * Get payment details for allocation
 */
export async function getPaymentForAllocation(paymentId: number): Promise<PaymentWithAllocation> {
  await delay()

  const payment = mockPayments[paymentId]
  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`)
  }

  return { ...payment }
}

/**
 * Get unpaid invoices for a client
 */
export async function getClientUnpaidInvoices(clientId: number): Promise<AllocatableInvoice[]> {
  await delay()

  const invoices = mockUnpaidInvoices[clientId] || []
  return invoices.map(inv => ({ ...inv }))
}

/**
 * Allocate payment to invoices
 */
export async function allocatePayment(
  paymentId: number,
  request: AllocatePaymentRequest
): Promise<AllocatePaymentResponse> {
  await delay()

  const payment = mockPayments[paymentId]
  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`)
  }

  const invoices = mockUnpaidInvoices[payment.clientId] || []
  let totalAllocated = 0
  const allocationResults = []

  for (const allocation of request.allocations) {
    const invoice = invoices.find(i => i.id === allocation.invoiceId)
    if (!invoice) {
      throw new Error(`Invoice ${allocation.invoiceId} not found`)
    }

    if (allocation.amount > invoice.balanceDue) {
      throw new Error(`Allocation amount exceeds invoice balance for ${invoice.code}`)
    }

    if (totalAllocated + allocation.amount > payment.unallocatedAmount) {
      throw new Error('Total allocation exceeds available payment amount')
    }

    // Update mock data
    invoice.paidAmount += allocation.amount
    invoice.balanceDue -= allocation.amount
    totalAllocated += allocation.amount

    let newStatus = 'Unpaid'
    if (invoice.balanceDue === 0) {
      newStatus = 'Paid'
    } else if (invoice.paidAmount > 0) {
      newStatus = 'Partial'
    }

    allocationResults.push({
      invoiceId: invoice.id,
      invoiceCode: invoice.code,
      allocatedAmount: allocation.amount,
      newPaidAmount: invoice.paidAmount,
      newBalanceDue: invoice.balanceDue,
      newStatus,
    })
  }

  // Update payment
  payment.allocatedAmount += totalAllocated
  payment.unallocatedAmount -= totalAllocated

  return {
    success: true,
    paymentId: payment.id,
    totalAllocated,
    remainingUnallocated: payment.unallocatedAmount,
    allocations: allocationResults,
  }
}

/**
 * Auto-allocate payment using FIFO
 */
export async function autoAllocatePayment(paymentId: number): Promise<AllocatePaymentResponse> {
  await delay()

  const payment = mockPayments[paymentId]
  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`)
  }

  const invoices = mockUnpaidInvoices[payment.clientId] || []

  // Sort by invoice date (FIFO - oldest first)
  const sortedInvoices = [...invoices]
    .filter(inv => inv.balanceDue > 0)
    .sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime())

  let remainingAmount = payment.unallocatedAmount
  let totalAllocated = 0
  const allocationResults = []

  for (const invoice of sortedInvoices) {
    if (remainingAmount <= 0) break

    const allocationAmount = Math.min(remainingAmount, invoice.balanceDue)

    // Update mock data
    invoice.paidAmount += allocationAmount
    invoice.balanceDue -= allocationAmount
    remainingAmount -= allocationAmount
    totalAllocated += allocationAmount

    let newStatus = 'Unpaid'
    if (invoice.balanceDue === 0) {
      newStatus = 'Paid'
    } else if (invoice.paidAmount > 0) {
      newStatus = 'Partial'
    }

    allocationResults.push({
      invoiceId: invoice.id,
      invoiceCode: invoice.code,
      allocatedAmount: allocationAmount,
      newPaidAmount: invoice.paidAmount,
      newBalanceDue: invoice.balanceDue,
      newStatus,
    })
  }

  // Update payment
  payment.allocatedAmount += totalAllocated
  payment.unallocatedAmount = remainingAmount

  return {
    success: true,
    paymentId: payment.id,
    totalAllocated,
    remainingUnallocated: remainingAmount,
    allocations: allocationResults,
  }
}

// ==========================================================================
// Receivables Aging Report Mock Data
// ==========================================================================

/**
 * Mock receivables aging invoice data
 */
const mockReceivablesAgingInvoices: InvoiceAgingItem[] = [
  // Acme Corporation invoices
  {
    invoiceId: 101,
    invoiceReference: 'INV-2025-001',
    invoiceDate: '2025-01-05',
    dueDate: '2025-02-04',
    totalAmount: 5000.00,
    paidAmount: 0,
    balanceDue: 5000.00,
    daysOverdue: 0,
    bucket: '0-30',
  },
  {
    invoiceId: 102,
    invoiceReference: 'INV-2024-089',
    invoiceDate: '2024-12-01',
    dueDate: '2024-12-31',
    totalAmount: 3500.00,
    paidAmount: 1000.00,
    balanceDue: 2500.00,
    daysOverdue: 31,
    bucket: '31-60',
  },
  {
    invoiceId: 103,
    invoiceReference: 'INV-2024-075',
    invoiceDate: '2024-10-15',
    dueDate: '2024-11-14',
    totalAmount: 7800.00,
    paidAmount: 0,
    balanceDue: 7800.00,
    daysOverdue: 78,
    bucket: '61-90',
  },
  {
    invoiceId: 104,
    invoiceReference: 'INV-2024-045',
    invoiceDate: '2024-08-20',
    dueDate: '2024-09-19',
    totalAmount: 4200.00,
    paidAmount: 0,
    balanceDue: 4200.00,
    daysOverdue: 134,
    bucket: '90+',
  },
  // TechStart SAS invoices
  {
    invoiceId: 201,
    invoiceReference: 'INV-2025-008',
    invoiceDate: '2025-01-10',
    dueDate: '2025-02-09',
    totalAmount: 12500.00,
    paidAmount: 0,
    balanceDue: 12500.00,
    daysOverdue: 0,
    bucket: '0-30',
  },
  {
    invoiceId: 202,
    invoiceReference: 'INV-2024-092',
    invoiceDate: '2024-12-05',
    dueDate: '2025-01-04',
    totalAmount: 8700.00,
    paidAmount: 3000.00,
    balanceDue: 5700.00,
    daysOverdue: 27,
    bucket: '0-30',
  },
  {
    invoiceId: 203,
    invoiceReference: 'INV-2024-068',
    invoiceDate: '2024-09-28',
    dueDate: '2024-10-28',
    totalAmount: 15000.00,
    paidAmount: 0,
    balanceDue: 15000.00,
    daysOverdue: 95,
    bucket: '90+',
  },
  // Global Industries GmbH invoices
  {
    invoiceId: 301,
    invoiceReference: 'INV-2025-012',
    invoiceDate: '2025-01-15',
    dueDate: '2025-02-14',
    totalAmount: 22000.00,
    paidAmount: 10000.00,
    balanceDue: 12000.00,
    daysOverdue: 0,
    bucket: '0-30',
  },
  {
    invoiceId: 302,
    invoiceReference: 'INV-2024-095',
    invoiceDate: '2024-11-20',
    dueDate: '2024-12-20',
    totalAmount: 9500.00,
    paidAmount: 0,
    balanceDue: 9500.00,
    daysOverdue: 42,
    bucket: '31-60',
  },
  // Metro Services Ltd invoices
  {
    invoiceId: 401,
    invoiceReference: 'INV-2024-082',
    invoiceDate: '2024-11-01',
    dueDate: '2024-12-01',
    totalAmount: 6300.00,
    paidAmount: 0,
    balanceDue: 6300.00,
    daysOverdue: 61,
    bucket: '61-90',
  },
  {
    invoiceId: 402,
    invoiceReference: 'INV-2024-055',
    invoiceDate: '2024-09-05',
    dueDate: '2024-10-05',
    totalAmount: 4100.00,
    paidAmount: 0,
    balanceDue: 4100.00,
    daysOverdue: 118,
    bucket: '90+',
  },
  // Illumina Italia SpA invoices
  {
    invoiceId: 501,
    invoiceReference: 'INV-2025-003',
    invoiceDate: '2025-01-08',
    dueDate: '2025-02-07',
    totalAmount: 18500.00,
    paidAmount: 0,
    balanceDue: 18500.00,
    daysOverdue: 0,
    bucket: '0-30',
  },
  // Shenzhen Electronics Ltd invoices
  {
    invoiceId: 601,
    invoiceReference: 'INV-2024-088',
    invoiceDate: '2024-11-25',
    dueDate: '2024-12-25',
    totalAmount: 45000.00,
    paidAmount: 20000.00,
    balanceDue: 25000.00,
    daysOverdue: 37,
    bucket: '31-60',
  },
  {
    invoiceId: 602,
    invoiceReference: 'INV-2024-050',
    invoiceDate: '2024-08-10',
    dueDate: '2024-09-09',
    totalAmount: 32000.00,
    paidAmount: 0,
    balanceDue: 32000.00,
    daysOverdue: 144,
    bucket: '90+',
  },
]

// Client info mapping for receivables aging
const receivablesClientInfo: Record<number, { id: number; reference: string; name: string }> = {
  1: { id: 1, reference: 'CLI-001', name: 'Acme Corporation' },
  2: { id: 2, reference: 'CLI-002', name: 'TechStart SAS' },
  3: { id: 3, reference: 'CLI-003', name: 'Global Industries GmbH' },
  5: { id: 5, reference: 'CLI-005', name: 'Metro Services Ltd' },
  7: { id: 7, reference: 'CLI-007', name: 'Illumina Italia SpA' },
  8: { id: 8, reference: 'CLI-008', name: 'Shenzhen Electronics Ltd' },
}

// Invoice to client mapping
const receivablesInvoiceClientMapping: Record<number, number> = {
  101: 1, 102: 1, 103: 1, 104: 1,
  201: 2, 202: 2, 203: 2,
  301: 3, 302: 3,
  401: 5, 402: 5,
  501: 7,
  601: 8, 602: 8,
}

/**
 * Get receivables aging report
 */
export async function getReceivablesAging(
  params: ReceivablesAgingParams = {}
): Promise<ReceivablesAgingResponse> {
  await delay(500)

  const asOfDate = params.asOfDate || new Date().toISOString().slice(0, 10)

  // Filter invoices if search is provided
  let filteredInvoices = [...mockReceivablesAgingInvoices]

  if (params.search) {
    const search = params.search.toLowerCase()
    filteredInvoices = filteredInvoices.filter((inv) => {
      const clientId = receivablesInvoiceClientMapping[inv.invoiceId]
      const client = receivablesClientInfo[clientId]
      return (
        inv.invoiceReference.toLowerCase().includes(search) ||
        client?.name.toLowerCase().includes(search) ||
        client?.reference.toLowerCase().includes(search)
      )
    })
  }

  // Group invoices by client
  const clientMap = new Map<number, InvoiceAgingItem[]>()

  for (const invoice of filteredInvoices) {
    const clientId = receivablesInvoiceClientMapping[invoice.invoiceId]
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, [])
    }
    clientMap.get(clientId)!.push(invoice)
  }

  // Build client aging items
  const byClient: ClientAgingItem[] = []
  const summary: AgingSummary = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
  let totalReceivables = 0

  for (const [clientId, invoices] of clientMap) {
    const client = receivablesClientInfo[clientId]
    if (!client) continue

    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
    let clientTotal = 0

    for (const invoice of invoices) {
      buckets[invoice.bucket] += invoice.balanceDue
      clientTotal += invoice.balanceDue
      summary[invoice.bucket] += invoice.balanceDue
      totalReceivables += invoice.balanceDue
    }

    byClient.push({
      clientId: client.id,
      clientReference: client.reference,
      clientName: client.name,
      buckets,
      total: clientTotal,
      invoices: invoices.sort((a, b) => b.daysOverdue - a.daysOverdue),
    })
  }

  // Sort by total (highest first)
  byClient.sort((a, b) => b.total - a.total)

  return {
    success: true,
    asOfDate,
    summary,
    totalReceivables,
    byClient,
    filters: {
      companyId: params.companyId,
      buId: params.buId,
    },
  }
}

/**
 * Export receivables aging report to CSV
 */
export async function exportReceivablesAgingToCSV(
  params: ReceivablesAgingParams = {}
): Promise<string> {
  await delay(600)

  const report = await getReceivablesAging(params)

  const headers = [
    'Client Reference',
    'Client Name',
    'Invoice Reference',
    'Invoice Date',
    'Due Date',
    'Total Amount',
    'Paid Amount',
    'Balance Due',
    'Days Overdue',
    'Aging Bucket',
  ]

  const rows: string[][] = []

  for (const client of report.byClient) {
    for (const invoice of client.invoices) {
      rows.push([
        client.clientReference,
        client.clientName,
        invoice.invoiceReference,
        invoice.invoiceDate,
        invoice.dueDate,
        invoice.totalAmount.toFixed(2),
        invoice.paidAmount.toFixed(2),
        invoice.balanceDue.toFixed(2),
        invoice.daysOverdue.toString(),
        invoice.bucket,
      ])
    }
  }

  // Add summary rows
  rows.push([])
  rows.push(['SUMMARY'])
  rows.push(['Bucket', '', '', '', '', '', '', 'Amount'])
  rows.push(['Current (0-30 days)', '', '', '', '', '', '', report.summary['0-30'].toFixed(2)])
  rows.push(['31-60 days', '', '', '', '', '', '', report.summary['31-60'].toFixed(2)])
  rows.push(['61-90 days', '', '', '', '', '', '', report.summary['61-90'].toFixed(2)])
  rows.push(['Over 90 days', '', '', '', '', '', '', report.summary['90+'].toFixed(2)])
  rows.push(['TOTAL', '', '', '', '', '', '', report.totalReceivables.toFixed(2)])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

// ==== AGING ANALYSIS MOCK DATA ====

const mockAgingInvoices: AgingInvoiceDetail[] = [
  // Current (0-30 days)
  {
    invoiceId: 1001,
    invoiceCode: 'INV-2025-101',
    invoiceName: 'Project Alpha Q1',
    clientId: 1,
    clientName: 'Acme Corporation',
    invoiceDate: '2025-01-15',
    dueDate: '2025-02-14',
    daysOverdue: 0,
    amountDue: 12500.00,
    amountPaid: 0,
    totalAmount: 12500.00,
    currencySymbol: 'EUR',
    businessUnitId: 1,
    businessUnitName: 'LED',
  },
  {
    invoiceId: 1002,
    invoiceCode: 'INV-2025-102',
    invoiceName: 'Maintenance Contract',
    clientId: 2,
    clientName: 'TechStart Inc.',
    invoiceDate: '2025-01-10',
    dueDate: '2025-02-09',
    daysOverdue: 0,
    amountDue: 8750.00,
    amountPaid: 2500.00,
    totalAmount: 11250.00,
    currencySymbol: 'EUR',
    businessUnitId: 2,
    businessUnitName: 'Domotics',
  },
  // 31-60 days
  {
    invoiceId: 1003,
    invoiceCode: 'INV-2024-089',
    invoiceName: 'HVAC Installation',
    clientId: 3,
    clientName: 'Global Solutions Ltd.',
    invoiceDate: '2024-12-01',
    dueDate: '2024-12-31',
    daysOverdue: 31,
    amountDue: 25000.00,
    amountPaid: 10000.00,
    totalAmount: 35000.00,
    currencySymbol: 'EUR',
    businessUnitId: 3,
    businessUnitName: 'HVAC',
  },
  {
    invoiceId: 1004,
    invoiceCode: 'INV-2024-091',
    invoiceName: 'Smart Home Setup',
    clientId: 4,
    clientName: 'Innovation Labs',
    invoiceDate: '2024-12-05',
    dueDate: '2025-01-04',
    daysOverdue: 27,
    amountDue: 15600.00,
    amountPaid: 0,
    totalAmount: 15600.00,
    currencySymbol: 'EUR',
    businessUnitId: 2,
    businessUnitName: 'Domotics',
  },
  // 61-90 days
  {
    invoiceId: 1005,
    invoiceCode: 'INV-2024-072',
    invoiceName: 'LED Retrofit Project',
    clientId: 5,
    clientName: 'BuildRight Construction',
    invoiceDate: '2024-11-01',
    dueDate: '2024-12-01',
    daysOverdue: 61,
    amountDue: 45000.00,
    amountPaid: 20000.00,
    totalAmount: 65000.00,
    currencySymbol: 'EUR',
    businessUnitId: 1,
    businessUnitName: 'LED',
  },
  {
    invoiceId: 1006,
    invoiceCode: 'INV-2024-075',
    invoiceName: 'Wave Concept System',
    clientId: 6,
    clientName: 'Marine Tech Systems',
    invoiceDate: '2024-11-10',
    dueDate: '2024-12-10',
    daysOverdue: 52,
    amountDue: 18500.00,
    amountPaid: 5000.00,
    totalAmount: 23500.00,
    currencySymbol: 'EUR',
    businessUnitId: 4,
    businessUnitName: 'Wave Concept',
  },
  // 90+ days
  {
    invoiceId: 1007,
    invoiceCode: 'INV-2024-055',
    invoiceName: 'Annual Service Contract',
    clientId: 7,
    clientName: 'Stellar Enterprises',
    invoiceDate: '2024-09-15',
    dueDate: '2024-10-15',
    daysOverdue: 108,
    amountDue: 32000.00,
    amountPaid: 8000.00,
    totalAmount: 40000.00,
    currencySymbol: 'EUR',
    businessUnitId: 3,
    businessUnitName: 'HVAC',
  },
  {
    invoiceId: 1008,
    invoiceCode: 'INV-2024-048',
    invoiceName: 'Commercial Lighting',
    clientId: 8,
    clientName: 'Metro Development',
    invoiceDate: '2024-08-20',
    dueDate: '2024-09-19',
    daysOverdue: 134,
    amountDue: 55000.00,
    amountPaid: 0,
    totalAmount: 55000.00,
    currencySymbol: 'EUR',
    businessUnitId: 1,
    businessUnitName: 'LED',
  },
  {
    invoiceId: 1009,
    invoiceCode: 'INV-2024-042',
    invoiceName: 'Accessories Order',
    clientId: 1,
    clientName: 'Acme Corporation',
    invoiceDate: '2024-07-15',
    dueDate: '2024-08-14',
    daysOverdue: 170,
    amountDue: 8500.00,
    amountPaid: 0,
    totalAmount: 8500.00,
    currencySymbol: 'EUR',
    businessUnitId: 5,
    businessUnitName: 'Accessories',
  },
]

function calculateAgingBuckets(invoices: AgingInvoiceDetail[]): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { label: 'Current', daysFrom: 0, daysTo: 30, amount: 0, percentage: 0, invoiceCount: 0, color: '#10B981' },
    { label: '31-60 Days', daysFrom: 31, daysTo: 60, amount: 0, percentage: 0, invoiceCount: 0, color: '#F59E0B' },
    { label: '61-90 Days', daysFrom: 61, daysTo: 90, amount: 0, percentage: 0, invoiceCount: 0, color: '#F97316' },
    { label: '90+ Days', daysFrom: 91, daysTo: null, amount: 0, percentage: 0, invoiceCount: 0, color: '#EF4444' },
  ]

  let totalAmount = 0

  for (const invoice of invoices) {
    totalAmount += invoice.amountDue

    if (invoice.daysOverdue <= 30) {
      buckets[0].amount += invoice.amountDue
      buckets[0].invoiceCount++
    } else if (invoice.daysOverdue <= 60) {
      buckets[1].amount += invoice.amountDue
      buckets[1].invoiceCount++
    } else if (invoice.daysOverdue <= 90) {
      buckets[2].amount += invoice.amountDue
      buckets[2].invoiceCount++
    } else {
      buckets[3].amount += invoice.amountDue
      buckets[3].invoiceCount++
    }
  }

  // Calculate percentages
  for (const bucket of buckets) {
    bucket.percentage = totalAmount > 0 ? (bucket.amount / totalAmount) * 100 : 0
  }

  return buckets
}

function calculateClientSummaries(invoices: AgingInvoiceDetail[]): ClientAgingSummary[] {
  const clientMap = new Map<number, ClientAgingSummary>()

  for (const invoice of invoices) {
    let summary = clientMap.get(invoice.clientId)
    if (!summary) {
      summary = {
        clientId: invoice.clientId,
        clientName: invoice.clientName,
        current: 0,
        thirtyDays: 0,
        sixtyDays: 0,
        ninetyPlus: 0,
        totalOutstanding: 0,
        invoiceCount: 0,
        oldestInvoiceDays: 0,
      }
      clientMap.set(invoice.clientId, summary)
    }

    summary.totalOutstanding += invoice.amountDue
    summary.invoiceCount++
    summary.oldestInvoiceDays = Math.max(summary.oldestInvoiceDays, invoice.daysOverdue)

    if (invoice.daysOverdue <= 30) {
      summary.current += invoice.amountDue
    } else if (invoice.daysOverdue <= 60) {
      summary.thirtyDays += invoice.amountDue
    } else if (invoice.daysOverdue <= 90) {
      summary.sixtyDays += invoice.amountDue
    } else {
      summary.ninetyPlus += invoice.amountDue
    }
  }

  return Array.from(clientMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding)
}

/**
 * Get aging analysis
 */
export async function getAgingAnalysis(params: AgingSearchParams = {}): Promise<AgingAnalysis> {
  await delay()

  let filteredInvoices = [...mockAgingInvoices]

  if (params.clientId) {
    filteredInvoices = filteredInvoices.filter(i => i.clientId === params.clientId)
  }

  if (params.businessUnitId) {
    filteredInvoices = filteredInvoices.filter(i => i.businessUnitId === params.businessUnitId)
  }

  if (params.minDaysOverdue) {
    filteredInvoices = filteredInvoices.filter(i => i.daysOverdue >= params.minDaysOverdue!)
  }

  const buckets = calculateAgingBuckets(filteredInvoices)
  const clientSummaries = calculateClientSummaries(filteredInvoices)
  const totalOutstanding = filteredInvoices.reduce((sum, i) => sum + i.amountDue, 0)

  return {
    generatedDate: new Date().toISOString(),
    totalOutstanding,
    buckets,
    clientSummaries,
    businessUnitId: params.businessUnitId,
  }
}

/**
 * Get aging invoice details
 */
export async function getAgingInvoiceDetails(params: AgingSearchParams = {}): Promise<PagedResponse<AgingInvoiceDetail>> {
  await delay()

  let filteredInvoices = [...mockAgingInvoices]

  if (params.clientId) {
    filteredInvoices = filteredInvoices.filter(i => i.clientId === params.clientId)
  }

  if (params.businessUnitId) {
    filteredInvoices = filteredInvoices.filter(i => i.businessUnitId === params.businessUnitId)
  }

  if (params.minDaysOverdue) {
    filteredInvoices = filteredInvoices.filter(i => i.daysOverdue >= params.minDaysOverdue!)
  }

  // Sort
  const sortBy = params.sortBy || 'daysOverdue'
  const sortOrder = params.sortOrder || 'desc'
  filteredInvoices.sort((a, b) => {
    const aVal = a[sortBy as keyof AgingInvoiceDetail] ?? 0
    const bVal = b[sortBy as keyof AgingInvoiceDetail] ?? 0
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }
    return sortOrder === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })

  // Paginate
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const startIndex = (page - 1) * pageSize
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize)

  return {
    success: true,
    data: paginatedInvoices,
    page,
    pageSize,
    totalCount: filteredInvoices.length,
    totalPages: Math.ceil(filteredInvoices.length / pageSize),
    hasNextPage: page < Math.ceil(filteredInvoices.length / pageSize),
    hasPreviousPage: page > 1,
  }
}

/**
 * Get aging trend data
 */
export async function getAgingTrendData(months: number = 6): Promise<AgingTrendPoint[]> {
  await delay()

  const trends: AgingTrendPoint[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const dateStr = date.toISOString().slice(0, 7)

    // Generate realistic trending data
    const baseTotal = 200000 + Math.random() * 50000
    const current = baseTotal * (0.35 + Math.random() * 0.1)
    const thirtyDays = baseTotal * (0.25 + Math.random() * 0.1)
    const sixtyDays = baseTotal * (0.2 + Math.random() * 0.08)
    const ninetyPlus = baseTotal - current - thirtyDays - sixtyDays

    trends.push({
      date: dateStr,
      current: Math.round(current),
      thirtyDays: Math.round(thirtyDays),
      sixtyDays: Math.round(sixtyDays),
      ninetyPlus: Math.round(ninetyPlus),
      total: Math.round(baseTotal),
    })
  }

  return trends
}

/**
 * Get aging by business unit
 */
export async function getAgingByBusinessUnit(): Promise<BusinessUnitAgingSummary[]> {
  await delay()

  const buColors: Record<string, string> = {
    LED: '#3B82F6',
    Domotics: '#EC4899',
    HVAC: '#10B981',
    'Wave Concept': '#F97316',
    Accessories: '#8B5CF6',
  }

  const buMap = new Map<number, BusinessUnitAgingSummary>()

  for (const invoice of mockAgingInvoices) {
    if (!invoice.businessUnitId) continue

    let summary = buMap.get(invoice.businessUnitId)
    if (!summary) {
      summary = {
        businessUnitId: invoice.businessUnitId,
        businessUnitName: invoice.businessUnitName || 'Unknown',
        totalOutstanding: 0,
        current: 0,
        thirtyDays: 0,
        sixtyDays: 0,
        ninetyPlus: 0,
        clientCount: 0,
        invoiceCount: 0,
        color: buColors[invoice.businessUnitName || ''] || '#6B7280',
      }
      buMap.set(invoice.businessUnitId, summary)
    }

    summary.totalOutstanding += invoice.amountDue
    summary.invoiceCount++

    if (invoice.daysOverdue <= 30) {
      summary.current += invoice.amountDue
    } else if (invoice.daysOverdue <= 60) {
      summary.thirtyDays += invoice.amountDue
    } else if (invoice.daysOverdue <= 90) {
      summary.sixtyDays += invoice.amountDue
    } else {
      summary.ninetyPlus += invoice.amountDue
    }
  }

  // Count unique clients per BU
  for (const [buId, summary] of buMap) {
    const clientIds = new Set(
      mockAgingInvoices.filter(i => i.businessUnitId === buId).map(i => i.clientId)
    )
    summary.clientCount = clientIds.size
  }

  return Array.from(buMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding)
}

/**
 * Export aging to CSV
 */
export async function exportAgingToCSV(params: AgingSearchParams = {}): Promise<string> {
  await delay()

  let filteredInvoices = [...mockAgingInvoices]

  if (params.clientId) {
    filteredInvoices = filteredInvoices.filter(i => i.clientId === params.clientId)
  }

  if (params.businessUnitId) {
    filteredInvoices = filteredInvoices.filter(i => i.businessUnitId === params.businessUnitId)
  }

  const headers = ['Invoice Code', 'Client', 'Invoice Date', 'Due Date', 'Days Overdue', 'Amount Due', 'Business Unit']
  const rows = filteredInvoices.map(i => [
    i.invoiceCode,
    i.clientName,
    i.invoiceDate,
    i.dueDate,
    i.daysOverdue.toString(),
    i.amountDue.toFixed(2),
    i.businessUnitName || '',
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

/**
 * Reset mock data (for testing)
 */
export function resetMockAccountingData(): void {
  // Reset invoices
  mockUnpaidInvoices[1] = [
    {
      id: 101,
      code: 'INV-2025-001',
      clientId: 1,
      clientName: 'Acme Corporation',
      invoiceDate: '2025-01-05',
      termDate: '2025-02-04',
      totalAmount: 5000.00,
      paidAmount: 0,
      balanceDue: 5000.00,
      currencyCode: 'EUR',
      isOverdue: false,
      daysOverdue: 0,
    },
    {
      id: 102,
      code: 'INV-2025-002',
      clientId: 1,
      clientName: 'Acme Corporation',
      invoiceDate: '2024-12-15',
      termDate: '2025-01-14',
      totalAmount: 3500.00,
      paidAmount: 1000.00,
      balanceDue: 2500.00,
      currencyCode: 'EUR',
      isOverdue: true,
      daysOverdue: 17,
    },
    {
      id: 103,
      code: 'INV-2025-003',
      clientId: 1,
      clientName: 'Acme Corporation',
      invoiceDate: '2025-01-10',
      termDate: '2025-02-09',
      totalAmount: 1200.00,
      paidAmount: 0,
      balanceDue: 1200.00,
      currencyCode: 'EUR',
      isOverdue: false,
      daysOverdue: 0,
    },
  ]

  // Reset payments
  mockPayments[1] = {
    id: 1,
    reference: 'PAY-2025-001',
    clientId: 1,
    clientName: 'Acme Corporation',
    amount: 5000.00,
    allocatedAmount: 0,
    unallocatedAmount: 5000.00,
    currencyCode: 'EUR',
    paymentDate: '2025-01-20',
    statusName: 'Completed',
  }
  mockPayments[2] = {
    id: 2,
    reference: 'PAY-2025-002',
    clientId: 2,
    clientName: 'TechStart Inc.',
    amount: 3000.00,
    allocatedAmount: 500.00,
    unallocatedAmount: 2500.00,
    currencyCode: 'EUR',
    paymentDate: '2025-01-18',
    statusName: 'Completed',
  }
  mockPayments[3] = {
    id: 3,
    reference: 'PAY-2025-003',
    clientId: 3,
    clientName: 'Global Solutions Ltd.',
    amount: 7500.00,
    allocatedAmount: 0,
    unallocatedAmount: 7500.00,
    currencyCode: 'EUR',
    paymentDate: '2025-01-22',
    statusName: 'Completed',
  }
}
