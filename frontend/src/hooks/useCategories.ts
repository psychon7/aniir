import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/api/categories'
import type { CategoryCreateDto, CategoryUpdateDto } from '@/types/category'

export const categoryKeys = {
  all: ['categories'] as const,
  list: (params?: object) => [...categoryKeys.all, 'list', params] as const,
}

export function useCategories(params: {
  skip?: number
  limit?: number
  search?: string
  parent_id?: number
  root_only?: boolean
  active_only?: boolean
  society_id?: number
} = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoriesApi.list(params),
    staleTime: 60 * 1000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CategoryCreateDto) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: ['lookups', 'productCategories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: CategoryUpdateDto }) =>
      categoriesApi.update(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: ['lookups', 'productCategories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: number) => categoriesApi.delete(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: ['lookups', 'productCategories'] })
    },
  })
}

