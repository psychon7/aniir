import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { landedCostApi } from '@/api/landed-cost'
import type {
  SupplyLotCreateDto,
  SupplyLotUpdateDto,
  SupplyLotSearchParams,
  SupplyLotItemCreateDto,
  SupplyLotItemUpdateDto,
  FreightCostCreateDto,
  FreightCostUpdateDto,
  LandedCostCalculationRequest,
} from '@/types/landed-cost'

// Query keys
export const landedCostKeys = {
  all: ['landed-cost'] as const,
  supplyLots: () => [...landedCostKeys.all, 'supply-lots'] as const,
  supplyLotList: (params: SupplyLotSearchParams) => [...landedCostKeys.supplyLots(), 'list', params] as const,
  supplyLotDetails: () => [...landedCostKeys.supplyLots(), 'detail'] as const,
  supplyLotDetail: (id: number) => [...landedCostKeys.supplyLotDetails(), id] as const,
  breakdown: (lotId: number) => [...landedCostKeys.supplyLotDetail(lotId), 'breakdown'] as const,
  allocationHistory: (lotId: number) => [...landedCostKeys.supplyLotDetail(lotId), 'allocation-history'] as const,
}

// =====================
// Supply Lot Hooks
// =====================

/**
 * Hook to fetch paginated list of supply lots
 */
export function useSupplyLots(params: SupplyLotSearchParams = {}) {
  return useQuery({
    queryKey: landedCostKeys.supplyLotList(params),
    queryFn: () => landedCostApi.getSupplyLots(params),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  })
}

/**
 * Hook to fetch a single supply lot by ID with items and freight costs
 */
export function useSupplyLot(lotId: number) {
  return useQuery({
    queryKey: landedCostKeys.supplyLotDetail(lotId),
    queryFn: () => landedCostApi.getSupplyLotById(lotId),
    enabled: !!lotId,
  })
}

/**
 * Hook to create a new supply lot
 */
export function useCreateSupplyLot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SupplyLotCreateDto) => landedCostApi.createSupplyLot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLots() })
    },
  })
}

/**
 * Hook to update a supply lot
 */
export function useUpdateSupplyLot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lotId, data }: { lotId: number; data: SupplyLotUpdateDto }) =>
      landedCostApi.updateSupplyLot(lotId, data),
    onSuccess: (updatedLot) => {
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLotDetail(updatedLot.lot_id) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLots() })
    },
  })
}

/**
 * Hook to delete a supply lot
 */
export function useDeleteSupplyLot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (lotId: number) => landedCostApi.deleteSupplyLot(lotId),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: landedCostKeys.supplyLotDetail(deletedId) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLots() })
    },
  })
}

// =====================
// Supply Lot Item Hooks
// =====================

/**
 * Hook to add an item to a supply lot
 */
export function useAddSupplyLotItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lotId, data }: { lotId: number; data: SupplyLotItemCreateDto }) =>
      landedCostApi.addSupplyLotItem(lotId, data),
    onSuccess: (_, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLotDetail(lotId) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.breakdown(lotId) })
    },
  })
}

/**
 * Hook to update a supply lot item
 */
export function useUpdateSupplyLotItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lotId, itemId, data }: { lotId: number; itemId: number; data: SupplyLotItemUpdateDto }) =>
      landedCostApi.updateSupplyLotItem(lotId, itemId, data),
    onSuccess: (_, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLotDetail(lotId) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.breakdown(lotId) })
    },
  })
}

/**
 * Hook to delete a supply lot item
 */
export function useDeleteSupplyLotItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lotId, itemId }: { lotId: number; itemId: number }) =>
      landedCostApi.deleteSupplyLotItem(lotId, itemId),
    onSuccess: (_, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLotDetail(lotId) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.breakdown(lotId) })
    },
  })
}

// =====================
// Freight Cost Hooks
// =====================

/**
 * Hook to add a freight cost to a supply lot
 */
export function useAddFreightCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lotId, data }: { lotId: number; data: Omit<FreightCostCreateDto, 'frc_lot_id'> }) =>
      landedCostApi.addFreightCost(lotId, data),
    onSuccess: (_, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLotDetail(lotId) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.breakdown(lotId) })
    },
  })
}

/**
 * Hook to update a freight cost
 */
export function useUpdateFreightCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lotId, costId, data }: { lotId: number; costId: number; data: FreightCostUpdateDto }) =>
      landedCostApi.updateFreightCost(lotId, costId, data),
    onSuccess: (_, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLotDetail(lotId) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.breakdown(lotId) })
    },
  })
}

/**
 * Hook to delete a freight cost
 */
export function useDeleteFreightCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lotId, costId }: { lotId: number; costId: number }) =>
      landedCostApi.deleteFreightCost(lotId, costId),
    onSuccess: (_, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLotDetail(lotId) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.breakdown(lotId) })
    },
  })
}

// =====================
// Landed Cost Calculation Hooks
// =====================

/**
 * Hook to calculate landed costs for a supply lot
 */
export function useCalculateLandedCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lotId, request }: { lotId: number; request: LandedCostCalculationRequest }) =>
      landedCostApi.calculateLandedCost(lotId, request),
    onSuccess: (_, { lotId }) => {
      // Invalidate all related queries after calculation
      queryClient.invalidateQueries({ queryKey: landedCostKeys.supplyLotDetail(lotId) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.breakdown(lotId) })
      queryClient.invalidateQueries({ queryKey: landedCostKeys.allocationHistory(lotId) })
    },
  })
}

/**
 * Hook to fetch landed cost breakdown for a supply lot
 */
export function useLandedCostBreakdown(lotId: number) {
  return useQuery({
    queryKey: landedCostKeys.breakdown(lotId),
    queryFn: () => landedCostApi.getLandedCostBreakdown(lotId),
    enabled: !!lotId,
  })
}

/**
 * Hook to fetch allocation history for a supply lot
 */
export function useAllocationHistory(lotId: number) {
  return useQuery({
    queryKey: landedCostKeys.allocationHistory(lotId),
    queryFn: () => landedCostApi.getAllocationHistory(lotId),
    enabled: !!lotId,
  })
}
