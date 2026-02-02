import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/warehouse/')({
  component: WarehousePage,
})

interface StockItem {
  id: number
  productReference: string
  productName: string
  warehouseName: string
  warehouseId: number
  locationCode?: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  reorderLevel?: number
  lastMovementDate?: string
}

interface StockSearchParams {
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
  const [searchParams, setSearchParams] = useState<StockSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'productName',
    sortOrder: 'asc',
  })

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['warehouse-stock', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', searchParams.page.toString())
      params.append('pageSize', searchParams.pageSize.toString())
      if (searchParams.search) params.append('search', searchParams.search)
      if (searchParams.warehouseId) params.append('warehouseId', searchParams.warehouseId.toString())
      if (searchParams.lowStock) params.append('lowStock', 'true')
      if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy)
      if (searchParams.sortOrder) params.append('sortOrder', searchParams.sortOrder)
      
      const response = await apiClient.get(`/warehouse/stock?${params}`)
      return response.data
    },
  })

  const { data: summaryData } = useQuery({
    queryKey: ['warehouse-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/warehouse/summary')
      return response.data
    },
  })

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

  const columns = useMemo<Column<StockItem>[]>(
    () => [
      {
        id: 'productReference',
        header: t('warehouse.reference'),
        accessorKey: 'productReference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.productReference}</span>
        ),
      },
      {
        id: 'productName',
        header: t('warehouse.product'),
        accessorKey: 'productName',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.productName}</span>,
      },
      {
        id: 'warehouseName',
        header: t('warehouse.warehouse'),
        accessorKey: 'warehouseName',
        sortable: true,
      },
      {
        id: 'locationCode',
        header: t('warehouse.location'),
        accessorKey: 'locationCode',
        sortable: true,
        cell: (row) => row.locationCode || '-',
      },
      {
        id: 'quantity',
        header: t('warehouse.qty'),
        accessorKey: 'quantity',
        sortable: true,
        cell: (row) => (
          <span className="font-medium">{row.quantity}</span>
        ),
      },
      {
        id: 'reservedQuantity',
        header: t('warehouse.reserved'),
        accessorKey: 'reservedQuantity',
        sortable: true,
        cell: (row) => (
          <span className="text-amber-600">{row.reservedQuantity}</span>
        ),
      },
      {
        id: 'availableQuantity',
        header: t('warehouse.available'),
        accessorKey: 'availableQuantity',
        sortable: true,
        cell: (row) => {
          const isLow = row.reorderLevel && row.availableQuantity <= row.reorderLevel
          return (
            <span className={isLow ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
              {row.availableQuantity}
            </span>
          )
        },
      },
      {
        id: 'lastMovementDate',
        header: t('warehouse.lastMovement'),
        accessorKey: 'lastMovementDate',
        sortable: true,
        cell: (row) => row.lastMovementDate ? new Date(row.lastMovementDate).toLocaleDateString() : '-',
      },
    ],
    [t]
  )

  const filters = (
    <button
      onClick={toggleLowStock}
      className={`btn-secondary ${searchParams.lowStock ? 'bg-destructive/10 text-destructive border-destructive' : ''}`}
    >
      {searchParams.lowStock ? t('warehouse.showAll') : t('warehouse.lowStockOnly')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('warehouse.title')}
        description={t('warehouse.manageDescription')}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader title={t('warehouse.totalProducts')} />
          <CardContent>
            <p className="text-3xl font-bold">{summaryData?.totalProducts ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('warehouse.totalStockValue')} />
          <CardContent>
            <p className="text-3xl font-bold">
              {summaryData?.totalValue 
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summaryData.totalValue)
                : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('warehouse.lowStockItems')} />
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{summaryData?.lowStockCount ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('warehouse.outOfStock')} />
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{summaryData?.outOfStockCount ?? '-'}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={stockData?.data || stockData?.items || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={stockData?.totalCount || 0}
        totalPages={stockData?.totalPages || 1}
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
    </PageContainer>
  )
}
