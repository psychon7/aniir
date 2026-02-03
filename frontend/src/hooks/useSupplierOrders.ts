import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supplierOrdersApi } from '@/api/supplierOrders'
import type {
  SupplierOrderSearchParams,
  SupplierOrderCreateDto,
  SupplierOrderUpdateDto,
  SupplierOrderLineCreateDto,
  SupplierOrderLineUpdateDto,
  ConfirmSupplierOrderRequest,
  CancelSupplierOrderRequest,
} from '@/types/supplierOrder'

// Query keys factory
export const supplierOrderKeys = {
  all: ['supplierOrders'] as const,
  lists: () => [...supplierOrderKeys.all, 'list'] as const,
  list: (params: SupplierOrderSearchParams) => [...supplierOrderKeys.lists(), params] as const,
  details: () => [...supplierOrderKeys.all, 'detail'] as const,
  detail: (id: number) => [...supplierOrderKeys.details(), id] as const,
  lines: (orderId: number) => [...supplierOrderKeys.detail(orderId), 'lines'] as const,
  line: (orderId: number, lineId: number) => [...supplierOrderKeys.lines(orderId), lineId] as const,
}

// ==================== List & Detail Queries ====================

/**
 * Hook to fetch paginated list of supplier orders
 */
export function useSupplierOrders(params: SupplierOrderSearchParams = {}) {
  return useQuery({
    queryKey: supplierOrderKeys.list(params),
    queryFn: () => supplierOrdersApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single supplier order by ID
 */
export function useSupplierOrder(id: number) {
  return useQuery({
    queryKey: supplierOrderKeys.detail(id),
    queryFn: () => supplierOrdersApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch supplier order lines
 */
export function useSupplierOrderLines(orderId: number) {
  return useQuery({
    queryKey: supplierOrderKeys.lines(orderId),
    queryFn: () => supplierOrdersApi.getLines(orderId),
    enabled: !!orderId,
  })
}

// ==================== Order Mutations ====================

/**
 * Hook to create a new supplier order
 */
export function useCreateSupplierOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SupplierOrderCreateDto) => supplierOrdersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing supplier order
 */
export function useUpdateSupplierOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierOrderUpdateDto }) =>
      supplierOrdersApi.update(id, data),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(supplierOrderKeys.detail(updatedOrder.id), updatedOrder)
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lists() })
    },
  })
}

/**
 * Hook to delete a supplier order
 */
export function useDeleteSupplierOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => supplierOrdersApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: supplierOrderKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lists() })
    },
  })
}

// ==================== Status Operations ====================

/**
 * Hook to confirm a supplier order
 */
export function useConfirmSupplierOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request?: ConfirmSupplierOrderRequest }) =>
      supplierOrdersApi.confirm(id, request),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.detail(response.orderId) })
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lists() })
    },
  })
}

/**
 * Hook to mark a supplier order as received
 */
export function useReceiveSupplierOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => supplierOrdersApi.receive(id),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(supplierOrderKeys.detail(updatedOrder.id), updatedOrder)
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lists() })
    },
  })
}

/**
 * Hook to cancel a supplier order
 */
export function useCancelSupplierOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: CancelSupplierOrderRequest }) =>
      supplierOrdersApi.cancel(id, request),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.detail(response.orderId) })
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lists() })
    },
  })
}

/**
 * Hook to duplicate a supplier order
 */
export function useDuplicateSupplierOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => supplierOrdersApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lists() })
    },
  })
}

// ==================== Order Lines Mutations ====================

/**
 * Hook to add a line to a supplier order
 */
export function useAddSupplierOrderLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, line }: { orderId: number; line: SupplierOrderLineCreateDto }) =>
      supplierOrdersApi.addLine(orderId, line),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lines(orderId) })
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.detail(orderId) })
    },
  })
}

/**
 * Hook to add multiple lines to a supplier order
 */
export function useAddSupplierOrderLines() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, lines }: { orderId: number; lines: SupplierOrderLineCreateDto[] }) =>
      supplierOrdersApi.addLines(orderId, lines),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lines(orderId) })
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.detail(orderId) })
    },
  })
}

/**
 * Hook to update a supplier order line
 */
export function useUpdateSupplierOrderLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      lineId,
      line,
    }: {
      orderId: number
      lineId: number
      line: SupplierOrderLineUpdateDto
    }) => supplierOrdersApi.updateLine(orderId, lineId, line),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lines(orderId) })
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.detail(orderId) })
    },
  })
}

/**
 * Hook to delete a supplier order line
 */
export function useDeleteSupplierOrderLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, lineId }: { orderId: number; lineId: number }) =>
      supplierOrdersApi.deleteLine(orderId, lineId),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.lines(orderId) })
      queryClient.invalidateQueries({ queryKey: supplierOrderKeys.detail(orderId) })
    },
  })
}

// ==================== Utility Mutations ====================

/**
 * Hook to recalculate supplier order totals
 */
export function useRecalculateSupplierOrderTotals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => supplierOrdersApi.recalculateTotals(orderId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(supplierOrderKeys.detail(updatedOrder.id), updatedOrder)
    },
  })
}

/**
 * Hook to export supplier orders to CSV
 */
export function useExportSupplierOrders() {
  return useMutation({
    mutationFn: (params: SupplierOrderSearchParams = {}) => supplierOrdersApi.exportCSV(params),
    onSuccess: (csvData) => {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `supplier-orders-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}

/**
 * Hook to export supplier order to PDF
 */
export function useExportSupplierOrderPDF() {
  return useMutation({
    mutationFn: (id: number) => supplierOrdersApi.exportPDF(id),
    onSuccess: (blob, orderId) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `supplier-order-${orderId}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}

// ==================== Specialized Queries ====================

/**
 * Hook to fetch pending supplier orders
 */
export function usePendingSupplierOrders(params: Omit<SupplierOrderSearchParams, 'is_started' | 'is_canceled'> = {}) {
  return useQuery({
    queryKey: supplierOrderKeys.list({ ...params, is_started: false, is_canceled: false }),
    queryFn: () => supplierOrdersApi.getPending(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch active supplier orders
 */
export function useActiveSupplierOrders(params: Omit<SupplierOrderSearchParams, 'is_started' | 'is_canceled'> = {}) {
  return useQuery({
    queryKey: supplierOrderKeys.list({ ...params, is_started: true, is_canceled: false }),
    queryFn: () => supplierOrdersApi.getActive(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch supplier orders for a specific supplier
 */
export function useSupplierOrdersBySupplier(supplierId: number, params: Omit<SupplierOrderSearchParams, 'supplier_id'> = {}) {
  return useQuery({
    queryKey: supplierOrderKeys.list({ ...params, supplier_id: supplierId }),
    queryFn: () => supplierOrdersApi.getBySupplier(supplierId, params),
    enabled: !!supplierId,
    staleTime: 30 * 1000,
  })
}
