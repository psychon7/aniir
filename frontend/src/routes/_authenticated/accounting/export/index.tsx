/**
 * Export Page
 * Manage X3 export operations for invoices and payments
 */
import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/layout/Card'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { useToast } from '@/components/ui/feedback/Toast'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import {
  useX3ExportLogs,
  useExportInvoicesToX3,
  useDownloadX3Export,
  useValidateInvoicesForX3Mutation,
} from '@/hooks/useX3Export'
import { useX3MappingStats } from '@/hooks/useX3Mappings'
import { PdfUtilityPage } from '@/components/documents/PdfUtilityPage'
import type {
  X3ExportLog,
  X3ExportLogSearchParams,
  X3InvoiceExportRequest,
  X3ValidationResponse,
} from '@/types/x3'

export const Route = createFileRoute('/_authenticated/accounting/export/')({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: typeof search.mode === 'string' ? search.mode : undefined,
    source: typeof search.source === 'string' ? search.source : undefined,
    title: typeof search.title === 'string' ? search.title : undefined,
    filename: typeof search.filename === 'string' ? search.filename : undefined,
  }),
  component: ExportPage,
})

function ExportPage() {
  const search = Route.useSearch()
  if (
    (search.mode === 'pdf-viewer' || search.mode === 'pdf-download') &&
    search.source
  ) {
    return (
      <PdfUtilityPage
        mode={search.mode}
        source={search.source}
        title={search.title}
        filename={search.filename}
      />
    )
  }

  return <X3ExportPage />
}

function X3ExportPage() {
  const { t } = useTranslation()
  const { success, error: showError, warning } = useToast()

  // Export logs search params
  const [logSearchParams, setLogSearchParams] = useState<X3ExportLogSearchParams>({
    page: 1,
    page_size: 10,
  })

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportType, setExportType] = useState<'invoices' | 'payments'>('invoices')
  const [exportForm, setExportForm] = useState<X3InvoiceExportRequest>({
    date_from: '',
    date_to: '',
    include_lines: true,
  })
  const [validationResult, setValidationResult] = useState<X3ValidationResponse | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Data fetching
  const { data: exportLogsData, isLoading: isLoadingLogs, refetch: refetchLogs } = useX3ExportLogs(logSearchParams)
  const { data: stats } = useX3MappingStats()

  // Mutations
  const exportInvoicesMutation = useExportInvoicesToX3()
  const downloadMutation = useDownloadX3Export()
  const validateMutation = useValidateInvoicesForX3Mutation()

  // ==========================================================================
  // Export Handlers
  // ==========================================================================

  const handleOpenExportModal = (type: 'invoices' | 'payments') => {
    setExportType(type)
    setExportForm({
      date_from: getDefaultDateFrom(),
      date_to: getDefaultDateTo(),
      include_lines: true,
    })
    setValidationResult(null)
    setIsExportModalOpen(true)
  }

  const handleValidate = async () => {
    if (!exportForm.date_from || !exportForm.date_to) {
      showError(t('x3.validationError'), t('x3.selectDateRange'))
      return
    }

    setIsValidating(true)
    try {
      const result = await validateMutation.mutateAsync({
        date_from: exportForm.date_from,
        date_to: exportForm.date_to,
        society_id: exportForm.society_id,
        bu_id: exportForm.bu_id,
      })
      setValidationResult(result)

      if (!result.can_export) {
        warning(t('x3.validationWarning'), t('x3.missingMappingsDesc'))
      }
    } catch (err) {
      showError(t('common.error'), t('x3.validationFailed'))
    } finally {
      setIsValidating(false)
    }
  }

  const handleExport = async () => {
    if (!exportForm.date_from || !exportForm.date_to) {
      showError(t('x3.validationError'), t('x3.selectDateRange'))
      return
    }

    try {
      const result = await exportInvoicesMutation.mutateAsync(exportForm)

      if (result.status === 'COMPLETED') {
        success(t('x3.exportComplete'), t('x3.exportCompleteDesc', { count: result.exported_invoices }))
      } else if (result.status === 'PARTIAL') {
        warning(
          t('x3.exportPartial'),
          t('x3.exportPartialDesc', {
            exported: result.exported_invoices,
            skipped: result.skipped_invoices,
          })
        )
      } else {
        showError(t('x3.exportFailed'), result.errors.join(', '))
      }

      setIsExportModalOpen(false)
      setValidationResult(null)
      refetchLogs()
    } catch (err) {
      showError(t('common.error'), t('x3.exportFailed'))
    }
  }

  const handleDownload = (exportId: number) => {
    downloadMutation.mutate(exportId, {
      onSuccess: () => {
        success(t('x3.downloadStarted'), t('x3.downloadStartedDesc'))
      },
      onError: () => {
        showError(t('common.error'), t('x3.downloadFailed'))
      },
    })
  }

  // ==========================================================================
  // Pagination Handlers
  // ==========================================================================

  const handlePageChange = (page: number) => {
    setLogSearchParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (page_size: number) => {
    setLogSearchParams((prev) => ({ ...prev, page_size, page: 1 }))
  }

  const handleTypeFilter = (value: string) => {
    setLogSearchParams((prev) => ({
      ...prev,
      export_type: value as 'INVOICES' | 'PAYMENTS' | undefined,
      page: 1,
    }))
  }

  const handleStatusFilter = (value: string) => {
    setLogSearchParams((prev) => ({
      ...prev,
      status: value as 'COMPLETED' | 'FAILED' | 'PARTIAL' | undefined,
      page: 1,
    }))
  }

  // ==========================================================================
  // Table Columns
  // ==========================================================================

  const columns = useMemo<Column<X3ExportLog>[]>(
    () => [
      {
        id: 'id',
        header: t('x3.exportId'),
        accessorKey: 'id',
        cell: (row) => <span className="font-mono text-sm">#{row.id}</span>,
      },
      {
        id: 'export_type',
        header: t('x3.exportType'),
        accessorKey: 'export_type',
        cell: (row) => (
          <span className="text-sm font-medium">
            {row.export_type === 'INVOICES' ? t('x3.invoices') : t('x3.payments')}
          </span>
        ),
      },
      {
        id: 'date_range',
        header: t('x3.dateRange'),
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.date_from)} - {formatDate(row.date_to)}
          </span>
        ),
      },
      {
        id: 'records',
        header: t('x3.records'),
        cell: (row) => (
          <div className="text-sm">
            <span className="text-foreground font-medium">{row.exported_records}</span>
            <span className="text-muted-foreground"> / {row.total_records}</span>
            {row.failed_records > 0 && (
              <span className="text-destructive ml-1">({row.failed_records} failed)</span>
            )}
          </div>
        ),
      },
      {
        id: 'status',
        header: t('x3.status'),
        accessorKey: 'status',
        cell: (row) => <StatusBadge status={row.status.toLowerCase()} />,
      },
      {
        id: 'file_size',
        header: t('x3.fileSize'),
        accessorKey: 'file_size',
        cell: (row) =>
          row.file_size ? (
            <span className="text-sm text-muted-foreground">{formatFileSize(row.file_size)}</span>
          ) : (
            <span className="text-sm text-muted-foreground/50">-</span>
          ),
      },
      {
        id: 'created_at',
        header: t('x3.createdAt'),
        accessorKey: 'created_at',
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.created_at).toLocaleString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            {row.file_name && row.status === 'COMPLETED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(row.id)
                }}
                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title={t('x3.download')}
                disabled={downloadMutation.isPending}
              >
                <DownloadIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
        className: 'w-16',
      },
    ],
    [t, downloadMutation.isPending]
  )

  // ==========================================================================
  // Filters
  // ==========================================================================

  const filters = (
    <>
      <FormSelect
        value={logSearchParams.export_type || ''}
        onChange={(e) => handleTypeFilter(e.target.value)}
        options={[
          { value: '', label: t('x3.allTypes') },
          { value: 'INVOICES', label: t('x3.invoices') },
          { value: 'PAYMENTS', label: t('x3.payments') },
        ]}
        className="w-36"
      />
      <FormSelect
        value={logSearchParams.status || ''}
        onChange={(e) => handleStatusFilter(e.target.value)}
        options={[
          { value: '', label: t('x3.allStatuses') },
          { value: 'COMPLETED', label: t('x3.completed') },
          { value: 'PARTIAL', label: t('x3.partial') },
          { value: 'FAILED', label: t('x3.failed') },
        ]}
        className="w-36"
      />
    </>
  )

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <PageContainer>
      <PageHeader
        title={t('x3.exportTitle')}
        description={t('x3.exportDescription')}
        breadcrumbs={[
          { label: t('breadcrumbs.accounting') },
          { label: t('breadcrumbs.export') },
        ]}
      />

      {/* Export Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Export Invoices Card */}
        <Card className="border-2 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <InvoiceIcon className="w-6 h-6 text-primary" />
              </div>
              {stats && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('x3.mappedCustomers')}</p>
                  <p className="text-lg font-semibold">{stats.customer_mappings.total}</p>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('x3.exportInvoices')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('x3.exportInvoicesDesc')}</p>
            <button
              onClick={() => handleOpenExportModal('invoices')}
              className="btn-primary w-full"
              disabled={exportInvoicesMutation.isPending}
            >
              <ExportIcon className="w-4 h-4" />
              {t('x3.startExport')}
            </button>
          </CardContent>
        </Card>

        {/* Export Payments Card */}
        <Card className="border-2 hover:border-primary/30 transition-colors opacity-60">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <PaymentIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('x3.exportPayments')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('x3.exportPaymentsDesc')}</p>
            <button
              className="btn-secondary w-full"
              disabled
              title={t('x3.comingSoon')}
            >
              <ExportIcon className="w-4 h-4" />
              {t('x3.comingSoon')}
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Export History */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">{t('x3.exportHistory')}</h2>
        <p className="text-sm text-muted-foreground">{t('x3.exportHistoryDesc')}</p>
      </div>

      <DataTable
        columns={columns}
        data={exportLogsData?.items || []}
        keyField="id"
        isLoading={isLoadingLogs}
        page={logSearchParams.page}
        pageSize={logSearchParams.page_size}
        totalCount={exportLogsData?.total || 0}
        totalPages={exportLogsData?.total_pages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        filters={filters}
        emptyMessage={t('x3.noExports')}
        emptyDescription={t('x3.noExportsDesc')}
      />

      {/* Export Modal */}
      <FormModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false)
          setValidationResult(null)
        }}
        title={exportType === 'invoices' ? t('x3.exportInvoices') : t('x3.exportPayments')}
        description={t('x3.exportModalDesc')}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={handleValidate}
              className="btn-secondary"
              disabled={isValidating || !exportForm.date_from || !exportForm.date_to}
            >
              {isValidating ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  {t('x3.validating')}
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  {t('x3.validateFirst')}
                </>
              )}
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsExportModalOpen(false)
                  setValidationResult(null)
                }}
                className="btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleExport}
                className="btn-primary"
                disabled={
                  exportInvoicesMutation.isPending ||
                  !exportForm.date_from ||
                  !exportForm.date_to
                }
              >
                {exportInvoicesMutation.isPending ? (
                  <>
                    <LoadingSpinner className="w-4 h-4" />
                    {t('x3.exporting')}
                  </>
                ) : (
                  <>
                    <ExportIcon className="w-4 h-4" />
                    {t('x3.exportNow')}
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label={t('x3.dateFrom')}
              type="date"
              value={exportForm.date_from}
              onChange={(e) => setExportForm((f) => ({ ...f, date_from: e.target.value }))}
              required
            />
            <FormInput
              label={t('x3.dateTo')}
              type="date"
              value={exportForm.date_to}
              onChange={(e) => setExportForm((f) => ({ ...f, date_to: e.target.value }))}
              required
            />
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={`p-4 rounded-lg border ${
                validationResult.can_export
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20'
              }`}
            >
              <h4 className="font-medium mb-2">
                {validationResult.can_export ? t('x3.validationPassed') : t('x3.validationWarnings')}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('x3.totalInvoices')}</p>
                  <p className="font-medium">{validationResult.invoice_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('x3.validInvoices')}</p>
                  <p className="font-medium text-green-600">{validationResult.valid_invoices}</p>
                </div>
                {validationResult.invalid_invoices > 0 && (
                  <div>
                    <p className="text-muted-foreground">{t('x3.invalidInvoices')}</p>
                    <p className="font-medium text-yellow-600">{validationResult.invalid_invoices}</p>
                  </div>
                )}
              </div>

              {/* Missing Mappings */}
              {validationResult.missing_customer_mappings.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-yellow-600 mb-2">
                    {t('x3.missingCustomerMappings')} ({validationResult.missing_customer_mappings.length})
                  </p>
                  <div className="max-h-24 overflow-y-auto text-xs text-muted-foreground">
                    {validationResult.missing_customer_mappings.slice(0, 5).map((c) => (
                      <p key={c.client_id}>
                        {c.client_name} (ID: {c.client_id})
                      </p>
                    ))}
                    {validationResult.missing_customer_mappings.length > 5 && (
                      <p className="italic">
                        ... {t('x3.andMore', { count: validationResult.missing_customer_mappings.length - 5 })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {validationResult.missing_product_mappings.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-yellow-600 mb-2">
                    {t('x3.missingProductMappings')} ({validationResult.missing_product_mappings.length})
                  </p>
                  <div className="max-h-24 overflow-y-auto text-xs text-muted-foreground">
                    {validationResult.missing_product_mappings.slice(0, 5).map((p) => (
                      <p key={p.product_id}>
                        {p.product_name} (ID: {p.product_id})
                      </p>
                    ))}
                    {validationResult.missing_product_mappings.length > 5 && (
                      <p className="italic">
                        ... {t('x3.andMore', { count: validationResult.missing_product_mappings.length - 5 })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Progress */}
          {exportInvoicesMutation.isPending && (
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
              <LoadingSpinner className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">{t('x3.exportInProgress')}</p>
                <p className="text-sm text-muted-foreground">{t('x3.exportInProgressDesc')}</p>
              </div>
            </div>
          )}
        </div>
      </FormModal>
    </PageContainer>
  )
}

// ==========================================================================
// Helper Functions
// ==========================================================================

function getDefaultDateFrom(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  date.setDate(1)
  return date.toISOString().split('T')[0]
}

function getDefaultDateTo(): string {
  const date = new Date()
  date.setDate(0) // Last day of previous month
  return date.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ==========================================================================
// Icon Components
// ==========================================================================

function InvoiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  )
}

function PaymentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
