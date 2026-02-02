import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { statementsApi } from '@/api/statements'
import type { StatementCreateDto, StatementUpdateDto, StatementSearchParams } from '@/types/statement'

// Query keys
export const statementKeys = {
  all: ['statements'] as const,
  lists: () => [...statementKeys.all, 'list'] as const,
  list: (params: StatementSearchParams) => [...statementKeys.lists(), params] as const,
  details: () => [...statementKeys.all, 'detail'] as const,
  detail: (id: number) => [...statementKeys.details(), id] as const,
}

/**
 * Hook to fetch paginated list of statements
 */
export function useStatements(params: StatementSearchParams = {}) {
  return useQuery({
    queryKey: statementKeys.list(params),
    queryFn: () => statementsApi.getAll(params),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  })
}

/**
 * Hook to fetch a single statement by ID
 */
export function useStatement(id: number) {
  return useQuery({
    queryKey: statementKeys.detail(id),
    queryFn: () => statementsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new statement
 */
export function useCreateStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StatementCreateDto) => statementsApi.create(data),
    onSuccess: () => {
      // Invalidate statement list queries to refetch
      queryClient.invalidateQueries({ queryKey: statementKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing statement
 */
export function useUpdateStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StatementUpdateDto) => statementsApi.update(data),
    onSuccess: (updatedStatement) => {
      // Update the specific statement in cache
      queryClient.setQueryData(statementKeys.detail(updatedStatement.id), updatedStatement)
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: statementKeys.lists() })
    },
  })
}

/**
 * Hook to delete a statement
 */
export function useDeleteStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => statementsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove the statement from cache
      queryClient.removeQueries({ queryKey: statementKeys.detail(deletedId) })
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: statementKeys.lists() })
    },
  })
}

/**
 * Hook to export statements to CSV
 */
export function useExportStatements() {
  return useMutation({
    mutationFn: (params: StatementSearchParams = {}) => statementsApi.exportCSV(params),
    onSuccess: (csvData) => {
      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `statements-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}

/**
 * Hook to send statement to client via email
 */
export function useSendStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, email }: { id: number; email: string }) => statementsApi.sendToClient(id, email),
    onSuccess: (_, { id }) => {
      // Invalidate the specific statement to refetch sent status
      queryClient.invalidateQueries({ queryKey: statementKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: statementKeys.lists() })
    },
  })
}

/**
 * Hook to generate and download statement PDF
 */
export function useGenerateStatementPDF() {
  return useMutation({
    mutationFn: (id: number) => statementsApi.generatePDF(id),
    onSuccess: (blob, id) => {
      // Create and download the PDF file
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `statement-${id}-${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}
