import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import type {
  DeliverySearchParams,
  DeliveryFormCreateDto,
  DeliveryFormUpdateDto,
  DeliveryLineCreateDto,
  DeliveryLineUpdateDto,
  DeliveryShipRequest,
  DeliveryDeliverRequest,
} from '@/types/delivery'

// Query keys factory
export const deliveryKeys = {
  all: ['deliveries'] as const,
  lists: () => [...deliveryKeys.all, 'list'] as const,
  list: (params: DeliverySearchParams) => [...deliveryKeys.lists(), params] as const,
  details: () => [...deliveryKeys.all, 'detail'] as const,
  detail: (id: number) => [...deliveryKeys.details(), id] as const,
  lines: (deliveryId: number) => [...deliveryKeys.detail(deliveryId), 'lines'] as const,
  byOrder: (orderId: number) => [...deliveryKeys.all, 'by-order', orderId] as const,
}

// Common options for entity list queries (moderate caching to reduce API calls)
const listQueryOptions = {
  staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  refetchOnWindowFocus: false, // Don't refetch when switching browser tabs
}

/**
 * Hook to fetch paginated list of deliveries
 */
export function useDeliveries(params: DeliverySearchParams = {}) {
  return useQuery({
    queryKey: deliveryKeys.list(params),
    queryFn: () => deliveriesApi.getAll(params),
    ...listQueryOptions,
  })
}

/**
 * Hook to fetch a single delivery by ID
 */
export function useDelivery(id: number) {
  return useQuery({
    queryKey: deliveryKeys.detail(id),
    queryFn: () => deliveriesApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch delivery lines
 */
export function useDeliveryLines(deliveryId: number) {
  return useQuery({
    queryKey: deliveryKeys.lines(deliveryId),
    queryFn: () => deliveriesApi.getLines(deliveryId),
    enabled: !!deliveryId,
  })
}

/**
 * Hook to fetch deliveries by order
 */
export function useDeliveriesByOrder(orderId: number) {
  return useQuery({
    queryKey: deliveryKeys.byOrder(orderId),
    queryFn: () => deliveriesApi.getByOrder(orderId),
    enabled: !!orderId,
  })
}

/**
 * Hook to create a new delivery
 */
export function useCreateDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DeliveryFormCreateDto) => deliveriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing delivery
 */
export function useUpdateDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DeliveryFormUpdateDto }) =>
      deliveriesApi.update(id, data),
    onSuccess: (updatedDelivery) => {
      queryClient.setQueryData(deliveryKeys.detail(updatedDelivery.id), updatedDelivery)
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() })
    },
  })
}

/**
 * Hook to delete a delivery
 */
export function useDeleteDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deliveriesApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: deliveryKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() })
    },
  })
}

/**
 * Hook to ship a delivery
 */
export function useShipDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request?: DeliveryShipRequest }) =>
      deliveriesApi.ship(id, request),
    onSuccess: (updatedDelivery) => {
      queryClient.setQueryData(deliveryKeys.detail(updatedDelivery.id), updatedDelivery)
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() })
    },
  })
}

/**
 * Hook to mark delivery as delivered
 */
export function useDeliverDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request?: DeliveryDeliverRequest }) =>
      deliveriesApi.deliver(id, request),
    onSuccess: (updatedDelivery) => {
      queryClient.setQueryData(deliveryKeys.detail(updatedDelivery.id), updatedDelivery)
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() })
    },
  })
}

// ==================== PDF & Send Hooks ====================

/**
 * Hook to download delivery form PDF
 */
export function useDownloadDeliveryPdf() {
  return useMutation({
    mutationFn: (id: number) => deliveriesApi.downloadPdf(id),
    onSuccess: (blob, deliveryId) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `delivery-${deliveryId}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}

/**
 * Hook to send delivery form via email
 */
export function useSendDelivery() {
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
    }) => deliveriesApi.send(id, toEmail, subject, body, cc),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() })
    },
  })
}

// ==================== Delivery Lines Mutations ====================

/**
 * Hook to add a line to a delivery
 */
export function useAddDeliveryLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deliveryId, line }: { deliveryId: number; line: DeliveryLineCreateDto }) =>
      deliveriesApi.addLine(deliveryId, line),
    onSuccess: (_, { deliveryId }) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lines(deliveryId) })
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(deliveryId) })
    },
  })
}

/**
 * Hook to update a delivery line
 */
export function useUpdateDeliveryLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      deliveryId,
      lineId,
      line,
    }: {
      deliveryId: number
      lineId: number
      line: DeliveryLineUpdateDto
    }) => deliveriesApi.updateLine(deliveryId, lineId, line),
    onSuccess: (_, { deliveryId }) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lines(deliveryId) })
    },
  })
}

/**
 * Hook to delete a delivery line
 */
export function useDeleteDeliveryLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deliveryId, lineId }: { deliveryId: number; lineId: number }) =>
      deliveriesApi.deleteLine(deliveryId, lineId),
    onSuccess: (_, { deliveryId }) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lines(deliveryId) })
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(deliveryId) })
    },
  })
}
