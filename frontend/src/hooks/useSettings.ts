import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings'
import type { EnterpriseSettingsUpdateDto } from '@/api/settings'

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  enterprise: () => [...settingsKeys.all, 'enterprise'] as const,
  societies: () => [...settingsKeys.all, 'societies'] as const,
  society: (id: number) => [...settingsKeys.societies(), id] as const,
}

/**
 * Hook to fetch default enterprise settings
 */
export function useEnterpriseSettings() {
  return useQuery({
    queryKey: settingsKeys.enterprise(),
    queryFn: () => settingsApi.getEnterprise(),
    staleTime: 5 * 60 * 1000, // 5 minutes - settings rarely change
  })
}

/**
 * Hook to update enterprise settings
 */
export function useUpdateEnterpriseSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EnterpriseSettingsUpdateDto }) =>
      settingsApi.updateEnterprise(id, data),
    onSuccess: () => {
      // Invalidate enterprise settings to refetch
      queryClient.invalidateQueries({ queryKey: settingsKeys.enterprise() })
      // Also invalidate societies list since data may have changed
      queryClient.invalidateQueries({ queryKey: settingsKeys.societies() })
    },
  })
}

/**
 * Hook to fetch all societies
 */
export function useSocietiesList() {
  return useQuery({
    queryKey: settingsKeys.societies(),
    queryFn: () => settingsApi.getSocieties(),
    staleTime: 10 * 60 * 1000, // 10 minutes for reference data
  })
}

/**
 * Hook to fetch a single society by ID
 */
export function useSociety(id: number) {
  return useQuery({
    queryKey: settingsKeys.society(id),
    queryFn: () => settingsApi.getSociety(id),
    enabled: !!id,
  })
}
