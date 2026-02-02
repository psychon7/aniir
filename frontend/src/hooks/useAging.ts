import { useQuery, useMutation } from '@tanstack/react-query'
import { agingApi } from '@/api/aging'
import type { AgingSearchParams } from '@/types/aging'

// Query keys
export const agingKeys = {
  all: ['aging'] as const,
  analysis: () => [...agingKeys.all, 'analysis'] as const,
  analysisFiltered: (params: AgingSearchParams) => [...agingKeys.analysis(), params] as const,
  invoices: () => [...agingKeys.all, 'invoices'] as const,
  invoicesFiltered: (params: AgingSearchParams) => [...agingKeys.invoices(), params] as const,
  trend: () => [...agingKeys.all, 'trend'] as const,
  trendByMonths: (months: number) => [...agingKeys.trend(), months] as const,
  businessUnits: () => [...agingKeys.all, 'business-units'] as const,
}

/**
 * Hook to fetch aging analysis with bucket breakdown and client summaries
 */
export function useAgingAnalysis(params: AgingSearchParams = {}) {
  return useQuery({
    queryKey: agingKeys.analysisFiltered(params),
    queryFn: () => agingApi.getAnalysis(params),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })
}

/**
 * Hook to fetch detailed list of overdue invoices
 */
export function useAgingInvoices(params: AgingSearchParams = {}) {
  return useQuery({
    queryKey: agingKeys.invoicesFiltered(params),
    queryFn: () => agingApi.getInvoiceDetails(params),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch aging trend data for historical analysis
 */
export function useAgingTrend(months: number = 6) {
  return useQuery({
    queryKey: agingKeys.trendByMonths(months),
    queryFn: () => agingApi.getTrendData(months),
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
  })
}

/**
 * Hook to fetch aging summary by business unit
 */
export function useAgingByBusinessUnit() {
  return useQuery({
    queryKey: agingKeys.businessUnits(),
    queryFn: () => agingApi.getByBusinessUnit(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to export aging report to CSV
 */
export function useExportAging() {
  return useMutation({
    mutationFn: (params: AgingSearchParams = {}) => agingApi.exportCSV(params),
    onSuccess: (csvData) => {
      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `aging-report-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}
