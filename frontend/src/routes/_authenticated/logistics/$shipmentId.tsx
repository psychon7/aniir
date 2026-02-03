import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useShipment, useMarkDelivered, useDeleteShipment } from '@/hooks/useLogistics'

export const Route = createFileRoute('/_authenticated/logistics/$shipmentId')({
  component: ShipmentDetailPage,
})

function ShipmentDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { shipmentId } = Route.useParams()

  const { data: shipment, isLoading } = useShipment(Number(shipmentId))
  const markDelivered = useMarkDelivered()
  const deleteShipment = useDeleteShipment()

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

  const handleMarkDelivered = async () => {
    if (shipment && window.confirm('Are you sure you want to mark this shipment as delivered?')) {
      await markDelivered.mutateAsync({ id: shipment.shp_id })
    }
  }

  const handleDelete = async () => {
    if (shipment && window.confirm('Are you sure you want to delete this shipment?')) {
      await deleteShipment.mutateAsync(shipment.shp_id)
      navigate({ to: '/logistics' })
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    )
  }

  if (!shipment) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">{t('common.notFound')}</p>
          <Link to="/logistics" className="btn-secondary mt-4">
            {t('common.goBack')}
          </Link>
        </div>
      </PageContainer>
    )
  }

  const canMarkDelivered = !shipment.is_delivered && shipment.status_name?.toLowerCase() !== 'cancelled'

  return (
    <PageContainer>
      <PageHeader
        title={`${t('logistics.shipmentDetails')} - ${shipment.shp_reference}`}
        description={shipment.carrier_name || ''}
        actions={
          <div className="flex gap-2">
            {canMarkDelivered && (
              <button
                onClick={handleMarkDelivered}
                disabled={markDelivered.isPending}
                className="btn-primary"
              >
                {markDelivered.isPending ? '...' : t('logistics.markDelivered')}
              </button>
            )}
            <Link to="/logistics/$shipmentId/edit" params={{ shipmentId }} className="btn-secondary">
              {t('common.edit')}
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteShipment.isPending}
              className="btn-secondary text-destructive"
            >
              {deleteShipment.isPending ? '...' : t('common.delete')}
            </button>
            <Link to="/logistics" className="btn-secondary">
              {t('common.goBack')}
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader title={t('logistics.status')} />
          <CardContent>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shipment.status_name)}`}>
              {shipment.status_name || '-'}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('logistics.carrier')} />
          <CardContent>
            <p className="text-lg font-medium">{shipment.carrier_name || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t('logistics.tracking')} />
          <CardContent>
            <p className="font-mono text-lg">
              {shipment.shp_tracking_number || '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title={t('logistics.originAddress')} />
          <CardContent>
            <div className="space-y-2">
              {shipment.shp_origin_address && (
                <p>{shipment.shp_origin_address}</p>
              )}
              <p className="text-muted-foreground">
                {[shipment.shp_origin_city, shipment.origin_country_name]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={t('logistics.destinationAddress')} />
          <CardContent>
            <div className="space-y-2">
              {shipment.shp_destination_address && (
                <p>{shipment.shp_destination_address}</p>
              )}
              <p className="text-muted-foreground">
                {[shipment.shp_destination_city, shipment.destination_country_name]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title={t('logistics.deliveryInfo')} />
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('logistics.estDelivery')}:</span>
                <span className="font-medium">
                  {shipment.shp_estimated_delivery
                    ? new Date(shipment.shp_estimated_delivery).toLocaleDateString()
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('logistics.actualDelivery')}:</span>
                <span className="font-medium">
                  {shipment.shp_actual_delivery
                    ? new Date(shipment.shp_actual_delivery).toLocaleDateString()
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('logistics.onTime')}:</span>
                <span className={`font-medium ${shipment.is_on_time ? 'text-green-600' : 'text-amber-600'}`}>
                  {shipment.is_on_time === null ? '-' : shipment.is_on_time ? t('common.yes') : t('common.no')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={t('logistics.packageInfo')} />
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('logistics.packages')}:</span>
                <span className="font-medium">{shipment.shp_packages ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('logistics.weight')}:</span>
                <span className="font-medium">
                  {shipment.shp_weight ? `${shipment.shp_weight} kg` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('logistics.cost')}:</span>
                <span className="font-medium">
                  {shipment.shp_cost
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: shipment.currency_code || 'USD'
                      }).format(Number(shipment.shp_cost))
                    : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {shipment.shp_notes && (
        <Card>
          <CardHeader title={t('common.notes')} />
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{shipment.shp_notes}</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
