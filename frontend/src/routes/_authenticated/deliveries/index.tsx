import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/feedback/Toast'
import { useDeliveries } from '@/hooks/useDeliveries'
import { useCreateInvoicesFromDeliveries } from '@/hooks/useInvoices'
import type { DeliveryForm, DeliverySearchParams } from '@/types/delivery'

export const Route = createFileRoute('/_authenticated/deliveries/')({
  component: DeliveriesPage,
})

function DeliveriesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const createInvoicesBulk = useCreateInvoicesFromDeliveries()

  const [searchParams, setSearchParams] = useState<DeliverySearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  // Data fetching with hooks
  const { data: deliveriesData, isLoading } = useDeliveries(searchParams)

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

  const handleRowClick = (delivery: DeliveryForm) => {
    navigate({ to: '/deliveries/$deliveryId' as any, params: { deliveryId: String(delivery.id) } } as any)
  }

  const columns = useMemo<Column<DeliveryForm>[]>(
    () => [
      {
        id: 'reference',
        header: t('deliveries.reference'),
        accessorKey: 'reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference}</span>
        ),
      },
      {
        id: 'orderReference',
        header: t('deliveries.order'),
        accessorKey: 'orderReference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm">{row.orderReference || '-'}</span>
        ),
      },
      {
        id: 'clientName',
        header: t('deliveries.client'),
        accessorKey: 'clientName',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.clientName || '-'}</span>,
      },
      {
        id: 'expectedDeliveryDate',
        header: t('deliveries.scheduled'),
        accessorKey: 'expectedDeliveryDate',
        sortable: true,
        cell: (row) => row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString() : '-',
      },
      {
        id: 'deliveryDate',
        header: t('deliveries.delivered'),
        accessorKey: 'deliveryDate',
        sortable: true,
        cell: (row) => row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString() : '-',
      },
      {
        id: 'deliveryAddress',
        header: t('deliveries.address'),
        accessorKey: 'deliveryAddress',
        sortable: false,
        cell: (row) => (
          <span className="text-sm text-muted-foreground truncate max-w-xs block">
            {row.deliveryAddress || '-'}
          </span>
        ),
      },
      {
        id: 'statusName',
        header: t('common.status'),
        accessorKey: 'statusName',
        sortable: true,
        cell: (row) => <StatusBadge status={row.statusName || (row.isDelivered ? 'Delivered' : row.isShipped ? 'Shipped' : 'Pending')} />,
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: '/deliveries/$deliveryId' as any, params: { deliveryId: String(row.id) } } as any)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.view')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        ),
        className: 'w-16',
      },
    ],
    [navigate, t]
  )

  const actions = (
    <>
      <button
        className="btn-secondary"
        disabled={createInvoicesBulk.isPending}
        onClick={async () => {
          const confirmed = window.confirm('Create invoices in bulk from non-invoiced deliveries?')
          if (!confirmed) return
          try {
            const result = await createInvoicesBulk.mutateAsync({ deliveryIds: undefined })
            success(
              'Bulk invoice creation complete',
              `Created/returned ${result.created.length} invoice(s).`
            )
          } catch {
            showError('Bulk invoice creation failed', 'Unable to create invoices from deliveries.')
          }
        }}
      >
        {createInvoicesBulk.isPending ? 'Creating...' : 'Bulk Create Invoices'}
      </button>

      <button
        onClick={() => navigate({ to: '/deliveries/new' as any })}
        className="btn-primary"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        {t('deliveries.newDelivery')}
      </button>
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('deliveries.title')}
        description={t('deliveries.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={deliveriesData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page || 1}
        pageSize={searchParams.pageSize || 10}
        totalCount={deliveriesData?.totalCount || 0}
        totalPages={deliveriesData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('deliveries.searchPlaceholder')}
        onRowClick={handleRowClick}
        emptyMessage={t('deliveries.noDeliveriesFound')}
        emptyDescription={t('deliveries.createFirst')}
      />
    </PageContainer>
  )
}
