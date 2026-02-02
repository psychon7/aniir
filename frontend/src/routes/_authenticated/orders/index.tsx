import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { useOrders, useDeleteOrder } from '@/hooks/useOrders'
import type { Order, OrderSearchParams } from '@/types/order'

export const Route = createFileRoute('/_authenticated/orders/')({
  component: OrdersPage,
})

function OrdersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [searchParams, setSearchParams] = useState<OrderSearchParams>({
    page: 1,
    pageSize: 10,
  })

  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)

  // Data fetching with hooks
  const { data: ordersData, isLoading } = useOrders(searchParams)
  const deleteMutation = useDeleteOrder()

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

  const handleRowClick = (order: Order) => {
    navigate({ to: '/orders/$orderId' as any, params: { orderId: String(order.id) } })
  }

  const handleConfirmDelete = async () => {
    if (!deletingOrder) return
    try {
      await deleteMutation.mutateAsync(deletingOrder.id)
      success(t('orders.deleteSuccess'), t('orders.deleteSuccessMessage'))
      setDeletingOrder(null)
    } catch {
      showError(t('common.error'), t('orders.deleteError'))
    }
  }

  const columns = useMemo<Column<Order>[]>(
    () => [
      {
        id: 'reference',
        header: t('orders.reference'),
        accessorKey: 'reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference}</span>
        ),
      },
      {
        id: 'clientName',
        header: t('orders.client'),
        accessorKey: 'clientName',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.clientName}</span>,
      },
      {
        id: 'orderDate',
        header: t('orders.orderDate'),
        accessorKey: 'orderDate',
        sortable: true,
        cell: (row) => new Date(row.orderDate).toLocaleDateString(),
      },
      {
        id: 'expectedDeliveryDate',
        header: t('orders.expectedDelivery'),
        accessorKey: 'expectedDeliveryDate',
        sortable: true,
        cell: (row) => row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString() : '-',
      },
      {
        id: 'totalTTC',
        header: t('orders.amount'),
        accessorKey: 'totalTTC',
        sortable: true,
        cell: (row) => (
          <span className="font-medium">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currencyCode || 'EUR' }).format(row.totalTTC || 0)}
          </span>
        ),
      },
      {
        id: 'statusName',
        header: t('orders.status'),
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
                navigate({ to: '/orders/$orderId' as any, params: { orderId: String(row.id) } })
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
                setDeletingOrder(row)
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
      onClick={() => navigate({ to: '/orders/new' as any })}
      className="btn-primary"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
      {t('orders.newOrder')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('orders.title')}
        description={t('orders.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={ordersData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page || 1}
        pageSize={searchParams.pageSize || 10}
        totalCount={ordersData?.totalCount || 0}
        totalPages={ordersData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('orders.searchPlaceholder')}
        onRowClick={handleRowClick}
        emptyMessage={t('orders.noOrdersFound')}
        emptyDescription={t('orders.createFirst')}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingOrder}
        onClose={() => setDeletingOrder(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingOrder?.reference || 'this order'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
