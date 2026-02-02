import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { useToast } from '@/components/ui/feedback/Toast'
import {
  useReceivablesAging,
  useExportReceivablesAging,
} from '@/hooks/useReceivablesAging'
import { useBusinessUnits, useSocieties } from '@/hooks/useLookups'
import type { ReceivablesAgingParams, ClientAgingItem, AgingBucket } from '@/types/receivables'

export const Route = createFileRoute('/_authenticated/accounting/receivables/')({
  component: ReceivablesPage,
})

// Aging bucket colors
const BUCKET_COLORS: Record<AgingBucket, { bg: string; text: string; bar: string }> = {
  '0-30': { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  '31-60': { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' },
  '61-90': { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
  '90+': { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
}

// Bucket labels will be generated with translation keys in the component
const getBucketLabels = (t: any): Record<AgingBucket, string> => ({
  '0-30': t('receivables.bucket.current'),
  '31-60': t('receivables.bucket.31to60'),
  '61-90': t('receivables.bucket.61to90'),
  '90+': t('receivables.bucket.over90'),
})

function ReceivablesPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<ReceivablesAgingParams>({})
  const [searchInput, setSearchInput] = useState('')
  const [expandedClients, setExpandedClients] = useState<Set<number>>(new Set())

  // Data fetching
  const { data: agingData, isLoading } = useReceivablesAging(searchParams)
  const { data: businessUnits = [] } = useBusinessUnits()
  const { data: societies = [] } = useSocieties()

  // Export mutation
  const exportMutation = useExportReceivablesAging()

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams((prev) => ({ ...prev, search: searchInput }))
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchParams((prev) => ({ ...prev, search: undefined }))
  }

  // Handle filter changes
  const handleCompanyFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      companyId: value ? Number(value) : undefined,
    }))
  }

  const handleBusinessUnitFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      buId: value ? Number(value) : undefined,
    }))
  }

  // Handle export
  const handleExport = () => {
    exportMutation.mutate(searchParams, {
      onSuccess: () => success(t('common.exportComplete'), t('receivables.exportSuccess')),
      onError: () => showError(t('common.exportFailed'), t('receivables.exportError')),
    })
  }

  // Toggle client expansion
  const toggleClient = (clientId: number) => {
    setExpandedClients((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  // Expand/collapse all
  const expandAll = () => {
    if (agingData?.byClient) {
      setExpandedClients(new Set(agingData.byClient.map((c) => c.clientId)))
    }
  }

  const collapseAll = () => {
    setExpandedClients(new Set())
  }

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
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

  // Calculate percentages for bar chart
  const summaryPercentages = useMemo(() => {
    if (!agingData || agingData.totalReceivables === 0) {
      return { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
    }
    const total = agingData.totalReceivables
    return {
      '0-30': (agingData.summary['0-30'] / total) * 100,
      '31-60': (agingData.summary['31-60'] / total) * 100,
      '61-90': (agingData.summary['61-90'] / total) * 100,
      '90+': (agingData.summary['90+'] / total) * 100,
    }
  }, [agingData])

  // Filter components
  const filters = (
    <>
      <FormSelect
        value={searchParams.companyId?.toString() || ''}
        onChange={(e) => handleCompanyFilter(e.target.value)}
        options={[
          { value: '', label: t('common.allCompanies') },
          ...societies.map((s) => ({ value: s.key.toString(), label: s.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.buId?.toString() || ''}
        onChange={(e) => handleBusinessUnitFilter(e.target.value)}
        options={[
          { value: '', label: t('common.allUnits') },
          ...businessUnits.map((u) => ({ value: u.key.toString(), label: u.value })),
        ]}
        className="w-40"
      />
    </>
  )

  // Action buttons
  const actions = (
    <button onClick={handleExport} className="btn-secondary" disabled={exportMutation.isPending}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {t('common.exportCSV')}
    </button>
  )

  const BUCKET_LABELS = getBucketLabels(t)

  return (
    <PageContainer>
      <PageHeader
        title={t('receivables.title')}
        description={t('receivables.description')}
        actions={actions}
      />

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('receivables.searchPlaceholder')}
              className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary">
            {t('common.search')}
          </button>
        </form>
        <div className="flex gap-2">{filters}</div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Content */}
      {!isLoading && agingData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">{t('receivables.totalReceivables')}</p>
              <p className="text-2xl font-semibold text-foreground mt-1">
                {formatAmount(agingData.totalReceivables)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('common.asOf')} {formatDate(agingData.asOfDate)}</p>
            </div>
            {(['0-30', '31-60', '61-90', '90+'] as AgingBucket[]).map((bucket) => (
              <div key={bucket} className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">{BUCKET_LABELS[bucket]}</p>
                <p className={`text-2xl font-semibold mt-1 ${BUCKET_COLORS[bucket].text}`}>
                  {formatAmount(agingData.summary[bucket])}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summaryPercentages[bucket].toFixed(1)}% {t('common.ofTotal')}
                </p>
              </div>
            ))}
          </div>

          {/* Aging Bar Chart */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">{t('receivables.agingDistribution')}</h3>
            <div className="h-4 bg-muted rounded-full overflow-hidden flex">
              {(['0-30', '31-60', '61-90', '90+'] as AgingBucket[]).map((bucket) => (
                <div
                  key={bucket}
                  className={`${BUCKET_COLORS[bucket].bar} transition-all duration-300`}
                  style={{ width: `${summaryPercentages[bucket]}%` }}
                  title={`${BUCKET_LABELS[bucket]}: ${formatAmount(agingData.summary[bucket])}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {(['0-30', '31-60', '61-90', '90+'] as AgingBucket[]).map((bucket) => (
                <div key={bucket} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${BUCKET_COLORS[bucket].bar}`} />
                  <span className="text-xs text-muted-foreground">{BUCKET_LABELS[bucket]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Client List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{t('receivables.byClient')}</h3>
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t('common.expandAll')}
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={collapseAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t('common.collapseAll')}
                </button>
              </div>
            </div>

            {agingData.byClient.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t('receivables.noReceivablesFound')}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {agingData.byClient.map((client) => (
                  <ClientAgingRow
                    key={client.clientId}
                    client={client}
                    isExpanded={expandedClients.has(client.clientId)}
                    onToggle={() => toggleClient(client.clientId)}
                    formatAmount={formatAmount}
                    formatDate={formatDate}
                    totalReceivables={agingData.totalReceivables}
                    bucketLabels={BUCKET_LABELS}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  )
}

interface ClientAgingRowProps {
  client: ClientAgingItem
  isExpanded: boolean
  onToggle: () => void
  formatAmount: (amount: number) => string
  formatDate: (date: string) => string
  totalReceivables: number
  bucketLabels: Record<AgingBucket, string>
  t: (key: string, defaultValue?: string) => string
}

function ClientAgingRow({
  client,
  isExpanded,
  onToggle,
  formatAmount,
  formatDate,
  totalReceivables,
  bucketLabels,
  t,
}: ClientAgingRowProps) {
  const clientPercentage = totalReceivables > 0 ? (client.total / totalReceivables) * 100 : 0

  return (
    <div>
      {/* Client Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
          <div className="text-left">
            <p className="font-medium text-foreground">{client.clientName}</p>
            <p className="text-xs text-muted-foreground">{client.clientReference} - {client.invoices.length} {t('common.invoices')}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Mini bucket indicators */}
          <div className="hidden md:flex items-center gap-2">
            {(['0-30', '31-60', '61-90', '90+'] as AgingBucket[]).map((bucket) => (
              <div key={bucket} className="text-right min-w-[80px]">
                <p className={`text-xs ${BUCKET_COLORS[bucket].text}`}>
                  {client.buckets[bucket] > 0 ? formatAmount(client.buckets[bucket]) : '-'}
                </p>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="text-right">
            <p className="font-semibold text-foreground">{formatAmount(client.total)}</p>
            <p className="text-xs text-muted-foreground">{clientPercentage.toFixed(1)}%</p>
          </div>
        </div>
      </button>

      {/* Expanded Invoice Details */}
      {isExpanded && (
        <div className="bg-muted/30 border-t border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('common.invoice')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('common.invoiceDate')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{t('common.dueDate')}</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{t('common.total')}</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{t('receivables.paid')}</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{t('receivables.balance')}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">{t('receivables.daysOverdue')}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">{t('receivables.bucket')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {client.invoices.map((invoice) => (
                <tr key={invoice.invoiceId} className="hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <span className="font-mono text-xs">{invoice.invoiceReference}</span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(invoice.invoiceDate)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{formatAmount(invoice.totalAmount)}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{formatAmount(invoice.paidAmount)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatAmount(invoice.balanceDue)}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={invoice.daysOverdue > 30 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                      {invoice.daysOverdue}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BUCKET_COLORS[invoice.bucket].bg} ${BUCKET_COLORS[invoice.bucket].text}`}
                    >
                      {invoice.bucket}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
