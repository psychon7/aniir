import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { useToast } from '@/components/ui/feedback/Toast'
import { useClients } from '@/hooks/useClients'
import {
  useCustomerStatement,
  useExportCustomerStatementBlPdf,
  useExportCustomerStatementCsv,
  useExportCustomerStatementPdf,
} from '@/hooks/useStatements'
import type { StatementGenerationParams } from '@/types/statement'

export const Route = createFileRoute('/_authenticated/accounting/statements/')({
  component: StatementsPage,
})

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function getMonthStartIso(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function formatDate(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function formatCurrency(value?: number | null): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value || 0)
}

function StatementsPage() {
  const { success, error: showError } = useToast()

  const [clientId, setClientId] = useState('')
  const [fromDate, setFromDate] = useState(getMonthStartIso())
  const [toDate, setToDate] = useState(getTodayIso())
  const [includePaid, setIncludePaid] = useState(true)
  const [request, setRequest] = useState<{ clientId: number; params: StatementGenerationParams } | null>(null)

  const { data: clientsData, isLoading: isLoadingClients } = useClients({
    page: 1,
    pageSize: 200,
    sortBy: 'companyName',
    sortOrder: 'asc',
  })

  const currentParams = useMemo<StatementGenerationParams>(
    () => ({
      fromDate,
      toDate,
      includePaid,
    }),
    [fromDate, toDate, includePaid]
  )

  const statementQuery = useCustomerStatement(
    request?.clientId,
    request?.params || currentParams,
    !!request
  )

  const exportMutation = useExportCustomerStatementCsv()
  const exportPdfMutation = useExportCustomerStatementPdf()
  const exportBlPdfMutation = useExportCustomerStatementBlPdf()

  const clients = clientsData?.data || []

  const handleGenerate = () => {
    const parsedClientId = Number(clientId)
    if (!parsedClientId || !fromDate || !toDate) {
      showError('Missing filters', 'Client, from date, and to date are required.')
      return
    }

    const nextRequest = {
      clientId: parsedClientId,
      params: currentParams,
    }

    if (
      request &&
      request.clientId === nextRequest.clientId &&
      JSON.stringify(request.params) === JSON.stringify(nextRequest.params)
    ) {
      statementQuery.refetch()
      return
    }

    setRequest(nextRequest)
  }

  const handleExport = () => {
    const parsedClientId = Number(clientId)
    const targetClientId = request?.clientId || parsedClientId
    const targetParams = request?.params || currentParams

    if (!targetClientId || !targetParams.fromDate || !targetParams.toDate) {
      showError('Missing filters', 'Generate a statement first or fill all required filters.')
      return
    }

    exportMutation.mutate(
      {
        clientId: targetClientId,
        params: targetParams,
      },
      {
        onSuccess: () => success('Export complete', 'Statement CSV export started.'),
        onError: () => showError('Export failed', 'Unable to export statement CSV.'),
      }
    )
  }

  const handleExportPdf = (includeInvoice: boolean) => {
    const parsedClientId = Number(clientId)
    const targetClientId = request?.clientId || parsedClientId
    const targetParams = request?.params || currentParams

    if (!targetClientId || !targetParams.fromDate || !targetParams.toDate) {
      showError('Missing filters', 'Generate a statement first or fill all required filters.')
      return
    }

    exportPdfMutation.mutate(
      {
        clientId: targetClientId,
        params: targetParams,
        includeInvoice,
      },
      {
        onSuccess: () =>
          success(
            'Export complete',
            includeInvoice
              ? 'Statement PDF (with invoice) export started.'
              : 'Statement PDF (without invoice) export started.'
          ),
        onError: () => showError('Export failed', 'Unable to export statement PDF.'),
      }
    )
  }

  const handleExportBlPdf = () => {
    const parsedClientId = Number(clientId)
    const targetClientId = request?.clientId || parsedClientId
    const targetParams = request?.params || currentParams

    if (!targetClientId || !targetParams.fromDate || !targetParams.toDate) {
      showError('Missing filters', 'Generate a statement first or fill all required filters.')
      return
    }

    exportBlPdfMutation.mutate(
      {
        clientId: targetClientId,
        params: targetParams,
      },
      {
        onSuccess: () => success('Export complete', 'Statement BL PDF export started.'),
        onError: () => showError('Export failed', 'Unable to export statement BL PDF.'),
      }
    )
  }

  const statement = statementQuery.data

  const actions = (
    <>
      <button
        onClick={() => handleExportPdf(true)}
        className="btn-secondary"
        disabled={exportPdfMutation.isPending}
      >
        {exportPdfMutation.isPending ? 'Exporting...' : 'PDF (With Invoice)'}
      </button>
      <button
        onClick={() => handleExportPdf(false)}
        className="btn-secondary"
        disabled={exportPdfMutation.isPending}
      >
        {exportPdfMutation.isPending ? 'Exporting...' : 'PDF (Without Invoice)'}
      </button>
      <button
        onClick={handleExportBlPdf}
        className="btn-secondary"
        disabled={exportBlPdfMutation.isPending}
      >
        {exportBlPdfMutation.isPending ? 'Exporting...' : 'BL PDF'}
      </button>
      <button
        onClick={handleExport}
        className="btn-secondary"
        disabled={exportMutation.isPending}
      >
        {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
      </button>
      <button
        onClick={handleGenerate}
        className="btn-primary"
        disabled={statementQuery.isFetching}
      >
        {statementQuery.isFetching ? 'Generating...' : 'Generate Statement'}
      </button>
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title="Customer Statements"
        description="Generate client account statements with opening/closing balances and transaction history."
        actions={actions}
      />

      <Card className="mb-6">
        <CardHeader
          title="Filters"
          description="Select a client and date range to generate a statement."
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormSelect
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              options={[
                { value: '', label: isLoadingClients ? 'Loading clients...' : 'Select client' },
                ...clients.map((client) => ({
                  value: String(client.id),
                  label: `${client.reference} - ${client.companyName}`,
                })),
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">From Date</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">To Date</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePaid}
                  onChange={(e) => setIncludePaid(e.target.checked)}
                />
                Include fully paid invoices
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {statementQuery.isError && (
        <Card className="mb-6">
          <CardContent>
            <p className="text-destructive">
              Failed to generate statement. Verify filters and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {statement && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Opening Balance" value={formatCurrency(statement.opening_balance)} />
            <MetricCard label="Total Debits" value={formatCurrency(statement.totals.total_debits)} />
            <MetricCard label="Total Credits" value={formatCurrency(statement.totals.total_credits)} />
            <MetricCard label="Closing Balance" value={formatCurrency(statement.closing_balance)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader title="Client" />
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <Row label="Name" value={statement.client.company_name || '-'} />
                  <Row label="Reference" value={statement.client.reference || '-'} />
                  <Row label="Email" value={statement.client.email || '-'} />
                  <Row label="Period" value={`${formatDate(statement.period.from_date)} - ${formatDate(statement.period.to_date)}`} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Aging Summary" />
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <Row label="0-30 days" value={formatCurrency(statement.aging_summary.current)} />
                  <Row label="31-60 days" value={formatCurrency(statement.aging_summary.days_31_60)} />
                  <Row label="61-90 days" value={formatCurrency(statement.aging_summary.days_61_90)} />
                  <Row label="90+ days" value={formatCurrency(statement.aging_summary.over_90)} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Report Details" />
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <Row label="Transactions" value={String(statement.totals.transaction_count)} />
                  <Row label="Net Change" value={formatCurrency(statement.totals.net_change)} />
                  <Row label="Generated At" value={formatDate(statement.generated_at)} />
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Transactions"
              description="Invoices, credit notes, and payments in chronological order."
            />
            <CardContent>
              {statement.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions found for the selected period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4">Date</th>
                        <th className="text-left py-2 pr-4">Type</th>
                        <th className="text-left py-2 pr-4">Reference</th>
                        <th className="text-left py-2 pr-4">Description</th>
                        <th className="text-right py-2 pr-4">Debit</th>
                        <th className="text-right py-2 pr-4">Credit</th>
                        <th className="text-right py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statement.transactions.map((transaction, index) => (
                        <tr key={`${transaction.reference}-${index}`} className="border-b border-border/50">
                          <td className="py-2 pr-4">{formatDate(transaction.date)}</td>
                          <td className="py-2 pr-4">{transaction.type}</td>
                          <td className="py-2 pr-4 font-mono">{transaction.reference}</td>
                          <td className="py-2 pr-4">{transaction.description}</td>
                          <td className="py-2 pr-4 text-right">{formatCurrency(transaction.debit)}</td>
                          <td className="py-2 pr-4 text-right">{formatCurrency(transaction.credit)}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(transaction.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground text-right">{value}</dd>
    </div>
  )
}
