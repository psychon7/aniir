import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { PaymentForm } from '@/components/features/payments/PaymentForm'
import { PaymentAllocationModal } from '@/components/features/payments/PaymentAllocationModal'
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
  useExportPayments,
} from '@/hooks/usePayments'
import { usePaymentStatuses, usePaymentModes, useBusinessUnits } from '@/hooks/useLookups'
import type { Payment, PaymentCreateDto, PaymentSearchParams } from '@/types/payment'

export const Route = createFileRoute('/_authenticated/accounting/payments/')({
  component: PaymentsPage,
})

function PaymentsPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<PaymentSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'paymentDate',
    sortOrder: 'desc',
  })

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null)
  const [allocatingPayment, setAllocatingPayment] = useState<Payment | null>(null)

  // Data fetching
  const { data: paymentsData, isLoading } = usePayments(searchParams)
  const { data: statuses = [] } = usePaymentStatuses()
  const { data: paymentModes = [] } = usePaymentModes()
  const { data: businessUnits = [] } = useBusinessUnits()

  // Mutations
  const createMutation = useCreatePayment()
  const updateMutation = useUpdatePayment()
  const deleteMutation = useDeletePayment()
  const exportMutation = useExportPayments()

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
      statusId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  const handlePaymentModeFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      paymentModeId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  const handleBusinessUnitFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      businessUnitId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  // Handle create/edit
  const handleOpenCreate = () => {
    setEditingPayment(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: PaymentCreateDto) => {
    try {
      if (editingPayment) {
        await updateMutation.mutateAsync({ ...data, id: editingPayment.id })
        success(t('payments.paymentUpdated'), t('payments.paymentUpdatedDescription'))
      } else {
        await createMutation.mutateAsync(data)
        success(t('payments.paymentCreated'), t('payments.paymentCreatedDescription'))
      }
      setIsFormOpen(false)
      setEditingPayment(null)
    } catch (err) {
      showError(t('common.error'), t('payments.saveError'))
    }
  }

  // Handle delete
  const handleConfirmDelete = async () => {
    if (!deletingPayment) return

    try {
      await deleteMutation.mutateAsync(deletingPayment.id)
      success(t('payments.paymentDeleted'), t('payments.paymentDeletedDescription'))
      setDeletingPayment(null)
    } catch (err) {
      showError(t('common.error'), t('payments.deleteError'))
    }
  }

  // Handle export
  const handleExport = () => {
    exportMutation.mutate(searchParams, {
      onSuccess: () => success(t('common.exportComplete'), t('payments.exportSuccess')),
      onError: () => showError(t('common.exportFailed'), t('payments.exportError')),
    })
  }

  // Format currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
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

  // Table columns
  const columns = useMemo<Column<Payment>[]>(
    () => [
      {
        id: 'reference',
        header: t('payments.reference'),
        accessorKey: 'reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference}</span>
        ),
      },
      {
        id: 'clientName',
        header: t('payments.client'),
        accessorKey: 'clientName',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.clientName}</p>
            {row.invoiceReference && (
              <p className="text-sm text-muted-foreground">{row.invoiceReference}</p>
            )}
          </div>
        ),
      },
      {
        id: 'amount',
        header: t('payments.amount'),
        accessorKey: 'amount',
        sortable: true,
        cell: (row) => (
          <span className="font-medium text-foreground">
            {formatAmount(row.amount, row.currencyCode)}
          </span>
        ),
        className: 'text-right',
      },
      {
        id: 'paymentDate',
        header: t('payments.date'),
        accessorKey: 'paymentDate',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.paymentDate)}</span>
        ),
      },
      {
        id: 'paymentModeName',
        header: t('payments.mode'),
        accessorKey: 'paymentModeName',
        sortable: true,
        cell: (row) => (
          <span className="text-sm">{row.paymentModeName}</span>
        ),
      },
      {
        id: 'businessUnitName',
        header: t('payments.businessUnit'),
        accessorKey: 'businessUnitName',
        sortable: true,
        cell: (row) => row.businessUnitName || '-',
      },
      {
        id: 'statusName',
        header: t('payments.status'),
        accessorKey: 'statusName',
        sortable: true,
        cell: (row) => <StatusBadge status={row.statusName} />,
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setAllocatingPayment(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title={t('payments.allocateToInvoices')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOpenEdit(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.edit')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingPayment(row)
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
        className: 'w-32',
      },
    ],
    [t]
  )

  // Filter components
  const filters = (
    <>
      <FormSelect
        value={searchParams.statusId?.toString() || ''}
        onChange={(e) => handleStatusFilter(e.target.value)}
        options={[
          { value: '', label: t('payments.allStatuses') },
          ...statuses.map((s) => ({ value: s.key, label: s.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.paymentModeId?.toString() || ''}
        onChange={(e) => handlePaymentModeFilter(e.target.value)}
        options={[
          { value: '', label: t('payments.allModes') },
          ...paymentModes.map((m) => ({ value: m.key, label: m.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.businessUnitId?.toString() || ''}
        onChange={(e) => handleBusinessUnitFilter(e.target.value)}
        options={[
          { value: '', label: t('payments.allUnits') },
          ...businessUnits.map((u) => ({ value: u.key, label: u.value })),
        ]}
        className="w-40"
      />
    </>
  )

  // Action buttons
  const actions = (
    <>
      <button onClick={handleExport} className="btn-secondary" disabled={exportMutation.isPending}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t('common.export')}
      </button>
      <button onClick={handleOpenCreate} className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        {t('payments.newPayment')}
      </button>
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('payments.title')}
        description={t('payments.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={paymentsData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={paymentsData?.totalCount || 0}
        totalPages={paymentsData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('payments.searchPayments')}
        filters={filters}
        onRowClick={handleOpenEdit}
        emptyMessage={t('payments.noPaymentsFound')}
        emptyDescription={t('payments.createFirst')}
      />

      {/* Create/Edit Form Modal */}
      <PaymentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingPayment(null)
        }}
        onSubmit={handleFormSubmit}
        payment={editingPayment}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingPayment?.reference || 'this payment'}
        isLoading={deleteMutation.isPending}
      />

      {/* Payment Allocation Modal */}
      <PaymentAllocationModal
        isOpen={!!allocatingPayment}
        onClose={() => setAllocatingPayment(null)}
        payment={allocatingPayment}
      />
    </PageContainer>
  )
}
