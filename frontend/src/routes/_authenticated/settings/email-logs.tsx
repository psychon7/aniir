import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormInput } from '@/components/ui/form/FormInput'
import { useEmailLogs, useEmailLogStats, useResendEmail, useExportEmailLogs } from '@/hooks/useEmailLogs'
import { EmailLogDetailModal } from '@/components/features/settings/EmailLogDetailModal'
import type { EmailLog, EmailLogSearchParams, EmailStatus, EmailRelatedEntityType } from '@/types/emailLog'
import { format } from 'date-fns'

export const Route = createFileRoute('/_authenticated/settings/email-logs')({
  component: EmailLogsPage,
})

function EmailLogsPage() {
  const { success, error: showError } = useToast()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<EmailLogSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  // Modal state
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)

  // Data fetching
  const { data: emailLogsData, isLoading } = useEmailLogs(searchParams)
  const { data: stats } = useEmailLogStats()

  // Mutations
  const resendMutation = useResendEmail()
  const exportMutation = useExportEmailLogs()

  // Handle search
  const handleSearch = (search: string) => {
    setSearchParams((prev) => ({ ...prev, search, page: 1 }))
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }))
  }

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, pageSize, page: 1 }))
  }

  // Handle sort change
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSearchParams((prev) => ({ ...prev, sortBy, sortOrder }))
  }

  // Handle filter changes
  const handleStatusFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      status: value ? (value as EmailStatus) : undefined,
      page: 1,
    }))
  }

  const handleEntityTypeFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      relatedEntityType: value ? (value as EmailRelatedEntityType) : undefined,
      page: 1,
    }))
  }

  const handleDateFromFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams((prev) => ({
      ...prev,
      fromDate: e.target.value || undefined,
      page: 1,
    }))
  }

  const handleDateToFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams((prev) => ({
      ...prev,
      toDate: e.target.value || undefined,
      page: 1,
    }))
  }

  // Handle row click
  const handleRowClick = (log: EmailLog) => {
    setSelectedLogId(log.id)
  }

  // Handle resend
  const handleResend = async (emailLogId: number) => {
    try {
      await resendMutation.mutateAsync({ emailLogId })
      success('Email queued', 'The email has been queued for resending.')
    } catch (err) {
      showError('Error', 'Failed to resend the email.')
    }
  }

  // Handle export
  const handleExport = () => {
    exportMutation.mutate(searchParams, {
      onSuccess: () => success('Export complete', 'The email logs have been exported to CSV.'),
      onError: () => showError('Export failed', 'An error occurred while exporting email logs.'),
    })
  }

  // Table columns
  const columns = useMemo<Column<EmailLog>[]>(
    () => [
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => <StatusBadge status={row.status} />,
        className: 'w-28',
      },
      {
        id: 'subject',
        header: 'Subject',
        accessorKey: 'subject',
        sortable: true,
        cell: (row) => (
          <div className="max-w-md">
            <p className="font-medium text-foreground truncate">{row.subject}</p>
            <p className="text-xs text-muted-foreground truncate">
              To: {row.toAddresses.join(', ')}
            </p>
          </div>
        ),
      },
      {
        id: 'relatedEntityType',
        header: 'Type',
        accessorKey: 'relatedEntityType',
        sortable: true,
        cell: (row) =>
          row.relatedEntityType ? (
            <div className="text-sm">
              <span className="capitalize">{row.relatedEntityType}</span>
              {row.relatedEntityReference && (
                <p className="text-xs text-muted-foreground font-mono">
                  {row.relatedEntityReference}
                </p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: 'hasAttachments',
        header: '',
        cell: (row) =>
          row.hasAttachments ? (
            <span title="Has attachments">
              <AttachmentIcon className="w-4 h-4 text-muted-foreground" />
            </span>
          ) : null,
        className: 'w-10',
      },
      {
        id: 'createdAt',
        header: 'Created',
        accessorKey: 'createdAt',
        sortable: true,
        cell: (row) => (
          <div className="text-sm">
            <p>{format(new Date(row.createdAt), 'MMM d, yyyy')}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(row.createdAt), 'HH:mm')}
            </p>
          </div>
        ),
      },
      {
        id: 'sentAt',
        header: 'Sent',
        accessorKey: 'sentAt',
        sortable: true,
        cell: (row) =>
          row.sentAt ? (
            <div className="text-sm">
              <p>{format(new Date(row.sentAt), 'MMM d, yyyy')}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(row.sentAt), 'HH:mm')}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            {(row.status === 'failed' || row.status === 'bounced') && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleResend(row.id)
                }}
                disabled={resendMutation.isPending}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Resend email"
              >
                <ResendIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedLogId(row.id)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="View details"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          </div>
        ),
        className: 'w-24',
      },
    ],
    [resendMutation.isPending]
  )

  // Status options
  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'sent', label: 'Sent' },
    { value: 'queued', label: 'Queued' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'bounced', label: 'Bounced' },
  ]

  // Entity type options
  const entityTypeOptions = [
    { value: '', label: 'All types' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'quote', label: 'Quote' },
    { value: 'order', label: 'Order' },
    { value: 'payment', label: 'Payment' },
    { value: 'shipment', label: 'Shipment' },
    { value: 'client', label: 'Client' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'system', label: 'System' },
  ]

  // Filter components
  const filters = (
    <>
      <FormSelect
        value={searchParams.status || ''}
        onChange={(e) => handleStatusFilter(e.target.value)}
        options={statusOptions}
        className="w-36"
      />
      <FormSelect
        value={searchParams.relatedEntityType || ''}
        onChange={(e) => handleEntityTypeFilter(e.target.value)}
        options={entityTypeOptions}
        className="w-32"
      />
      <FormInput
        type="date"
        value={searchParams.fromDate || ''}
        onChange={handleDateFromFilter}
        className="w-36"
        placeholder="From date"
      />
      <FormInput
        type="date"
        value={searchParams.toDate || ''}
        onChange={handleDateToFilter}
        className="w-36"
        placeholder="To date"
      />
    </>
  )

  // Action buttons
  const actions = (
    <button onClick={handleExport} className="btn-secondary" disabled={exportMutation.isPending}>
      <DownloadIcon className="w-4 h-4" />
      Export
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title="Email Logs"
        description="View and manage sent email history"
        actions={actions}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Delivered" value={stats.delivered} variant="success" />
          <StatCard label="Sent" value={stats.sent} variant="info" />
          <StatCard label="Queued" value={stats.queued} variant="info" />
          <StatCard label="Failed" value={stats.failed} variant="error" />
          <StatCard label="Bounced" value={stats.bounced} variant="error" />
        </div>
      )}

      <DataTable
        columns={columns}
        data={emailLogsData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={emailLogsData?.totalCount || 0}
        totalPages={emailLogsData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by subject, email, reference..."
        filters={filters}
        onRowClick={handleRowClick}
        emptyMessage="No email logs found"
        emptyDescription="Email logs will appear here once emails are sent"
      />

      {/* Detail Modal */}
      <EmailLogDetailModal
        emailLogId={selectedLogId}
        isOpen={!!selectedLogId}
        onClose={() => setSelectedLogId(null)}
        onResend={handleResend}
      />
    </PageContainer>
  )
}

// Stat card component
interface StatCardProps {
  label: string
  value: number
  variant?: 'default' | 'success' | 'info' | 'error'
}

function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  const variantClasses: Record<string, string> = {
    default: 'text-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    info: 'text-blue-600 dark:text-blue-400',
    error: 'text-rose-600 dark:text-rose-400',
  }

  return (
    <div className="card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${variantClasses[variant]}`}>{value}</p>
    </div>
  )
}

// Icon components
function AttachmentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
      />
    </svg>
  )
}

function ResendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  )
}
