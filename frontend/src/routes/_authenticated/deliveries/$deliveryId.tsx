import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/deliveries/$deliveryId')({
  component: DeliveryDetailPage,
})

function DeliveryDetailPage() {
  const { deliveryId } = Route.useParams()
  const navigate = useNavigate()

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: async () => {
      const response = await apiClient.get(`/deliveries/${deliveryId}`)
      return response.data
    },
  })

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </PageContainer>
    )
  }

  if (!delivery) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Delivery not found</h2>
          <button onClick={() => navigate({ to: '/deliveries' as any })} className="btn-primary mt-4">
            Back to Deliveries
          </button>
        </div>
      </PageContainer>
    )
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/deliveries' as any })} className="btn-secondary">
        Back
      </button>
      <button className="btn-secondary">Print Delivery Note</button>
      {delivery.statusName !== 'Delivered' && (
        <button className="btn-primary">Mark as Delivered</button>
      )}
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={`Delivery ${delivery.reference}`}
        description={`For Order ${delivery.orderReference}`}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Delivery Details" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Reference</dt>
                  <dd className="font-mono">{delivery.reference}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Order</dt>
                  <dd className="font-mono">{delivery.orderReference}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Client</dt>
                  <dd className="font-medium">{delivery.clientName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Scheduled Date</dt>
                  <dd>
                    {delivery.scheduledDate
                      ? new Date(delivery.scheduledDate).toLocaleDateString()
                      : '-'}
                  </dd>
                </div>
                {delivery.deliveryDate && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Delivered On</dt>
                    <dd>{new Date(delivery.deliveryDate).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Shipping Information" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Carrier</dt>
                  <dd>{delivery.carrierName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Tracking Number</dt>
                  <dd className="font-mono text-primary">{delivery.trackingNumber || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Weight</dt>
                  <dd>{delivery.weight ? `${delivery.weight} kg` : '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Packages</dt>
                  <dd>{delivery.packages || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm text-muted-foreground">Shipping Address</dt>
                  <dd className="whitespace-pre-line">{delivery.shippingAddress || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Items" />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">Product</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Ordered</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Delivered</th>
                  </tr>
                </thead>
                <tbody>
                  {delivery.lines?.map((line: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-3">
                        <p className="font-medium">{line.productName}</p>
                        {line.productReference && (
                          <p className="text-sm text-muted-foreground font-mono">{line.productReference}</p>
                        )}
                      </td>
                      <td className="text-right py-3">{line.orderedQuantity}</td>
                      <td className="text-right py-3 font-medium">{line.deliveredQuantity}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-muted-foreground">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" />
            <CardContent>
              <StatusBadge status={delivery.statusName} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {delivery.createdAt ? new Date(delivery.createdAt).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
                {delivery.shippedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium">Shipped</p>
                      <p className="text-sm text-muted-foreground">{new Date(delivery.shippedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {delivery.deliveredAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-muted-foreground">{new Date(delivery.deliveredAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
