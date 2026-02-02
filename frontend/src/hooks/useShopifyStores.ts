import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shopifyApi } from '@/api/shopify'
import type {
  ShopifyStoreCreateDto,
  ShopifyStoreUpdateDto,
  ShopifyStoreSearchParams,
} from '@/types/shopify'

// Query keys
export const shopifyStoreKeys = {
  all: ['shopify-stores'] as const,
  lists: () => [...shopifyStoreKeys.all, 'list'] as const,
  list: (params: ShopifyStoreSearchParams) => [...shopifyStoreKeys.lists(), params] as const,
  details: () => [...shopifyStoreKeys.all, 'detail'] as const,
  detail: (id: number) => [...shopifyStoreKeys.details(), id] as const,
  stats: (storeId: number) => [...shopifyStoreKeys.detail(storeId), 'stats'] as const,
  syncEvents: (storeId: number) => [...shopifyStoreKeys.detail(storeId), 'sync-events'] as const,
}

/**
 * Hook to fetch paginated list of Shopify stores
 */
export function useShopifyStores(params: ShopifyStoreSearchParams = {}) {
  return useQuery({
    queryKey: shopifyStoreKeys.list(params),
    queryFn: () => shopifyApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single Shopify store by ID
 */
export function useShopifyStore(id: number) {
  return useQuery({
    queryKey: shopifyStoreKeys.detail(id),
    queryFn: () => shopifyApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch Shopify store statistics
 */
export function useShopifyStoreStats(storeId: number) {
  return useQuery({
    queryKey: shopifyStoreKeys.stats(storeId),
    queryFn: () => shopifyApi.getStats(storeId),
    enabled: !!storeId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch Shopify store sync events
 */
export function useShopifySyncEvents(storeId: number, limit: number = 10) {
  return useQuery({
    queryKey: shopifyStoreKeys.syncEvents(storeId),
    queryFn: () => shopifyApi.getSyncEvents(storeId, limit),
    enabled: !!storeId,
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
  })
}

/**
 * Hook to create a new Shopify store connection
 */
export function useCreateShopifyStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ShopifyStoreCreateDto) => shopifyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopifyStoreKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing Shopify store
 */
export function useUpdateShopifyStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ShopifyStoreUpdateDto) => shopifyApi.update(data),
    onSuccess: (updatedStore) => {
      queryClient.setQueryData(shopifyStoreKeys.detail(updatedStore.id), updatedStore)
      queryClient.invalidateQueries({ queryKey: shopifyStoreKeys.lists() })
    },
  })
}

/**
 * Hook to delete a Shopify store
 */
export function useDeleteShopifyStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => shopifyApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: shopifyStoreKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: shopifyStoreKeys.lists() })
    },
  })
}

/**
 * Hook to test Shopify store connection
 */
export function useTestShopifyConnection() {
  return useMutation({
    mutationFn: (id: number) => shopifyApi.testConnection(id),
  })
}

/**
 * Hook to trigger a sync for a Shopify store
 */
export function useTriggerShopifySync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, syncType }: { id: number; syncType: 'orders' | 'products' | 'customers' | 'inventory' | 'full' }) =>
      shopifyApi.triggerSync(id, syncType),
    onSuccess: (_, { id }) => {
      // Invalidate sync events to show the new sync
      queryClient.invalidateQueries({ queryKey: shopifyStoreKeys.syncEvents(id) })
      // Refetch store details after a delay to get updated lastSyncAt
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: shopifyStoreKeys.detail(id) })
        queryClient.invalidateQueries({ queryKey: shopifyStoreKeys.stats(id) })
      }, 3500)
    },
  })
}

/**
 * Hook to refresh shop info from Shopify API
 */
export function useRefreshShopifyInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => shopifyApi.refreshShopInfo(id),
    onSuccess: (updatedStore) => {
      queryClient.setQueryData(shopifyStoreKeys.detail(updatedStore.id), updatedStore)
      queryClient.invalidateQueries({ queryKey: shopifyStoreKeys.lists() })
    },
  })
}
