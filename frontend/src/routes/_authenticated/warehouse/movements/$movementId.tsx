import { useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { DataTable, Column } from '@/components/ui/data-table'
import { useStockMovement, useCompleteStockMovement, useCancelStockMovement } from '@/hooks/useWarehouse'
import type { StockMovementLine, MovementType, MovementStatus } from '@/types/warehouse'

export const Route = createFileRoute('/_authenticated/warehouse/movements/$movementId')({
  component: MovementDetailPage,
})

function MovementDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { movementId } = Route.useParams()

  const { data: movement, isLoading } = useStockMovement(Number(movementId))
  const completeMovement = useCompleteStockMovement()
  const cancelMovement = useCancelStockMovement()

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
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-amber-100 text-amber-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PARTIALLY: 'bg-orange-100 text-orange-800',
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  const handleComplete = async () => {
    if (movement && window.confirm('Are you sure you want to complete this movement?')) {
      await completeStockMovement.mutateAsync({ id: movement.stm_id })
    }
  }

  const handleCancel = async () => {
    if (movement && window.confirm('Are you sure you want to cancel this movement?')) {
      await cancelStockMovement.mutateAsync(movement.stm_id)
    }
  }

  const lineColumns = useMemo<Column<StockMovementLine>[]>(
    () => [
      {
        id: 'sml_prd_ref',
        header: t('warehouse.reference'),
        accessorKey: 'sml_prd_ref',
        cell: (row) => (
          <span className="font-mono text-sm">{row.sml_prd_ref || '-'}</span>
        ),
      },
      {
        id: 'sml_prd_name',
        header: t('warehouse.product'),
        accessorKey: 'sml_prd_name',
        cell: (row) => <span className="font-medium">{row.sml_prd_name || '-'}</span>,
      },
      {
        id: 'sml_quantity',
        header: t('warehouse.quantity'),
        accessorKey: 'sml_quantity',
        cell: (row) => <span className="font-medium">{row.sml_quantity}</span>,
      },
      {
        id: 'sml_quantity_actual',
        header: t('warehouse.actualQuantity'),
        accessorKey: 'sml_quantity_actual',
        cell: (row) => (
          <span className={row.has_variance ? 'text-amber-600 font-medium' : ''}>
            {row.sml_quantity_actual ?? '-'}
          </span>
        ),
      },
      {
        id: 'sml_location',
        header: t('warehouse.location'),
        accessorKey: 'sml_location',
        cell: (row) => row.sml_location || '-',
      },
      {
        id: 'sml_batch_number',
        header: t('warehouse.batchNumber'),
        accessorKey: 'sml_batch_number',
        cell: (row) => row.sml_batch_number || '-',
      },
      {
        id: 'sml_is_damaged',
        header: t('warehouse.damaged'),
        accessorKey: 'sml_is_damaged',
        cell: (row) => (
          <span className={row.sml_is_damaged ? 'text-destructive' : 'text-muted-foreground'}>
            {row.sml_is_damaged ? t('common.yes') : t('common.no')}
          </span>
        ),
      },
    ],
    [t]
  )

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    )
  }

  if (!movement) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">{t('common.notFound')}</p>
          <Link to="/warehouse/movements" className="btn-secondary mt-4">
            {t('common.goBack')}
          </Link>
        </div>
      </PageContainer>
    )
  }

  const canComplete = ['DRAFT', 'PENDING', 'IN_PROGRESS'].includes(movement.stm_status)
  const canCancel = ['DRAFT', 'PENDING'].includes(movement.stm_status)

  return (
    <PageContainer>
      <PageHeader
        title={`${t('warehouse.movementDetails')} - ${movement.stm_reference}`}
        description={getTypeLabel(movement.stm_type)}
        actions={
          <div className="flex gap-2">
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={completeStockMovement.isPending}
                className="btn-primary"
              >
                {completeStockMovement.isPending ? '...' : t('warehouse.completeMovement')}
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelStockMovement.isPending}
                className="btn-secondary text-destructive"
              >
                {cancelStockMovement.isPending ? '...' : t('warehouse.cancelMovement')}
              </button>
            )}
            <Link to="/warehouse/movements" className="btn-secondary">
              {t('common.goBack')}
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader title={t('common.status')} />
          <CardContent>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(movement.stm_status)}`}>
              {getStatusLabel(movement.stm_status)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('warehouse.movementDate')} />
          <CardContent>
            <p className="text-lg font-medium">
              {movement.stm_date ? new Date(movement.stm_date).toLocaleDateString() : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('warehouse.totalQty')} />
          <CardContent>
            <p className="text-2xl font-bold">{movement.stm_total_quantity}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title={t('common.details')} />
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('warehouse.sourceWarehouse')}:</span>
                <span className="font-medium">{movement.warehouse_name || '-'}</span>
              </div>
              {movement.destination_warehouse_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('warehouse.destinationWarehouse')}:</span>
                  <span className="font-medium">{movement.destination_warehouse_name}</span>
                </div>
              )}
              {movement.client_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.client')}:</span>
                  <span className="font-medium">{movement.client_name}</span>
                </div>
              )}
              {movement.stm_source_document && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.sourceDocument')}:</span>
                  <span className="font-medium">{movement.stm_source_document}</span>
                </div>
              )}
              {movement.stm_tracking_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('logistics.tracking')}:</span>
                  <span className="font-mono">{movement.stm_tracking_number}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={t('common.summary')} />
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('warehouse.totalLines')}:</span>
                <span className="font-medium">{movement.stm_total_lines}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('warehouse.totalQty')}:</span>
                <span className="font-medium">{movement.stm_total_quantity}</span>
              </div>
              {movement.stm_total_quantity_actual !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('warehouse.actualQuantity')}:</span>
                  <span className="font-medium">{movement.stm_total_quantity_actual}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('warehouse.totalValue')}:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(movement.stm_total_value)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {movement.stm_notes && (
        <Card className="mb-6">
          <CardHeader title={t('common.notes')} />
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{movement.stm_notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader title={t('common.lines')} />
        <CardContent>
          <DataTable
            columns={lineColumns}
            data={movement.lines || []}
            keyField="sml_id"
            isLoading={false}
            emptyMessage={t('common.noItemsFound')}
          />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
