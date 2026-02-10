import { useQuery } from '@tanstack/react-query'
import { clientsApi } from '@/api/clients'
import { clientKeys } from './useClients'

export const activityKeys = {
  all: (clientId: number) => [...clientKeys.detail(clientId), 'activity'] as const,
  list: (clientId: number, params: { page?: number; pageSize?: number; entityType?: string }) =>
    [...activityKeys.all(clientId), params] as const,
}

/**
 * Hook to fetch client activity feed
 */
export function useClientActivity(
  clientId: number,
  params: { page?: number; pageSize?: number; entityType?: string } = {}
) {
  return useQuery({
    queryKey: activityKeys.list(clientId, params),
    queryFn: () => clientsApi.getActivity(clientId, params),
    enabled: !!clientId,
  })
}
