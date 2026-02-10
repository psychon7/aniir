import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, OrderLineUpdateDto } from '@/api/orders'
import type {
  OrderSearchParams,
  OrderCreateDto,
  OrderUpdateDto,
  OrderLineCreateDto,
  OrderDiscountRequest,
} from '@/types/order'

// Query keys factory
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: OrderSearchParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  lines: (orderId: number) => [...orderKeys.detail(orderId), 'lines'] as const,
  line: (orderId: number, lineId: number) => [...orderKeys.lines(orderId), lineId] as const,
  byProject: (projectId: number) => [...orderKeys.all, 'by-project', projectId] as const,
  byQuote: (quoteId: number) => [...orderKeys.all, 'by-quote', quoteId] as const,
}

/**
 * Hook to fetch paginated list of orders
 */
export function useOrders(params: OrderSearchParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch order lines
 */
export function useOrderLines(orderId: number) {
  return useQuery({
    queryKey: orderKeys.lines(orderId),
    queryFn: () => ordersApi.getLines(orderId),
    enabled: !!orderId,
  })
}

/**
 * Hook to fetch orders by project
 */
export function useOrdersByProject(projectId: number) {
  return useQuery({
    queryKey: orderKeys.byProject(projectId),
    queryFn: () => ordersApi.getByProject(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook to fetch orders by quote
 */
export function useOrdersByQuote(quoteId: number) {
  return useQuery({
    queryKey: orderKeys.byQuote(quoteId),
    queryFn: () => ordersApi.getByQuote(quoteId),
    enabled: !!quoteId,
  })
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OrderCreateDto) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing order
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OrderUpdateDto) => ordersApi.update(data),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder)
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Hook to delete an order
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ordersApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: orderKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Hook to confirm an order
 */
export function useConfirmOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ordersApi.confirm(id),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder)
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      ordersApi.cancel(id, reason),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder)
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Hook to duplicate an order
 */
export function useDuplicateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ordersApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Hook to convert an order back to a quote
 */
export function useConvertOrderToQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ordersApi.convertToQuote(id),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

/**
 * Hook to update order-level discount
 */
export function useUpdateOrderDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: OrderDiscountRequest }) =>
      ordersApi.updateDiscount(id, request),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder)
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, statusId }: { id: number; statusId: number }) =>
      ordersApi.updateStatus(id, statusId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder)
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

// ==================== Order Lines Mutations ====================

/**
 * Hook to add a line to an order
 */
export function useAddOrderLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, line }: { orderId: number; line: OrderLineCreateDto }) =>
      ordersApi.addLine(orderId, line),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lines(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
    },
  })
}

/**
 * Hook to add multiple lines to an order
 */
export function useAddOrderLines() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, lines }: { orderId: number; lines: OrderLineCreateDto[] }) =>
      ordersApi.addLines(orderId, lines),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lines(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
    },
  })
}

/**
 * Hook to update an order line
 */
export function useUpdateOrderLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, line }: { orderId: number; line: OrderLineUpdateDto }) =>
      ordersApi.updateLine(orderId, line),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lines(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
    },
  })
}

/**
 * Hook to delete an order line
 */
export function useDeleteOrderLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, lineId }: { orderId: number; lineId: number }) =>
      ordersApi.deleteLine(orderId, lineId),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lines(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
    },
  })
}

/**
 * Hook to recalculate order totals
 */
export function useRecalculateOrderTotals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => ordersApi.recalculateTotals(orderId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder)
    },
  })
}

/**
 * Hook to export orders to CSV
 */
export function useExportOrders() {
  return useMutation({
    mutationFn: (params: OrderSearchParams = {}) => ordersApi.exportCSV(params),
    onSuccess: (csvData) => {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}

/**
 * Hook to send order via email
 */
export function useSendOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      toEmail,
      subject,
      body,
      cc,
    }: {
      id: number
      toEmail: string
      subject?: string
      body?: string
      cc?: string
    }) => ordersApi.send(id, toEmail, subject, body, cc),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Hook to export order to PDF
 */
export function useExportOrderPDF() {
  return useMutation({
    mutationFn: (id: number) => ordersApi.exportPDF(id),
    onSuccess: (blob, orderId) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `order-${orderId}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}
