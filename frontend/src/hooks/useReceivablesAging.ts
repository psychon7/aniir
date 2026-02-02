import { useQuery, useMutation } from '@tanstack/react-query'
import { accountingApi } from '@/api/accounting'
import type { ReceivablesAgingParams } from '@/types/receivables'

// Query keys
export const receivablesAgingKeys = {
  all: ['receivables-aging'] as const,
  reports: () => [...receivablesAgingKeys.all, 'report'] as const,
  report: (params: ReceivablesAgingParams) => [...receivablesAgingKeys.reports(), params] as const,
}

/**
 * Hook to fetch receivables aging report
 */
export function useReceivablesAging(params: ReceivablesAgingParams = {}) {
  return useQuery({
    queryKey: receivablesAgingKeys.report(params),
    queryFn: () => accountingApi.getReceivablesAging(params),
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
  })
}

/**
 * Hook to export receivables aging report to CSV
 */
export function useExportReceivablesAging() {
  return useMutation({
    mutationFn: (params: ReceivablesAgingParams = {}) => accountingApi.exportReceivablesAging(params),
    onSuccess: (csvData) => {
      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `receivables-aging-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}
