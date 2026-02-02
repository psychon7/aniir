import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { brandsApi } from '@/api/brands'
import type { BrandCreateDto, BrandUpdateDto, BrandSearchParams } from '@/types/brand'

// Query keys
export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (params: BrandSearchParams) => [...brandKeys.lists(), params] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: number) => [...brandKeys.details(), id] as const,
  lookup: () => [...brandKeys.all, 'lookup'] as const,
  search: (query: string) => [...brandKeys.all, 'search', query] as const,
}

/**
 * Hook to fetch all brands
 */
export function useBrands(params: BrandSearchParams = {}) {
  return useQuery({
    queryKey: brandKeys.list(params),
    queryFn: () => brandsApi.getAll(params),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  })
}

/**
 * Hook to fetch a single brand by ID
 */
export function useBrand(id: number) {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: () => brandsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch brands for dropdown/lookup (active brands only)
 */
export function useBrandsLookup() {
  return useQuery({
    queryKey: brandKeys.lookup(),
    queryFn: () => brandsApi.getLookup(),
    staleTime: 10 * 60 * 1000, // 10 minutes for reference data
  })
}

/**
 * Hook to search brands
 */
export function useBrandSearch(query: string) {
  return useQuery({
    queryKey: brandKeys.search(query),
    queryFn: () => brandsApi.search(query),
    enabled: query.length > 0,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to create a new brand
 */
export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BrandCreateDto) => brandsApi.create(data),
    onSuccess: () => {
      // Invalidate brand list queries to refetch
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() })
      queryClient.invalidateQueries({ queryKey: brandKeys.lookup() })
    },
  })
}

/**
 * Hook to update an existing brand
 */
export function useUpdateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BrandUpdateDto }) =>
      brandsApi.update(id, data),
    onSuccess: (updatedBrand) => {
      // Update the specific brand in cache
      queryClient.setQueryData(brandKeys.detail(updatedBrand.braId), updatedBrand)
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() })
      queryClient.invalidateQueries({ queryKey: brandKeys.lookup() })
    },
  })
}

/**
 * Hook to delete a brand
 */
export function useDeleteBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => brandsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove the brand from cache
      queryClient.removeQueries({ queryKey: brandKeys.detail(deletedId) })
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() })
      queryClient.invalidateQueries({ queryKey: brandKeys.lookup() })
    },
  })
}
