import apiClient from './client'
import { isMockEnabled } from '@/mocks/delay'
import type { CustomerStatementReport, StatementGenerationParams } from '@/types/statement'

function buildMockStatement(clientId: number, params: StatementGenerationParams): CustomerStatementReport {
  const fromDate = params.fromDate
  const toDate = params.toDate

  return {
    statement_type: 'CUSTOMER',
    client: {
      id: clientId,
      reference: `CLI-${clientId}`,
      company_name: `Client #${clientId}`,
    },
    period: {
      from_date: fromDate,
      to_date: toDate,
    },
    opening_balance: 0,
    transactions: [],
    totals: {
      total_debits: 0,
      total_credits: 0,
      net_change: 0,
      transaction_count: 0,
    },
    closing_balance: 0,
    aging_summary: {
      current: 0,
      days_31_60: 0,
      days_61_90: 0,
      over_90: 0,
    },
    filters: {
      include_paid_invoices: params.includePaid ?? true,
      society_id: params.societyId,
    },
    generated_at: new Date().toISOString(),
  }
}

/**
 * Customer statement API methods.
 */
export const statementsApi = {
  /**
   * Generate customer statement for a client and date range.
   */
  async getCustomerStatement(
    clientId: number,
    params: StatementGenerationParams
  ): Promise<CustomerStatementReport> {
    if (isMockEnabled()) {
      return buildMockStatement(clientId, params)
    }

    const response = await apiClient.get<CustomerStatementReport>(`/accounting/clients/${clientId}/statement`, {
      params: {
        from_date: params.fromDate,
        to_date: params.toDate,
        include_paid: params.includePaid ?? true,
        society_id: params.societyId,
      },
    })
    return response.data
  },

  /**
   * Export customer statement in CSV format.
   */
  async exportCustomerStatementCsv(clientId: number, params: StatementGenerationParams): Promise<string> {
    if (isMockEnabled()) {
      return 'Date,Type,Reference,Description,Debit,Credit,Balance\n'
    }

    const response = await apiClient.get<string>(`/accounting/clients/${clientId}/statement/export/csv`, {
      params: {
        from_date: params.fromDate,
        to_date: params.toDate,
        include_paid: params.includePaid ?? true,
        society_id: params.societyId,
      },
      headers: {
        Accept: 'text/csv',
      },
    })
    return response.data
  },

  /**
   * Export customer statement in PDF format.
   */
  async exportCustomerStatementPdf(
    clientId: number,
    params: StatementGenerationParams,
    includeInvoice = true
  ): Promise<Blob> {
    if (isMockEnabled()) {
      return new Blob(['%PDF-1.4 mock statement pdf'], { type: 'application/pdf' })
    }

    const response = await apiClient.get<Blob>(`/accounting/clients/${clientId}/statement/export/pdf`, {
      params: {
        from_date: params.fromDate,
        to_date: params.toDate,
        include_paid: params.includePaid ?? true,
        include_invoice: includeInvoice,
        society_id: params.societyId,
      },
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export customer statement in BL PDF format.
   */
  async exportCustomerStatementBlPdf(
    clientId: number,
    params: StatementGenerationParams
  ): Promise<Blob> {
    if (isMockEnabled()) {
      return new Blob(['%PDF-1.4 mock statement bl pdf'], { type: 'application/pdf' })
    }

    const response = await apiClient.get<Blob>(`/accounting/clients/${clientId}/statement/export/bl-pdf`, {
      params: {
        from_date: params.fromDate,
        to_date: params.toDate,
        include_paid: params.includePaid ?? true,
        society_id: params.societyId,
      },
      responseType: 'blob',
    })
    return response.data
  },
}
