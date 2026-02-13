import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logisticsApi } from '@/api/logistics'
import type {
  ShipmentSearchParams,
  ShipmentCreateDto,
  ShipmentUpdateDto,
  BulkStatusUpdateRequest,
} from '@/types/logistics'

// =============================================================================
// Query Keys
// =============================================================================

export const logisticsKeys = {
  all: ['logistics'] as const,
  shipments: () => [...logisticsKeys.all, 'shipments'] as const,
  shipmentList: (params: ShipmentSearchParams) => [...logisticsKeys.shipments(), 'list', params] as const,
  shipmentDetail: (id: number) => [...logisticsKeys.shipments(), 'detail', id] as const,
  shipmentByReference: (reference: string) => [...logisticsKeys.shipments(), 'reference', reference] as const,
  tracking: (trackingNumber: string) => [...logisticsKeys.all, 'tracking', trackingNumber] as const,
  trackingByShipment: (shipmentId: number) => [...logisticsKeys.all, 'tracking', 'shipment', shipmentId] as const,
  carriers: () => [...logisticsKeys.all, 'carriers'] as const,
  consignees: () => [...logisticsKeys.all, 'consignees'] as const,
  carrierDetail: (id: number) => [...logisticsKeys.carriers(), 'detail', id] as const,
  statistics: (params?: { from_date?: string; to_date?: string }) => [...logisticsKeys.all, 'statistics', params] as const,
}

// =============================================================================
// Shipment Queries
// =============================================================================

/**
 * Fetch paginated shipments with filtering
 */
export function useShipments(params: ShipmentSearchParams = {}) {
  return useQuery({
    queryKey: logisticsKeys.shipmentList(params),
    queryFn: () => logisticsApi.getShipments(params),
  })
}

/**
 * Fetch a single shipment by ID
 */
export function useShipment(id: number) {
  return useQuery({
    queryKey: logisticsKeys.shipmentDetail(id),
    queryFn: () => logisticsApi.getShipmentById(id),
    enabled: !!id,
  })
}

/**
 * Fetch a shipment by reference
 */
export function useShipmentByReference(reference: string) {
  return useQuery({
    queryKey: logisticsKeys.shipmentByReference(reference),
    queryFn: () => logisticsApi.getShipmentByReference(reference),
    enabled: !!reference,
  })
}

// =============================================================================
// Tracking Queries
// =============================================================================

/**
 * Fetch tracking information by tracking number
 */
export function useTracking(trackingNumber: string) {
  return useQuery({
    queryKey: logisticsKeys.tracking(trackingNumber),
    queryFn: () => logisticsApi.getTracking(trackingNumber),
    enabled: !!trackingNumber,
  })
}

/**
 * Fetch tracking information by shipment ID
 */
export function useTrackingByShipment(shipmentId: number) {
  return useQuery({
    queryKey: logisticsKeys.trackingByShipment(shipmentId),
    queryFn: () => logisticsApi.getTrackingByShipmentId(shipmentId),
    enabled: !!shipmentId,
  })
}

// =============================================================================
// Carrier Queries
// =============================================================================

/**
 * Fetch list of carriers
 */
export function useCarriers(activeOnly = true) {
  return useQuery({
    queryKey: logisticsKeys.carriers(),
    queryFn: () => logisticsApi.getCarriers(activeOnly),
  })
}

/**
 * Fetch list of consignees
 */
export function useConsignees(activeOnly = true) {
  return useQuery({
    queryKey: logisticsKeys.consignees(),
    queryFn: () => logisticsApi.getConsignees(activeOnly),
  })
}

/**
 * Fetch a carrier by ID
 */
export function useCarrier(id: number) {
  return useQuery({
    queryKey: logisticsKeys.carrierDetail(id),
    queryFn: () => logisticsApi.getCarrierById(id),
    enabled: !!id,
  })
}

// =============================================================================
// Statistics Queries
// =============================================================================

/**
 * Fetch shipment statistics
 */
export function useShipmentStatistics(params?: { from_date?: string; to_date?: string }) {
  return useQuery({
    queryKey: logisticsKeys.statistics(params),
    queryFn: () => logisticsApi.getStatistics(params),
  })
}

// =============================================================================
// Shipment Mutations
// =============================================================================

/**
 * Create a new shipment
 */
export function useCreateShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ShipmentCreateDto) => logisticsApi.createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.shipments() })
      queryClient.invalidateQueries({ queryKey: logisticsKeys.statistics() })
    },
  })
}

/**
 * Update an existing shipment
 */
export function useUpdateShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShipmentUpdateDto }) =>
      logisticsApi.updateShipment(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.shipments() })
      queryClient.setQueryData(logisticsKeys.shipmentDetail(variables.id), data)
    },
  })
}

/**
 * Delete a shipment
 */
export function useDeleteShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => logisticsApi.deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.shipments() })
      queryClient.invalidateQueries({ queryKey: logisticsKeys.statistics() })
    },
  })
}

// =============================================================================
// Status Mutations
// =============================================================================

/**
 * Update shipment status
 */
export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, statusId, notes }: { id: number; statusId: number; notes?: string }) =>
      logisticsApi.updateShipmentStatus(id, statusId, notes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.shipments() })
      queryClient.setQueryData(logisticsKeys.shipmentDetail(variables.id), data)
      queryClient.invalidateQueries({ queryKey: logisticsKeys.statistics() })
    },
  })
}

/**
 * Bulk update shipment statuses
 */
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: BulkStatusUpdateRequest) => logisticsApi.bulkUpdateStatus(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.shipments() })
      queryClient.invalidateQueries({ queryKey: logisticsKeys.statistics() })
    },
  })
}

/**
 * Mark shipment as delivered
 */
export function useMarkDelivered() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, actualDelivery }: { id: number; actualDelivery?: string }) =>
      logisticsApi.markDelivered(id, actualDelivery),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.shipments() })
      queryClient.setQueryData(logisticsKeys.shipmentDetail(variables.id), data)
      queryClient.invalidateQueries({ queryKey: logisticsKeys.statistics() })
    },
  })
}
