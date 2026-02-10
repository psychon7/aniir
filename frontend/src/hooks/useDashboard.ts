import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: dashboardApi.getKpis,
    staleTime: 60 * 1000,
  })
}
