import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { DataTable, Column } from '@/components/ui/data-table'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { LoadingSkeleton } from '@/components/ui/feedback/LoadingSkeleton'
import { useToast } from '@/components/ui/feedback/Toast'
import { AgingChart } from '@/components/features/accounting/aging/AgingChart'
import { AgingBucketsDisplay, AgingSummaryStats } from '@/components/features/accounting/aging/AgingBucketsDisplay'
import {
  useAgingAnalysis,
  useAgingInvoices,
  useExportAging,
} from '@/hooks/useAging'
import { useBusinessUnits } from '@/hooks/useLookups'
import type { AgingSearchParams, AgingInvoiceDetail, AgingBucket } from '@/types/aging'

export const Route = createFileRoute('/_authenticated/accounting/aging/')({
  component: AgingPage,
})

function AgingPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  // Filter state
  const [searchParams, setSearchParams] = useState<AgingSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'daysOverdue',
    sortOrder: 'desc',
  })

  // Chart type toggle
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')

  // Data fetching
  const { data: agingData, isLoading: isLoadingAnalysis } = useAgingAnalysis(searchParams)
  const { data: invoicesData, isLoading: isLoadingInvoices } = useAgingInvoices(searchParams)
  const { data: businessUnits = [] } = useBusinessUnits()

  // Mutations
  const exportMutation = useExportAging()

  // Handle filter changes
  const handleBusinessUnitFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      businessUnitId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  const handleMinDaysFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      minDaysOverdue: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  // Handle bucket click - filter to show only invoices in that bucket
  const handleBucketClick = (bucket: AgingBucket) => {
    setSearchParams((prev) => ({
      ...prev,
      minDaysOverdue: bucket.daysFrom,
      page: 1,
    }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, pageSize, page: 1 }))
  }

  // Handle sort change
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSearchParams((prev) => ({ ...prev, sortBy, sortOrder }))
  }

  // Handle export
  const handleExport = () => {
    exportMutation.mutate(searchParams, {
      onSuccess: () => success(t('aging.export.success.title'), t('aging.export.success.message')),
      onError: () => showError(t('aging.export.error.title'), t('aging.export.error.message')),
    })
  }

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Table columns
  const columns: Column<AgingInvoiceDetail>[] = [
    {
      id: 'invoiceCode',
      header: t('aging.table.columns.invoice'),
      accessorKey: 'invoiceCode',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-mono text-sm text-foreground">{row.invoiceCode}</p>
          <p className="text-xs text-muted-foreground truncate max-w-48">{row.invoiceName}</p>
        </div>
      ),
    },
    {
      id: 'clientName',
      header: t('aging.table.columns.client'),
      accessorKey: 'clientName',
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-foreground">{row.clientName}</span>
      ),
    },
    {
      id: 'dueDate',
      header: t('aging.table.columns.dueDate'),
      accessorKey: 'dueDate',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.dueDate)}</span>
      ),
    },
    {
      id: 'daysOverdue',
      header: t('aging.table.columns.daysOverdue'),
      accessorKey: 'daysOverdue',
      sortable: true,
      cell: (row) => {
        let colorClass = 'text-emerald-600'
        if (row.daysOverdue > 90) colorClass = 'text-rose-600'
        else if (row.daysOverdue > 60) colorClass = 'text-orange-600'
        else if (row.daysOverdue > 30) colorClass = 'text-amber-600'

        return (
          <span className={`font-medium ${colorClass}`}>
            {row.daysOverdue > 0 ? t('aging.table.cells.daysCount', { count: row.daysOverdue }) : t('aging.table.cells.current')}
          </span>
        )
      },
      className: 'text-center',
    },
    {
      id: 'amountDue',
      header: t('aging.table.columns.amountDue'),
      accessorKey: 'amountDue',
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-foreground">{formatAmount(row.amountDue)}</span>
      ),
      className: 'text-right',
    },
    {
      id: 'businessUnitName',
      header: t('aging.table.columns.businessUnit'),
      accessorKey: 'businessUnitName',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.businessUnitName || '-'}</span>
      ),
    },
  ]

  // Filter components
  const filters = (
    <>
      <FormSelect
        value={searchParams.businessUnitId?.toString() || ''}
        onChange={(e) => handleBusinessUnitFilter(e.target.value)}
        options={[
          { value: '', label: t('aging.filters.allUnits') },
          ...businessUnits.map((u) => ({ value: u.key, label: u.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.minDaysOverdue?.toString() || ''}
        onChange={(e) => handleMinDaysFilter(e.target.value)}
        options={[
          { value: '', label: t('aging.filters.allAging') },
          { value: '0', label: t('aging.filters.current') },
          { value: '31', label: t('aging.filters.thirtyToSixty') },
          { value: '61', label: t('aging.filters.sixtyToNinety') },
          { value: '91', label: t('aging.filters.ninetyPlus') },
        ]}
        className="w-40"
      />
    </>
  )

  // Action buttons
  const actions = (
    <>
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => setChartType('bar')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            chartType === 'bar'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('aging.chartType.bar')}
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            chartType === 'pie'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('aging.chartType.pie')}
        </button>
      </div>
      <button onClick={handleExport} className="btn-secondary" disabled={exportMutation.isPending}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t('aging.actions.export')}
      </button>
    </>
  )

  const totalInvoices = agingData?.buckets?.reduce((sum, b) => sum + b.invoiceCount, 0) || 0
  const totalClients = agingData?.clientSummaries?.length || 0

  return (
    <PageContainer>
      <PageHeader
        title={t('aging.title')}
        description={t('aging.description')}
        actions={actions}
      />

      {/* Summary Stats */}
      {isLoadingAnalysis ? (
        <LoadingSkeleton className="h-24" />
      ) : agingData ? (
        <AgingSummaryStats
          totalOutstanding={agingData.totalOutstanding}
          invoiceCount={totalInvoices}
          clientCount={totalClients}
          className="mb-6"
        />
      ) : null}

      {/* Aging Buckets */}
      {isLoadingAnalysis ? (
        <LoadingSkeleton className="h-32 mb-6" />
      ) : agingData ? (
        <AgingBucketsDisplay
          buckets={agingData.buckets}
          totalOutstanding={agingData.totalOutstanding}
          onBucketClick={handleBucketClick}
          className="mb-6"
        />
      ) : null}

      {/* Chart */}
      {isLoadingAnalysis ? (
        <LoadingSkeleton className="h-96 mb-6" />
      ) : agingData ? (
        <AgingChart
          buckets={agingData.buckets}
          totalOutstanding={agingData.totalOutstanding}
          chartType={chartType}
          title={t('aging.chart.title')}
          className="mb-6"
        />
      ) : null}

      {/* Client Summaries */}
      {agingData && agingData.clientSummaries.length > 0 && (
        <Card variant="elevated" padding="md" className="mb-6">
          <CardHeader
            title={t('aging.clientBreakdown.title')}
            description={t('aging.clientBreakdown.description')}
          />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('aging.clientBreakdown.columns.client')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('aging.clientBreakdown.columns.current')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('aging.clientBreakdown.columns.thirtyToSixty')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('aging.clientBreakdown.columns.sixtyToNinety')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('aging.clientBreakdown.columns.ninetyPlus')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('aging.clientBreakdown.columns.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {agingData.clientSummaries.map((client) => (
                    <tr key={client.clientId} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{client.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('aging.clientBreakdown.invoiceCount', { count: client.invoiceCount })}
                            {client.oldestInvoiceDays > 0 && ` | ${t('aging.clientBreakdown.oldest')}: ${client.oldestInvoiceDays} ${t('aging.clientBreakdown.days')}`}
                          </p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-emerald-600">
                        {client.current > 0 ? formatAmount(client.current) : '-'}
                      </td>
                      <td className="text-right py-3 px-4 text-amber-600">
                        {client.thirtyDays > 0 ? formatAmount(client.thirtyDays) : '-'}
                      </td>
                      <td className="text-right py-3 px-4 text-orange-600">
                        {client.sixtyDays > 0 ? formatAmount(client.sixtyDays) : '-'}
                      </td>
                      <td className="text-right py-3 px-4 text-rose-600">
                        {client.ninetyPlus > 0 ? formatAmount(client.ninetyPlus) : '-'}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-foreground">
                        {formatAmount(client.totalOutstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Details Table */}
      <Card variant="elevated" padding="none">
        <div className="p-6 pb-0">
          <CardHeader
            title={t('aging.invoiceDetails.title')}
            description={t('aging.invoiceDetails.description')}
          />
        </div>
        <DataTable
          columns={columns}
          data={invoicesData?.data || []}
          keyField="invoiceId"
          isLoading={isLoadingInvoices}
          page={searchParams.page}
          pageSize={searchParams.pageSize}
          totalCount={invoicesData?.totalCount || 0}
          totalPages={invoicesData?.totalPages || 1}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          sortBy={searchParams.sortBy}
          sortOrder={searchParams.sortOrder}
          onSortChange={handleSortChange}
          filters={filters}
          emptyMessage={t('aging.invoiceDetails.emptyMessage')}
          emptyDescription={t('aging.invoiceDetails.emptyDescription')}
        />
      </Card>
    </PageContainer>
  )
}
