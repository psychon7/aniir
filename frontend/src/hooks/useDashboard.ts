import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
  backorders: (limit: number) => [...dashboardKeys.all, 'backorders', limit] as const,
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: dashboardApi.getKpis,
    staleTime: 60 * 1000,
  })
}

export function useDashboardBackorders(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.backorders(limit),
    queryFn: () => dashboardApi.getBackorders(limit),
    staleTime: 60 * 1000,
  })
}
