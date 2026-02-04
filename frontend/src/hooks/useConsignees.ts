import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { consigneesApi } from '@/api/consignees'
import type { ConsigneeCreateDto, ConsigneeUpdateDto, ConsigneeSearchParams } from '@/types/consignee'

// Query keys
export const consigneeKeys = {
  all: ['consignees'] as const,
  lists: () => [...consigneeKeys.all, 'list'] as const,
  list: (params: ConsigneeSearchParams) => [...consigneeKeys.lists(), params] as const,
  details: () => [...consigneeKeys.all, 'detail'] as const,
  detail: (id: number) => [...consigneeKeys.details(), id] as const,
}

/**
 * Hook to fetch paginated list of consignees
 */
export function useConsignees(params: ConsigneeSearchParams = {}) {
  return useQuery({
    queryKey: consigneeKeys.list(params),
    queryFn: () => consigneesApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single consignee by ID
 */
export function useConsignee(id: number) {
  return useQuery({
    queryKey: consigneeKeys.detail(id),
    queryFn: () => consigneesApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new consignee
 */
export function useCreateConsignee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ConsigneeCreateDto) => consigneesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consigneeKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing consignee
 */
export function useUpdateConsignee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConsigneeUpdateDto }) => consigneesApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(consigneeKeys.detail(updated.con_id), updated)
      queryClient.invalidateQueries({ queryKey: consigneeKeys.lists() })
    },
  })
}

/**
 * Hook to delete a consignee
 */
export function useDeleteConsignee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => consigneesApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: consigneeKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: consigneeKeys.lists() })
    },
  })
}
