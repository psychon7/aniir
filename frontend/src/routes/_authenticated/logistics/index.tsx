import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/logistics/')({
  component: LogisticsPage,
})

interface Shipment {
  id: number
  reference: string
  deliveryReference: string
  deliveryId: number
  carrierName: string
  carrierId: number
  trackingNumber?: string
  statusName: string
  statusId: number
  estimatedDelivery?: string
  actualDelivery?: string
  cost?: number
  currency: string
  createdAt: string
}

interface ShipmentSearchParams {
  page: number
  pageSize: number
  search?: string
  carrierId?: number
  statusId?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

function LogisticsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useState<ShipmentSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['shipments', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', searchParams.page.toString())
      params.append('pageSize', searchParams.pageSize.toString())
      if (searchParams.search) params.append('search', searchParams.search)
      if (searchParams.carrierId) params.append('carrierId', searchParams.carrierId.toString())
      if (searchParams.statusId) params.append('statusId', searchParams.statusId.toString())
      if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy)
      if (searchParams.sortOrder) params.append('sortOrder', searchParams.sortOrder)
      
      const response = await apiClient.get(`/logistics/shipments?${params}`)
      return response.data
    },
  })

  const { data: statsData } = useQuery({
    queryKey: ['logistics-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/logistics/stats')
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

  const columns = useMemo<Column<Shipment>[]>(
    () => [
      {
        id: 'reference',
        header: t('logistics.reference'),
        accessorKey: 'reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference}</span>
        ),
      },
      {
        id: 'deliveryReference',
        header: t('logistics.delivery'),
        accessorKey: 'deliveryReference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm">{row.deliveryReference}</span>
        ),
      },
      {
        id: 'carrierName',
        header: t('logistics.carrier'),
        accessorKey: 'carrierName',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.carrierName}</span>,
      },
      {
        id: 'trackingNumber',
        header: t('logistics.tracking'),
        accessorKey: 'trackingNumber',
        sortable: false,
        cell: (row) => row.trackingNumber ? (
          <span className="font-mono text-sm text-primary">{row.trackingNumber}</span>
        ) : '-',
      },
      {
        id: 'estimatedDelivery',
        header: t('logistics.estDelivery'),
        accessorKey: 'estimatedDelivery',
        sortable: true,
        cell: (row) => row.estimatedDelivery ? new Date(row.estimatedDelivery).toLocaleDateString() : '-',
      },
      {
        id: 'actualDelivery',
        header: t('logistics.actualDelivery'),
        accessorKey: 'actualDelivery',
        sortable: true,
        cell: (row) => row.actualDelivery ? new Date(row.actualDelivery).toLocaleDateString() : '-',
      },
      {
        id: 'cost',
        header: t('logistics.cost'),
        accessorKey: 'cost',
        sortable: true,
        cell: (row) => row.cost 
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currency || 'USD' }).format(row.cost)
          : '-',
      },
      {
        id: 'statusName',
        header: t('logistics.status'),
        accessorKey: 'statusName',
        sortable: true,
        cell: (row) => <StatusBadge status={row.statusName} />,
      },
    ],
    [t]
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('logistics.title')}
        description={t('logistics.manageDescription')}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader title={t('logistics.activeShipments')} />
          <CardContent>
            <p className="text-3xl font-bold">{statsData?.activeShipments ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('logistics.inTransit')} />
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{statsData?.inTransit ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('logistics.deliveredToday')} />
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{statsData?.deliveredToday ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('logistics.delayed')} />
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{statsData?.delayed ?? '-'}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={shipmentsData?.data || shipmentsData?.items || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={shipmentsData?.totalCount || 0}
        totalPages={shipmentsData?.totalPages || 1}
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
      />
    </PageContainer>
  )
}
