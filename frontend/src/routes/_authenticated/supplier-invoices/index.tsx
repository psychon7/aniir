import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { useSupplierInvoices, useDeleteSupplierInvoice } from '@/hooks/useSupplierInvoices'
import type { SupplierInvoiceListItem, SupplierInvoiceSearchParams } from '@/types/supplierInvoice'

export const Route = createFileRoute('/_authenticated/supplier-invoices/')({
  component: SupplierInvoicesPage,
})

function SupplierInvoicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [searchParams, setSearchParams] = useState<SupplierInvoiceSearchParams>({
    page: 1,
    pageSize: 10,
  })

  const [deletingInvoice, setDeletingInvoice] = useState<SupplierInvoiceListItem | null>(null)
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  // Data fetching with hooks
  const { data: invoicesData, isLoading } = useSupplierInvoices({
    ...searchParams,
    isPaid: paymentFilter === 'all' ? undefined : paymentFilter === 'paid',
  })
  const deleteMutation = useDeleteSupplierInvoice()

  const handleSearch = (search: string) => {
    setSearchParams((prev) => ({ ...prev, search, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, pageSize, page: 1 }))
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSearchParams((prev) => ({ ...prev, sortBy, sortOrder }))
  }

  const handleRowClick = (invoice: SupplierInvoiceListItem) => {
    navigate({ to: '/supplier-invoices/$invoiceId' as any, params: { invoiceId: String(invoice.id) } })
  }

  const handleDelete = () => {
    if (!deletingInvoice) return
    deleteMutation.mutate(deletingInvoice.id, {
      onSuccess: () => {
        success(
          t('supplierInvoices.messages.deleteSuccess'),
          t('supplierInvoices.messages.deleteSuccess')
        )
        setDeletingInvoice(null)
      },
      onError: () => {
        showError(t('common.error'), t('common.errorOccurred'))
      },
    })
  }

  const getPaymentStatusBadge = (invoice: SupplierInvoiceListItem) => {
    if (invoice.isPaid) {
      return <StatusBadge status="Paid" />
    }
    return <StatusBadge status="Unpaid" />
  }

  const getProductionStatusBadge = (invoice: SupplierInvoiceListItem) => {
    if (invoice.productionComplete) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          {t('common.completed', 'Completed')}
        </span>
      )
    }
    if (invoice.productionStarted) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {t('common.inProgress', 'In Progress')}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
        {t('common.pending', 'Pending')}
      </span>
    )
  }

  const columns = useMemo<Column<SupplierInvoiceListItem>[]>(
    () => [
      {
        id: 'code',
        header: t('supplierInvoices.columns.reference'),
        accessorKey: 'code',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">
            {row.code || row.displayName || `#${row.id}`}
          </span>
        ),
      },
      {
        id: 'supplierName',
        header: t('supplierInvoices.columns.supplier'),
        accessorKey: 'supplierName',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.supplierName || '-'}</span>,
      },
      {
        id: 'createdAt',
        header: t('supplierInvoices.columns.invoiceDate'),
        accessorKey: 'createdAt',
        sortable: true,
        cell: (row) => {
          return row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
        },
      },
      {
        id: 'currencyCode',
        header: t('common.currency', 'Currency'),
        accessorKey: 'currencyCode',
        sortable: false,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.currencyCode || row.currencySymbol || 'EUR'}
          </span>
        ),
      },
      {
        id: 'paymentStatus',
        header: t('supplierInvoices.columns.paymentStatus'),
        accessorKey: 'isPaid',
        sortable: true,
        cell: (row) => getPaymentStatusBadge(row),
      },
      {
        id: 'productionStatus',
        header: t('common.production', 'Production'),
        accessorKey: 'productionStarted',
        sortable: false,
        cell: (row) => getProductionStatusBadge(row),
      },
      {
        id: 'bankReceiptNumber',
        header: t('common.receipt', 'Receipt #'),
        accessorKey: 'bankReceiptNumber',
        sortable: false,
        cell: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.bankReceiptNumber || '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: '/supplier-invoices/$invoiceId' as any, params: { invoiceId: String(row.id) } })
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.view')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingInvoice(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('common.delete')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ),
        className: 'w-24',
      },
    ],
    [navigate, t]
  )

  const filterControls = (
    <div className="flex items-center gap-4">
      <select
        value={paymentFilter}
        onChange={(e) => {
          setPaymentFilter(e.target.value)
          setSearchParams((prev) => ({ ...prev, page: 1 }))
        }}
        className="input text-sm h-9"
      >
        <option value="all">{t('common.all')}</option>
        <option value="paid">{t('supplierInvoices.paymentStatus.paid')}</option>
        <option value="unpaid">{t('supplierInvoices.paymentStatus.unpaid')}</option>
      </select>
    </div>
  )

  const actions = (
    <div className="flex items-center gap-2">
      {filterControls}
      <button
        onClick={() => navigate({ to: '/supplier-invoices/new' as any })}
        className="btn-primary"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        {t('supplierInvoices.newInvoice')}
      </button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('supplierInvoices.title')}
        description={t('supplierInvoices.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={invoicesData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page || 1}
        pageSize={searchParams.pageSize || 10}
        totalCount={invoicesData?.totalCount || 0}
        totalPages={invoicesData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('supplierInvoices.searchPlaceholder')}
        onRowClick={handleRowClick}
        emptyMessage={t('supplierInvoices.noInvoicesFound')}
        emptyDescription={t('supplierInvoices.createFirst')}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingInvoice}
        onClose={() => setDeletingInvoice(null)}
        onConfirm={handleDelete}
        itemName={deletingInvoice?.code || deletingInvoice?.displayName || 'this invoice'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
