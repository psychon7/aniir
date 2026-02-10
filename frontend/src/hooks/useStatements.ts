import { useMutation, useQuery } from '@tanstack/react-query'
import { statementsApi } from '@/api/statements'
import type { StatementGenerationParams } from '@/types/statement'

export const statementKeys = {
  all: ['customer-statements'] as const,
  report: (clientId: number, params: StatementGenerationParams) =>
    [...statementKeys.all, 'report', clientId, params] as const,
}

/**
 * Generate customer statement report.
 */
export function useCustomerStatement(
  clientId: number | undefined,
  params: StatementGenerationParams,
  enabled = true
) {
  return useQuery({
    queryKey: statementKeys.report(clientId || 0, params),
    queryFn: () => statementsApi.getCustomerStatement(clientId as number, params),
    enabled: enabled && !!clientId && !!params.fromDate && !!params.toDate,
    staleTime: 30 * 1000,
  })
}

/**
 * Export customer statement to CSV.
 */
export function useExportCustomerStatementCsv() {
  return useMutation({
    mutationFn: ({
      clientId,
      params,
    }: {
      clientId: number
      params: StatementGenerationParams
    }) => statementsApi.exportCustomerStatementCsv(clientId, params),
    onSuccess: (csvData) => {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `customer-statement-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}

/**
 * Export customer statement to PDF.
 */
export function useExportCustomerStatementPdf() {
  return useMutation({
    mutationFn: ({
      clientId,
      params,
      includeInvoice,
    }: {
      clientId: number
      params: StatementGenerationParams
      includeInvoice: boolean
    }) => statementsApi.exportCustomerStatementPdf(clientId, params, includeInvoice),
    onSuccess: (pdfBlob, variables) => {
      const blob = new Blob([pdfBlob], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      const mode = variables.includeInvoice ? 'with-invoice' : 'without-invoice'
      link.download = `customer-statement-${mode}-${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}

/**
 * Export customer statement to BL PDF.
 */
export function useExportCustomerStatementBlPdf() {
  return useMutation({
    mutationFn: ({
      clientId,
      params,
    }: {
      clientId: number
      params: StatementGenerationParams
    }) => statementsApi.exportCustomerStatementBlPdf(clientId, params),
    onSuccess: (pdfBlob) => {
      const blob = new Blob([pdfBlob], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `customer-statement-bl-${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}
