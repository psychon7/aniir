import { useState, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { useStockMovements } from '@/hooks/useWarehouse'
import type { StockMovementListItem, StockMovementSearchParams, MovementType, MovementStatus } from '@/types/warehouse'

export const Route = createFileRoute('/_authenticated/warehouse/movements/')({
  component: WarehouseMovementsPage,
})

interface LocalSearchParams {
  page: number
  pageSize: number
  search?: string
  type?: MovementType
  status?: MovementStatus
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

function WarehouseMovementsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useState<LocalSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'stm_date',
    sortOrder: 'desc',
  })

  // Build API params from local search params
  const apiParams: StockMovementSearchParams = {
    skip: (searchParams.page - 1) * searchParams.pageSize,
    limit: searchParams.pageSize,
    search: searchParams.search,
    stm_type: searchParams.type,
    stm_status: searchParams.status,
    sort_by: searchParams.sortBy,
    sort_order: searchParams.sortOrder,
  }

  // Use the hooks
  const { data: movementsData, isLoading } = useStockMovements(apiParams)

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

  const handleRowClick = (movement: StockMovementListItem) => {
    navigate({ to: '/warehouse/movements/$movementId', params: { movementId: String(movement.stm_id) } })
  }

  const getTypeLabel = (type: MovementType): string => {
    const typeMap: Record<MovementType, string> = {
      RECEIPT: t('warehouse.receipt'),
      SHIPMENT: t('warehouse.shipment'),
      TRANSFER: t('warehouse.transfer'),
      ADJUSTMENT: t('warehouse.adjustment'),
      RETURN_IN: t('warehouse.return'),
      RETURN_OUT: t('warehouse.return'),
      DAMAGE: t('warehouse.damage'),
      DESTROY: t('warehouse.destroy'),
      LOAN_OUT: t('warehouse.loan'),
      LOAN_IN: t('warehouse.loan'),
    }
    return typeMap[type] || type
  }

  const getStatusLabel = (status: MovementStatus): string => {
    const statusMap: Record<MovementStatus, string> = {
      DRAFT: t('warehouse.draft'),
      PENDING: t('warehouse.pending'),
      IN_PROGRESS: t('warehouse.inProgress'),
      COMPLETED: t('warehouse.completed'),
      CANCELLED: t('warehouse.cancelled'),
      PARTIALLY: t('warehouse.partially'),
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: MovementStatus): string => {
    const colorMap: Record<MovementStatus, string> = {
      DRAFT: 'text-muted-foreground',
      PENDING: 'text-amber-600',
      IN_PROGRESS: 'text-blue-600',
      COMPLETED: 'text-green-600',
      CANCELLED: 'text-destructive',
      PARTIALLY: 'text-orange-600',
    }
    return colorMap[status] || 'text-muted-foreground'
  }

  const getTypeColor = (type: MovementType): string => {
    const colorMap: Record<MovementType, string> = {
      RECEIPT: 'text-green-600 bg-green-50',
      SHIPMENT: 'text-blue-600 bg-blue-50',
      TRANSFER: 'text-purple-600 bg-purple-50',
      ADJUSTMENT: 'text-amber-600 bg-amber-50',
      RETURN_IN: 'text-cyan-600 bg-cyan-50',
      RETURN_OUT: 'text-cyan-600 bg-cyan-50',
      DAMAGE: 'text-red-600 bg-red-50',
      DESTROY: 'text-red-600 bg-red-50',
      LOAN_OUT: 'text-indigo-600 bg-indigo-50',
      LOAN_IN: 'text-indigo-600 bg-indigo-50',
    }
    return colorMap[type] || 'text-muted-foreground bg-muted'
  }

  const columns = useMemo<Column<StockMovementListItem>[]>(
    () => [
      {
        id: 'stm_reference',
        header: t('warehouse.reference'),
        accessorKey: 'stm_reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm font-medium">{row.stm_reference}</span>
        ),
      },
      {
        id: 'stm_type',
        header: t('warehouse.movementType'),
        accessorKey: 'stm_type',
        sortable: true,
        cell: (row) => (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(row.stm_type)}`}>
            {getTypeLabel(row.stm_type)}
          </span>
        ),
      },
      {
        id: 'stm_status',
        header: t('warehouse.movementStatus'),
        accessorKey: 'stm_status',
        sortable: true,
        cell: (row) => (
          <span className={`font-medium ${getStatusColor(row.stm_status)}`}>
            {getStatusLabel(row.stm_status)}
          </span>
        ),
      },
      {
        id: 'stm_date',
        header: t('warehouse.movementDate'),
        accessorKey: 'stm_date',
        sortable: true,
        cell: (row) => (
          <span className="text-sm">
            {row.stm_date ? new Date(row.stm_date).toLocaleDateString() : '-'}
          </span>
        ),
      },
      {
        id: 'warehouse_name',
        header: t('warehouse.warehouse'),
        accessorKey: 'warehouse_name',
        sortable: true,
        cell: (row) => row.warehouse_name || '-',
      },
      {
        id: 'stm_total_quantity',
        header: t('warehouse.totalQty'),
        accessorKey: 'stm_total_quantity',
        sortable: true,
        cell: (row) => (
          <span className="font-medium">{row.stm_total_quantity}</span>
        ),
      },
      {
        id: 'stm_total_lines',
        header: t('warehouse.totalLines'),
        accessorKey: 'stm_total_lines',
        sortable: true,
        cell: (row) => row.stm_total_lines,
      },
    ],
    [t]
  )

  const filters = (
    <div className="flex gap-2">
      <Link to="/warehouse" className="btn-secondary">
        {t('warehouse.inventory')}
      </Link>
    </div>
  )

  // Calculate total pages from API response
  const totalPages = movementsData ? Math.ceil(movementsData.total / searchParams.pageSize) : 1

  return (
    <PageContainer>
      <PageHeader
        title={t('warehouse.stockMovement')}
        description={t('warehouse.manageDescription')}
        actions={
          <Link to="/warehouse/movements/new" className="btn-primary">
            {t('warehouse.newMovement')}
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={movementsData?.items || []}
        keyField="stm_id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={movementsData?.total || 0}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('warehouse.searchPlaceholder')}
        filters={filters}
        emptyMessage={t('warehouse.noMovementsFound')}
        emptyDescription={t('warehouse.createFirstMovement')}
        onRowClick={handleRowClick}
      />
    </PageContainer>
  )
}
