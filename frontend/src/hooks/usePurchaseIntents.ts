import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseIntentsApi } from '@/api/purchaseIntents'
import type {
  PurchaseIntentSearchParams,
  PurchaseIntentCreateDto,
  PurchaseIntentUpdateDto,
  PurchaseIntentLineCreateDto,
  PurchaseIntentLineUpdateDto,
} from '@/types/purchaseIntent'

// Query keys factory
export const purchaseIntentKeys = {
  all: ['purchaseIntents'] as const,
  lists: () => [...purchaseIntentKeys.all, 'list'] as const,
  list: (params: PurchaseIntentSearchParams) => [...purchaseIntentKeys.lists(), params] as const,
  details: () => [...purchaseIntentKeys.all, 'detail'] as const,
  detail: (id: number) => [...purchaseIntentKeys.details(), id] as const,
  lines: (intentId: number) => [...purchaseIntentKeys.detail(intentId), 'lines'] as const,
  line: (intentId: number, lineId: number) => [...purchaseIntentKeys.lines(intentId), lineId] as const,
}

/**
 * Hook to fetch paginated list of purchase intents
 */
export function usePurchaseIntents(params: PurchaseIntentSearchParams = {}) {
  return useQuery({
    queryKey: purchaseIntentKeys.list(params),
    queryFn: () => purchaseIntentsApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single purchase intent by ID
 */
export function usePurchaseIntent(id: number) {
  return useQuery({
    queryKey: purchaseIntentKeys.detail(id),
    queryFn: () => purchaseIntentsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch purchase intent lines
 */
export function usePurchaseIntentLines(intentId: number) {
  return useQuery({
    queryKey: purchaseIntentKeys.lines(intentId),
    queryFn: () => purchaseIntentsApi.getLines(intentId),
    enabled: !!intentId,
  })
}

/**
 * Hook to create a new purchase intent
 */
export function useCreatePurchaseIntent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PurchaseIntentCreateDto) => purchaseIntentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing purchase intent
 */
export function useUpdatePurchaseIntent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PurchaseIntentUpdateDto }) =>
      purchaseIntentsApi.update(id, data),
    onSuccess: (updatedIntent) => {
      queryClient.setQueryData(purchaseIntentKeys.detail(updatedIntent.id), updatedIntent)
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.lists() })
    },
  })
}

/**
 * Hook to delete a purchase intent (soft delete)
 */
export function useDeletePurchaseIntent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => purchaseIntentsApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: purchaseIntentKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.lists() })
    },
  })
}

/**
 * Hook to permanently delete a purchase intent
 */
export function usePermanentDeletePurchaseIntent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => purchaseIntentsApi.permanentDelete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: purchaseIntentKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.lists() })
    },
  })
}

/**
 * Hook to close a purchase intent
 */
export function useClosePurchaseIntent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => purchaseIntentsApi.close(id),
    onSuccess: (updatedIntent) => {
      queryClient.setQueryData(purchaseIntentKeys.detail(updatedIntent.id), updatedIntent)
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.lists() })
    },
  })
}

/**
 * Hook to reopen a purchase intent
 */
export function useReopenPurchaseIntent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => purchaseIntentsApi.reopen(id),
    onSuccess: (updatedIntent) => {
      queryClient.setQueryData(purchaseIntentKeys.detail(updatedIntent.id), updatedIntent)
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.lists() })
    },
  })
}

// ==================== Purchase Intent Lines Mutations ====================

/**
 * Hook to add a line to a purchase intent
 */
export function useAddPurchaseIntentLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ intentId, line }: { intentId: number; line: PurchaseIntentLineCreateDto }) =>
      purchaseIntentsApi.addLine(intentId, line),
    onSuccess: (_, { intentId }) => {
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.lines(intentId) })
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.detail(intentId) })
    },
  })
}

/**
 * Hook to update a purchase intent line
 */
export function useUpdatePurchaseIntentLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      intentId,
      lineId,
      line,
    }: {
      intentId: number
      lineId: number
      line: PurchaseIntentLineUpdateDto
    }) => purchaseIntentsApi.updateLine(intentId, lineId, line),
    onSuccess: (_, { intentId }) => {
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.lines(intentId) })
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.detail(intentId) })
    },
  })
}

/**
 * Hook to delete a purchase intent line
 */
export function useDeletePurchaseIntentLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ intentId, lineId }: { intentId: number; lineId: number }) =>
      purchaseIntentsApi.deleteLine(intentId, lineId),
    onSuccess: (_, { intentId }) => {
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.lines(intentId) })
      queryClient.invalidateQueries({ queryKey: purchaseIntentKeys.detail(intentId) })
    },
  })
}
