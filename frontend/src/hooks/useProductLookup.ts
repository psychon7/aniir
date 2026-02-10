import { useQuery } from '@tanstack/react-query'
import { searchProducts, type ProductSearchParams } from '@/api/products'

export const productKeys = {
  all: ['products'] as const,
  search: (params: ProductSearchParams) => [...productKeys.all, 'search', params] as const,
}

export function useProductSearch(params: ProductSearchParams = {}, enabled = true) {
  return useQuery({
    queryKey: productKeys.search(params),
    queryFn: () => searchProducts(params),
    enabled: enabled && (params.search ? params.search.length >= 2 : true),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
