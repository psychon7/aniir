import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { usePurchaseIntents, useDeletePurchaseIntent } from '@/hooks/usePurchaseIntents'
import type { PurchaseIntent, PurchaseIntentSearchParams } from '@/types/purchaseIntent'

export const Route = createFileRoute('/_authenticated/purchase-intents/')({
  component: PurchaseIntentsPage,
})

function PurchaseIntentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [searchParams, setSearchParams] = useState<PurchaseIntentSearchParams>({
    page: 1,
    pageSize: 10,
  })

  const [deletingIntent, setDeletingIntent] = useState<PurchaseIntent | null>(null)

  // Data fetching with hooks
  const { data: intentsData, isLoading } = usePurchaseIntents(searchParams)
  const deleteMutation = useDeletePurchaseIntent()

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

  const handleRowClick = (intent: PurchaseIntent) => {
    navigate({ to: '/purchase-intents/$intentId' as any, params: { intentId: String(intent.id) } })
  }

  const handleConfirmDelete = async () => {
    if (!deletingIntent) return
    try {
      await deleteMutation.mutateAsync(deletingIntent.id)
      success(t('purchaseIntents.deleteSuccess'), t('purchaseIntents.deleteSuccessMessage'))
      setDeletingIntent(null)
    } catch {
      showError(t('common.error'), t('purchaseIntents.deleteError'))
    }
  }

  const columns = useMemo<Column<PurchaseIntent>[]>(
    () => [
      {
        id: 'code',
        header: t('purchaseIntents.reference'),
        accessorKey: 'code',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.code || '-'}</span>
        ),
      },
      {
        id: 'name',
        header: t('purchaseIntents.name'),
        accessorKey: 'name',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.name || '-'}</span>,
      },
      {
        id: 'createdAt',
        header: t('purchaseIntents.createdDate'),
        accessorKey: 'createdAt',
        sortable: true,
        cell: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-',
      },
      {
        id: 'updatedAt',
        header: t('purchaseIntents.lastUpdated'),
        accessorKey: 'updatedAt',
        sortable: true,
        cell: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-',
      },
      {
        id: 'isClosed',
        header: t('purchaseIntents.status'),
        accessorKey: 'isClosed',
        sortable: true,
        cell: (row) => (
          <StatusBadge status={row.isClosed ? t('purchaseIntents.closed') : t('purchaseIntents.open')} />
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
                navigate({ to: '/purchase-intents/$intentId' as any, params: { intentId: String(row.id) } })
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
                setDeletingIntent(row)
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
      onClick={() => navigate({ to: '/purchase-intents/new' as any })}
      className="btn-primary"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
      {t('purchaseIntents.newPurchaseIntent')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('purchaseIntents.title')}
        description={t('purchaseIntents.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={intentsData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page || 1}
        pageSize={searchParams.pageSize || 10}
        totalCount={intentsData?.totalCount || 0}
        totalPages={intentsData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('purchaseIntents.searchPlaceholder')}
        onRowClick={handleRowClick}
        emptyMessage={t('purchaseIntents.noIntentsFound')}
        emptyDescription={t('purchaseIntents.createFirst')}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingIntent}
        onClose={() => setDeletingIntent(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingIntent?.code || deletingIntent?.name || 'this purchase intent'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
