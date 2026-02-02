import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices'
import type { InvoiceListItem, InvoiceSearchParams } from '@/types/invoice'

export const Route = createFileRoute('/_authenticated/invoices/')({
  component: InvoicesPage,
})

function InvoicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [searchParams, setSearchParams] = useState<InvoiceSearchParams>({
    page: 1,
    pageSize: 10,
  })

  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceListItem | null>(null)

  // Data fetching with hooks
  const { data: invoicesData, isLoading } = useInvoices(searchParams)
  const deleteMutation = useDeleteInvoice()

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

  const handleRowClick = (invoice: InvoiceListItem) => {
    navigate({ to: '/invoices/$invoiceId' as any, params: { invoiceId: String(invoice.id) } })
  }

  const handleDelete = () => {
    if (!deletingInvoice) return
    deleteMutation.mutate(deletingInvoice.id, {
      onSuccess: () => {
        success(t('invoices.deleteSuccess'), t('invoices.deleteSuccessMessage'))
        setDeletingInvoice(null)
      },
      onError: () => {
        showError(t('common.error'), t('invoices.deleteError'))
      },
    })
  }

  const columns = useMemo<Column<InvoiceListItem>[]>(
    () => [
      {
        id: 'reference',
        header: t('invoices.reference'),
        accessorKey: 'reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference || row.cin_code || '-'}</span>
        ),
      },
      {
        id: 'clientName',
        header: t('invoices.client'),
        accessorKey: 'clientName',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.clientName || '-'}</span>,
      },
      {
        id: 'invoiceDate',
        header: t('invoices.invoiceDate'),
        accessorKey: 'invoiceDate',
        sortable: true,
        cell: (row) => {
          const date = row.invoiceDate || row.cin_date
          return date ? new Date(date).toLocaleDateString() : '-'
        },
      },
      {
        id: 'dueDate',
        header: t('invoices.dueDate'),
        accessorKey: 'dueDate',
        sortable: true,
        cell: (row) => {
          const dueDate = row.dueDate || row.cin_due_date
          if (!dueDate) return '-'
          const date = new Date(dueDate)
          const isPaid = row.statusName === 'Paid' || row.cin_is_paid
          const isOverdue = date < new Date() && !isPaid
          return (
            <span className={isOverdue ? 'text-destructive font-medium' : ''}>
              {date.toLocaleDateString()}
            </span>
          )
        },
      },
      {
        id: 'totalAmount',
        header: t('invoices.amount'),
        accessorKey: 'totalAmount',
        sortable: true,
        cell: (row) => {
          const amount = row.totalAmount || row.cin_total || 0
          const currency = row.currency || 'EUR'
          return (
            <span className="font-medium">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}
            </span>
          )
        },
      },
      {
        id: 'balance',
        header: t('invoices.balance'),
        accessorKey: 'paidAmount',
        sortable: false,
        cell: (row) => {
          const total = row.totalAmount || row.cin_total || 0
          const paid = row.paidAmount || 0
          const balance = total - paid
          const currency = row.currency || 'EUR'
          return (
            <span className={balance > 0 ? 'text-amber-600 font-medium' : 'text-green-600'}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(balance)}
            </span>
          )
        },
      },
      {
        id: 'statusName',
        header: t('invoices.status'),
        accessorKey: 'statusName',
        sortable: true,
        cell: (row) => <StatusBadge status={row.statusName || (row.cin_is_paid ? 'Paid' : 'Pending')} />,
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: '/invoices/$invoiceId' as any, params: { invoiceId: String(row.id) } })
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.view')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ),
        className: 'w-24',
      },
    ],
    [navigate, t]
  )

  const actions = (
    <button
      onClick={() => navigate({ to: '/invoices/new' as any })}
      className="btn-primary"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
      {t('invoices.newInvoice')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('invoices.title')}
        description={t('invoices.manageDescription')}
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
        searchPlaceholder={t('invoices.searchPlaceholder')}
        onRowClick={handleRowClick}
        emptyMessage={t('invoices.noInvoicesFound')}
        emptyDescription={t('invoices.createFirst')}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingInvoice}
        onClose={() => setDeletingInvoice(null)}
        onConfirm={handleDelete}
        itemName={deletingInvoice?.reference || deletingInvoice?.cin_code || 'this invoice'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
