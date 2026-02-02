import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emailLogsApi } from '@/api/emailLogs'
import type { EmailLogSearchParams, EmailResendDto } from '@/types/emailLog'

// Query keys
export const emailLogKeys = {
  all: ['emailLogs'] as const,
  lists: () => [...emailLogKeys.all, 'list'] as const,
  list: (params: EmailLogSearchParams) => [...emailLogKeys.lists(), params] as const,
  details: () => [...emailLogKeys.all, 'detail'] as const,
  detail: (id: number) => [...emailLogKeys.details(), id] as const,
  stats: () => [...emailLogKeys.all, 'stats'] as const,
}

/**
 * Hook to fetch paginated list of email logs
 */
export function useEmailLogs(params: EmailLogSearchParams = {}) {
  return useQuery({
    queryKey: emailLogKeys.list(params),
    queryFn: () => emailLogsApi.getAll(params),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  })
}

/**
 * Hook to fetch a single email log by ID with full details
 */
export function useEmailLog(id: number) {
  return useQuery({
    queryKey: emailLogKeys.detail(id),
    queryFn: () => emailLogsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch email log statistics
 */
export function useEmailLogStats() {
  return useQuery({
    queryKey: emailLogKeys.stats(),
    queryFn: () => emailLogsApi.getStats(),
    staleTime: 60 * 1000, // Consider data fresh for 60 seconds
  })
}

/**
 * Hook to resend an email
 */
export function useResendEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: EmailResendDto) => emailLogsApi.resend(dto),
    onSuccess: () => {
      // Invalidate email log list queries to refetch
      queryClient.invalidateQueries({ queryKey: emailLogKeys.lists() })
      queryClient.invalidateQueries({ queryKey: emailLogKeys.stats() })
    },
  })
}

/**
 * Hook to export email logs to CSV
 */
export function useExportEmailLogs() {
  return useMutation({
    mutationFn: (params: EmailLogSearchParams = {}) => emailLogsApi.exportCSV(params),
    onSuccess: (csvData) => {
      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `email-logs-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}
