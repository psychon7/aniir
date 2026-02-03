import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supplierInvoicesApi } from '@/api/supplierInvoices'
import type {
  SupplierInvoiceSearchParams,
  SupplierInvoiceCreateDto,
  SupplierInvoiceUpdateDto,
  SupplierInvoiceLineCreateDto,
  SupplierInvoiceLineUpdateDto,
  MarkPaidRequest,
  MarkUnpaidRequest,
  StartProductionRequest,
  CompleteProductionRequest,
} from '@/types/supplierInvoice'

// Query keys factory
export const supplierInvoiceKeys = {
  all: ['supplier-invoices'] as const,
  lists: () => [...supplierInvoiceKeys.all, 'list'] as const,
  list: (params: SupplierInvoiceSearchParams) => [...supplierInvoiceKeys.lists(), params] as const,
  details: () => [...supplierInvoiceKeys.all, 'detail'] as const,
  detail: (id: number) => [...supplierInvoiceKeys.details(), id] as const,
  lines: (invoiceId: number) => [...supplierInvoiceKeys.detail(invoiceId), 'lines'] as const,
}

/**
 * Hook to fetch paginated list of supplier invoices
 */
export function useSupplierInvoices(params: SupplierInvoiceSearchParams = {}) {
  return useQuery({
    queryKey: supplierInvoiceKeys.list(params),
    queryFn: () => supplierInvoicesApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single supplier invoice by ID
 */
export function useSupplierInvoice(id: number) {
  return useQuery({
    queryKey: supplierInvoiceKeys.detail(id),
    queryFn: () => supplierInvoicesApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch supplier invoice lines
 */
export function useSupplierInvoiceLines(invoiceId: number) {
  return useQuery({
    queryKey: supplierInvoiceKeys.lines(invoiceId),
    queryFn: () => supplierInvoicesApi.getLines(invoiceId),
    enabled: !!invoiceId,
  })
}

/**
 * Hook to create a new supplier invoice
 */
export function useCreateSupplierInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SupplierInvoiceCreateDto) => supplierInvoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing supplier invoice
 */
export function useUpdateSupplierInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierInvoiceUpdateDto }) =>
      supplierInvoicesApi.update(id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(supplierInvoiceKeys.detail(updatedInvoice.id), updatedInvoice)
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lists() })
    },
  })
}

/**
 * Hook to delete a supplier invoice
 */
export function useDeleteSupplierInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => supplierInvoicesApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: supplierInvoiceKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lists() })
    },
  })
}

// ==================== Invoice Lines Mutations ====================

/**
 * Hook to add a line to a supplier invoice
 */
export function useAddSupplierInvoiceLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, line }: { invoiceId: number; line: SupplierInvoiceLineCreateDto }) =>
      supplierInvoicesApi.addLine(invoiceId, line),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lines(invoiceId) })
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.detail(invoiceId) })
    },
  })
}

/**
 * Hook to update a supplier invoice line
 */
export function useUpdateSupplierInvoiceLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      invoiceId,
      lineId,
      line,
    }: {
      invoiceId: number
      lineId: number
      line: SupplierInvoiceLineUpdateDto
    }) => supplierInvoicesApi.updateLine(invoiceId, lineId, line),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lines(invoiceId) })
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.detail(invoiceId) })
    },
  })
}

/**
 * Hook to delete a supplier invoice line
 */
export function useDeleteSupplierInvoiceLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, lineId }: { invoiceId: number; lineId: number }) =>
      supplierInvoicesApi.deleteLine(invoiceId, lineId),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lines(invoiceId) })
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.detail(invoiceId) })
    },
  })
}

// ==================== Payment Mutations ====================

/**
 * Hook to mark a supplier invoice as paid
 */
export function useMarkSupplierInvoicePaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: number; data?: MarkPaidRequest }) =>
      supplierInvoicesApi.markPaid(invoiceId, data || {}),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lists() })
    },
  })
}

/**
 * Hook to mark a supplier invoice as unpaid
 */
export function useMarkSupplierInvoiceUnpaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: number; data?: MarkUnpaidRequest }) =>
      supplierInvoicesApi.markUnpaid(invoiceId, data),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lists() })
    },
  })
}

// ==================== Production Mutations ====================

/**
 * Hook to start production for a supplier invoice
 */
export function useStartProduction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: number; data?: StartProductionRequest }) =>
      supplierInvoicesApi.startProduction(invoiceId, data || {}),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lists() })
    },
  })
}

/**
 * Hook to complete production for a supplier invoice
 */
export function useCompleteProduction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: number; data?: CompleteProductionRequest }) =>
      supplierInvoicesApi.completeProduction(invoiceId, data || {}),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: supplierInvoiceKeys.lists() })
    },
  })
}
