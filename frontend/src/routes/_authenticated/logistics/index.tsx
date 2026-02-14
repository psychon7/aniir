import { useState, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useShipments, useShipmentStatistics } from '@/hooks/useLogistics'
import type { ShipmentListItem, ShipmentSearchParams } from '@/types/logistics'

export const Route = createFileRoute('/_authenticated/logistics/')({
  component: LogisticsPage,
})

interface LocalSearchParams {
  page: number
  pageSize: number
  search?: string
  carrier_id?: number
  status_id?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

function LogisticsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useState<LocalSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'shp_created_at',
    sortOrder: 'desc',
  })

  // Build API params from local search params
  const apiParams: ShipmentSearchParams = {
    page: searchParams.page,
    page_size: searchParams.pageSize,
    reference: searchParams.search,
    carrier_id: searchParams.carrier_id,
    status_id: searchParams.status_id,
    sort_by: searchParams.sortBy,
    sort_order: searchParams.sortOrder,
  }

  // Use the new hooks
  const { data: shipmentsData, isLoading, isError, error } = useShipments(apiParams)
  const { data: statsData } = useShipmentStatistics()

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

  const handleRowClick = (shipment: ShipmentListItem) => {
    navigate({ to: '/logistics/$shipmentId', params: { shipmentId: String(shipment.shp_id) } })
  }

  const getStatusColor = (statusName: string | null): string => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_transit': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'exception': 'bg-amber-100 text-amber-800',
      'returned': 'bg-purple-100 text-purple-800',
      'cancelled': 'bg-red-100 text-red-800',
    }
    return colorMap[statusName?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800'
  }

  const columns = useMemo<Column<ShipmentListItem>[]>(
    () => [
      {
        id: 'shp_reference',
        header: t('logistics.reference'),
        accessorKey: 'shp_reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm font-medium">{row.shp_reference}</span>
        ),
      },
      {
        id: 'carrier_name',
        header: t('logistics.carrier'),
        accessorKey: 'carrier_name',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.carrier_name || '-'}</span>,
      },
      {
        id: 'consignee_name',
        header: t('consignees.title'),
        accessorKey: 'consignee_name',
        sortable: false,
        cell: (row) => row.consignee_name || '-',
      },
      {
        id: 'shp_tracking_number',
        header: t('logistics.tracking'),
        accessorKey: 'shp_tracking_number',
        sortable: false,
        cell: (row) => row.shp_tracking_number ? (
          <span className="font-mono text-sm text-primary">{row.shp_tracking_number}</span>
        ) : '-',
      },
      {
        id: 'shp_destination_city',
        header: t('logistics.destination'),
        accessorKey: 'shp_destination_city',
        sortable: true,
        cell: (row) => row.shp_destination_city || '-',
      },
      {
        id: 'shp_estimated_delivery',
        header: t('logistics.estDelivery'),
        accessorKey: 'shp_estimated_delivery',
        sortable: true,
        cell: (row) => row.shp_estimated_delivery
          ? new Date(row.shp_estimated_delivery).toLocaleDateString()
          : '-',
      },
      {
        id: 'shp_actual_delivery',
        header: t('logistics.actualDelivery'),
        accessorKey: 'shp_actual_delivery',
        sortable: true,
        cell: (row) => row.shp_actual_delivery
          ? new Date(row.shp_actual_delivery).toLocaleDateString()
          : '-',
      },
      {
        id: 'status_name',
        header: t('logistics.status'),
        accessorKey: 'status_name',
        sortable: true,
        cell: (row) => (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(row.status_name)}`}>
            {row.status_name || '-'}
          </span>
        ),
      },
    ],
    [t]
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('logistics.title')}
        description={t('logistics.manageDescription')}
        actions={
          <Link to="/logistics/new" className="btn-primary">
            {t('logistics.newShipment')}
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader title={t('logistics.totalShipments')} />
          <CardContent>
            <p className="text-3xl font-bold">{statsData?.total_shipments ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('logistics.inTransit')} />
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{statsData?.in_transit ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('logistics.delivered')} />
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{statsData?.delivered ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('logistics.onTimeRate')} />
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {statsData?.on_time_percentage != null ? `${statsData.on_time_percentage}%` : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {isError && (
        <div className="card-elevated p-4 border-destructive/40 mb-6">
          <p className="text-destructive">
            {t('logistics.loadError', {
              defaultValue: 'Failed to load logistics data. Please refresh and try again.'
            })}
          </p>
          {error instanceof Error && (
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={shipmentsData?.items || []}
        keyField="shp_id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={shipmentsData?.total || 0}
        totalPages={shipmentsData?.total_pages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('logistics.searchShipments')}
        emptyMessage={t('logistics.noShipmentsFound')}
        emptyDescription={t('logistics.createFirst')}
        onRowClick={handleRowClick}
      />
    </PageContainer>
  )
}
