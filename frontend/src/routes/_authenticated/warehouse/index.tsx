import { useState, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useStock, useStockSummary } from '@/hooks/useWarehouse'
import { Warehouse3DView } from '@/components/features/warehouse/Warehouse3DView'
import type { StockListItem, StockSearchParams as StockParams } from '@/types/warehouse'

export const Route = createFileRoute('/_authenticated/warehouse/')({
  validateSearch: (search: Record<string, unknown>) => ({
    view: typeof search.view === 'string' ? search.view : undefined,
  }),
  component: WarehousePage,
})

interface LocalSearchParams {
  page: number
  pageSize: number
  search?: string
  warehouseId?: number
  lowStock?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

function WarehousePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const is3DView = search.view === '3d'
  const [searchParams, setSearchParams] = useState<LocalSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'stk_id',
    sortOrder: 'asc',
  })

  // Build API params from local search params
  const apiParams: StockParams = {
    skip: (searchParams.page - 1) * searchParams.pageSize,
    limit: searchParams.pageSize,
    search: searchParams.search,
    whs_id: searchParams.warehouseId,
    low_stock_only: searchParams.lowStock,
    sort_by: searchParams.sortBy,
    sort_order: searchParams.sortOrder,
  }

  // Use the new hooks
  const { data: stockData, isLoading } = useStock(apiParams)
  const { data: summaryData } = useStockSummary()

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

  const toggleLowStock = () => {
    setSearchParams((prev) => ({ ...prev, lowStock: !prev.lowStock, page: 1 }))
  }

  const columns = useMemo<Column<StockListItem>[]>(
    () => [
      {
        id: 'product_ref',
        header: t('warehouse.reference'),
        accessorKey: 'product_ref',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.product_ref || '-'}</span>
        ),
      },
      {
        id: 'product_name',
        header: t('warehouse.product'),
        accessorKey: 'product_name',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.product_name || '-'}</span>,
      },
      {
        id: 'warehouse_name',
        header: t('warehouse.warehouse'),
        accessorKey: 'warehouse_name',
        sortable: true,
        cell: (row) => row.warehouse_name || '-',
      },
      {
        id: 'stk_quantity',
        header: t('warehouse.qty'),
        accessorKey: 'stk_quantity',
        sortable: true,
        cell: (row) => (
          <span className="font-medium">{row.stk_quantity}</span>
        ),
      },
      {
        id: 'stk_quantity_reserved',
        header: t('warehouse.reserved'),
        accessorKey: 'stk_quantity_reserved',
        sortable: true,
        cell: (row) => (
          <span className="text-amber-600">{row.stk_quantity_reserved}</span>
        ),
      },
      {
        id: 'stk_quantity_available',
        header: t('warehouse.available'),
        accessorKey: 'stk_quantity_available',
        sortable: true,
        cell: (row) => {
          const isLow = row.stk_quantity_available <= 0
          return (
            <span className={isLow ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
              {row.stk_quantity_available}
            </span>
          )
        },
      },
      {
        id: 'stk_is_active',
        header: t('common.status'),
        accessorKey: 'stk_is_active',
        sortable: true,
        cell: (row) => (
          <span className={row.stk_is_active ? 'text-green-600' : 'text-muted-foreground'}>
            {row.stk_is_active ? t('common.active') : t('common.inactive')}
          </span>
        ),
      },
    ],
    [t]
  )

  const filters = (
    <div className="flex gap-2">
      <button
        onClick={toggleLowStock}
        className={`btn-secondary ${searchParams.lowStock ? 'bg-destructive/10 text-destructive border-destructive' : ''}`}
      >
        {searchParams.lowStock ? t('warehouse.showAll') : t('warehouse.lowStockOnly')}
      </button>
      <Link to="/warehouse/movements" className="btn-secondary">
        {t('warehouse.viewMovements')}
      </Link>
      <button
        onClick={() => navigate({ to: '/warehouse', search: { view: '3d' } } as any)}
        className="btn-secondary"
      >
        3D View
      </button>
    </div>
  )

  // Calculate total pages from API response
  const totalPages = stockData ? Math.ceil(stockData.total / searchParams.pageSize) : 1

  const headerActions = (
    <div className="flex gap-2">
      {is3DView ? (
        <button
          onClick={() => navigate({ to: '/warehouse', search: {} } as any)}
          className="btn-secondary"
        >
          Table View
        </button>
      ) : (
        <button
          onClick={() => navigate({ to: '/warehouse', search: { view: '3d' } } as any)}
          className="btn-secondary"
        >
          3D View
        </button>
      )}
      <Link to="/warehouse/movements/new" className="btn-primary">
        {t('warehouse.newMovement')}
      </Link>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={is3DView ? `${t('warehouse.title')} - 3D` : t('warehouse.title')}
        description={t('warehouse.manageDescription')}
        actions={headerActions}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader title={t('warehouse.totalProducts')} />
          <CardContent>
            <p className="text-3xl font-bold">{summaryData?.total_items ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('warehouse.totalStockValue')} />
          <CardContent>
            <p className="text-3xl font-bold">
              {summaryData?.total_value
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summaryData.total_value)
                : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('warehouse.lowStockItems')} />
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{summaryData?.low_stock_count ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('warehouse.outOfStock')} />
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{summaryData?.out_of_stock_count ?? '-'}</p>
          </CardContent>
        </Card>
      </div>

      {is3DView ? (
        <Warehouse3DView items={stockData?.items || []} />
      ) : (
        <DataTable
          columns={columns}
          data={stockData?.items || []}
          keyField="stk_id"
          isLoading={isLoading}
          page={searchParams.page}
          pageSize={searchParams.pageSize}
          totalCount={stockData?.total || 0}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          sortBy={searchParams.sortBy}
          sortOrder={searchParams.sortOrder}
          onSortChange={handleSortChange}
          searchValue={searchParams.search}
          onSearchChange={handleSearch}
          searchPlaceholder={t('warehouse.searchProducts')}
          filters={filters}
          emptyMessage={t('warehouse.noStockItemsFound')}
          emptyDescription={t('warehouse.createFirst')}
        />
      )}
    </PageContainer>
  )
}
