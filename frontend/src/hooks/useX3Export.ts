/**
 * X3 Export Hooks
 * React Query hooks for X3 export operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { x3ExportApi } from '@/api/x3'
import type {
  X3InvoiceExportRequest,
  X3ExportLogSearchParams,
} from '@/types/x3'

// ==========================================================================
// Query Keys
// ==========================================================================

export const x3ExportKeys = {
  all: ['x3-exports'] as const,
  logs: () => [...x3ExportKeys.all, 'logs'] as const,
  logList: (params: X3ExportLogSearchParams) => [...x3ExportKeys.logs(), params] as const,
  logDetail: (id: number) => [...x3ExportKeys.logs(), 'detail', id] as const,
  validation: (params: { date_from: string; date_to: string; society_id?: number; bu_id?: number }) =>
    [...x3ExportKeys.all, 'validation', params] as const,
}

// ==========================================================================
// Export Logs Hooks
// ==========================================================================

/**
 * Hook to fetch paginated list of export logs
 */
export function useX3ExportLogs(params: X3ExportLogSearchParams = {}) {
  return useQuery({
    queryKey: x3ExportKeys.logList(params),
    queryFn: () => x3ExportApi.getExportLogs(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single export log by ID
 */
export function useX3ExportLog(exportId: number) {
  return useQuery({
    queryKey: x3ExportKeys.logDetail(exportId),
    queryFn: () => x3ExportApi.getExportLogById(exportId),
    enabled: !!exportId,
  })
}

// ==========================================================================
// Export Operations Hooks
// ==========================================================================

/**
 * Hook to export invoices to X3 format
 */
export function useExportInvoicesToX3() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: X3InvoiceExportRequest) => x3ExportApi.exportInvoices(request),
    onSuccess: () => {
      // Invalidate export logs to show the new export
      queryClient.invalidateQueries({ queryKey: x3ExportKeys.logs() })
    },
  })
}

/**
 * Hook to validate invoices before export
 */
export function useValidateInvoicesForX3(params: {
  date_from: string
  date_to: string
  society_id?: number
  bu_id?: number
}) {
  return useQuery({
    queryKey: x3ExportKeys.validation(params),
    queryFn: () => x3ExportApi.validateInvoices(params),
    enabled: !!params.date_from && !!params.date_to,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to manually trigger validation (not auto-fetched)
 */
export function useValidateInvoicesForX3Mutation() {
  return useMutation({
    mutationFn: (params: {
      date_from: string
      date_to: string
      society_id?: number
      bu_id?: number
    }) => x3ExportApi.validateInvoices(params),
  })
}

/**
 * Hook to download an export file
 */
export function useDownloadX3Export() {
  return useMutation({
    mutationFn: async (exportId: number) => {
      const blob = await x3ExportApi.downloadExport(exportId)
      return { exportId, blob }
    },
    onSuccess: ({ blob }, exportId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `x3_export_${exportId}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}

// ==========================================================================
// Combined Export Utility
// ==========================================================================

/**
 * Combined hook providing all X3 export functionality
 */
export function useX3Exports(logParams: X3ExportLogSearchParams = {}) {
  const logsQuery = useX3ExportLogs(logParams)
  const exportMutation = useExportInvoicesToX3()
  const downloadMutation = useDownloadX3Export()
  const validateMutation = useValidateInvoicesForX3Mutation()

  return {
    // Export logs
    logs: logsQuery.data?.items || [],
    logsTotal: logsQuery.data?.total || 0,
    logsLoading: logsQuery.isLoading,
    logsError: logsQuery.error,
    refetchLogs: logsQuery.refetch,

    // Export operations
    exportInvoices: exportMutation.mutateAsync,
    isExporting: exportMutation.isPending,
    exportError: exportMutation.error,
    exportResult: exportMutation.data,

    // Download
    downloadExport: downloadMutation.mutate,
    isDownloading: downloadMutation.isPending,
    downloadError: downloadMutation.error,

    // Validation
    validateInvoices: validateMutation.mutateAsync,
    isValidating: validateMutation.isPending,
    validationResult: validateMutation.data,
    validationError: validateMutation.error,
  }
}
