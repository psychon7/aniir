import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '@/api/invoices'
import type {
  InvoiceSearchParams,
  InvoiceCreateDto,
  InvoiceUpdateDto,
  InvoiceLineCreateDto,
  InvoiceLineUpdateDto,
  InvoicePaymentCreateDto,
  InvoiceDiscountRequest,
} from '@/types/invoice'

// Query keys factory
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params: InvoiceSearchParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
  lines: (invoiceId: number) => [...invoiceKeys.detail(invoiceId), 'lines'] as const,
  payments: (invoiceId: number) => [...invoiceKeys.detail(invoiceId), 'payments'] as const,
  financialInfo: (id: number) => [...invoiceKeys.detail(id), 'financial-info'] as const,
  byProject: (projectId: number) => [...invoiceKeys.all, 'by-project', projectId] as const,
  byQuote: (quoteId: number) => [...invoiceKeys.all, 'by-quote', quoteId] as const,
}

/**
 * Hook to fetch paginated list of invoices
 */
export function useInvoices(params: InvoiceSearchParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoicesApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single invoice by ID
 */
export function useInvoice(id: number) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch invoice lines
 */
export function useInvoiceLines(invoiceId: number) {
  return useQuery({
    queryKey: invoiceKeys.lines(invoiceId),
    queryFn: () => invoicesApi.getLines(invoiceId),
    enabled: !!invoiceId,
  })
}

/**
 * Hook to fetch invoice payments
 */
export function useInvoicePayments(invoiceId: number) {
  return useQuery({
    queryKey: invoiceKeys.payments(invoiceId),
    queryFn: () => invoicesApi.getPayments(invoiceId),
    enabled: !!invoiceId,
  })
}

/**
 * Hook to fetch invoice financial info
 */
export function useInvoiceFinancialInfo(id: number) {
  return useQuery({
    queryKey: invoiceKeys.financialInfo(id),
    queryFn: () => invoicesApi.getFinancialInfo(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch invoices by project
 */
export function useInvoicesByProject(projectId: number) {
  return useQuery({
    queryKey: invoiceKeys.byProject(projectId),
    queryFn: () => invoicesApi.getByProject(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook to fetch invoices by quote
 */
export function useInvoicesByQuote(quoteId: number) {
  return useQuery({
    queryKey: invoiceKeys.byQuote(quoteId),
    queryFn: () => invoicesApi.getByQuote(quoteId),
    enabled: !!quoteId,
  })
}

/**
 * Hook to create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InvoiceCreateDto) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

/**
 * Hook to create invoice from order
 */
export function useCreateInvoiceFromOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, options }: { orderId: number; options?: { includeAllLines?: boolean } }) =>
      invoicesApi.createFromOrder(orderId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/**
 * Hook to create invoice from delivery
 */
export function useCreateInvoiceFromDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deliveryId }: { deliveryId: number }) =>
      invoicesApi.createFromDelivery(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/**
 * Hook to create invoices from deliveries in bulk
 */
export function useCreateInvoicesFromDeliveries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deliveryIds }: { deliveryIds?: number[] }) =>
      invoicesApi.createFromDeliveries(deliveryIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/**
 * Hook to update an existing invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: InvoiceUpdateDto }) =>
      invoicesApi.update(id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(invoiceKeys.detail(updatedInvoice.id), updatedInvoice)
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => invoicesApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

/**
 * Hook to send an invoice
 */
export function useSendInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, emailTo, message }: { id: number; emailTo?: string; message?: string }) =>
      invoicesApi.send(id, emailTo, message),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(invoiceKeys.detail(updatedInvoice.id), updatedInvoice)
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

/**
 * Hook to void an invoice
 */
export function useVoidInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      invoicesApi.void(id, reason),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(invoiceKeys.detail(updatedInvoice.id), updatedInvoice)
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

/**
 * Hook to update invoice-level discount
 */
export function useUpdateInvoiceDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: InvoiceDiscountRequest }) =>
      invoicesApi.updateDiscount(id, request),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(invoiceKeys.detail(updatedInvoice.id), updatedInvoice)
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.financialInfo(updatedInvoice.id) })
    },
  })
}

// ==================== Invoice Lines Mutations ====================

/**
 * Hook to add a line to an invoice
 */
export function useAddInvoiceLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, line }: { invoiceId: number; line: InvoiceLineCreateDto }) =>
      invoicesApi.addLine(invoiceId, line),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lines(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.financialInfo(invoiceId) })
    },
  })
}

/**
 * Hook to update an invoice line
 */
export function useUpdateInvoiceLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      invoiceId,
      lineId,
      line,
    }: {
      invoiceId: number
      lineId: number
      line: InvoiceLineUpdateDto
    }) => invoicesApi.updateLine(invoiceId, lineId, line),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lines(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.financialInfo(invoiceId) })
    },
  })
}

/**
 * Hook to delete an invoice line
 */
export function useDeleteInvoiceLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, lineId }: { invoiceId: number; lineId: number }) =>
      invoicesApi.deleteLine(invoiceId, lineId),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lines(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.financialInfo(invoiceId) })
    },
  })
}

// ==================== Invoice Payments Mutations ====================

/**
 * Hook to record a payment for an invoice
 */
export function useRecordInvoicePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, payment }: { invoiceId: number; payment: InvoicePaymentCreateDto }) =>
      invoicesApi.recordPayment(invoiceId, payment),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.payments(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.financialInfo(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

/**
 * Hook to delete a payment
 */
export function useDeleteInvoicePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, paymentId }: { invoiceId: number; paymentId: number }) =>
      invoicesApi.deletePayment(invoiceId, paymentId),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.payments(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.financialInfo(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

// ==================== PDF Hooks ====================

/**
 * Hook to download invoice PDF
 */
export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: (id: number) => invoicesApi.downloadPdf(id),
    onSuccess: (blob, invoiceId) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `invoice-${invoiceId}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}
