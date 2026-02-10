import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useToast } from '@/components/ui/feedback/Toast'
import { useOrders, useOrder } from '@/hooks/useOrders'
import { useCreateDelivery } from '@/hooks/useDeliveries'
import { useCarriers } from '@/hooks/useLogistics'
import type { DeliveryFormCreateDto, DeliveryLineCreateDto } from '@/types/delivery'

export const Route = createFileRoute('/_authenticated/deliveries/new')({
  validateSearch: (search) => {
    const orderId =
      typeof search.orderId === 'string'
        ? Number(search.orderId)
        : typeof search.orderId === 'number'
          ? search.orderId
          : undefined
    return {
      orderId: Number.isFinite(orderId) ? orderId : undefined,
    }
  },
  component: NewDeliveryPage,
})

interface LineDeliverQty {
  lineId: number
  toDeliver: number
}

function NewDeliveryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const { orderId: initialOrderId } = Route.useSearch()

  // Form state
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>(initialOrderId ?? '')
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().split('T')[0])
  const [carrierId, setCarrierId] = useState<number | ''>('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [packages, setPackages] = useState('')
  const [weight, setWeight] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState('preparing')
  const [lineQuantities, setLineQuantities] = useState<LineDeliverQty[]>([])

  // Queries
  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    page: 1,
    pageSize: 50,
    sortBy: 'cod_d_creation',
    sortOrder: 'desc',
  })
  const { data: orderDetail, isLoading: orderLoading } = useOrder(
    typeof selectedOrderId === 'number' ? selectedOrderId : 0
  )
  const { data: carriers = [] } = useCarriers(true)

  // Mutation
  const createMutation = useCreateDelivery()

  const orderOptions = useMemo(() => ordersData?.data || [], [ordersData])

  // When order detail loads, initialize line quantities with remaining-to-deliver amounts
  useEffect(() => {
    if (orderDetail?.lines?.length) {
      setLineQuantities(
        orderDetail.lines.map((line: any) => {
          const ordered = Number(line.quantity || 0)
          const delivered = Number(line.deliveredQuantity || 0)
          return {
            lineId: line.id,
            toDeliver: Math.max(ordered - delivered, 0),
          }
        })
      )
      // Pre-fill shipping address from order delivery contact snapshot
      const detailAny = orderDetail as any
      if (detailAny.deliveryContactSnapshot) {
        const snap = detailAny.deliveryContactSnapshot
        const addrParts = [
          snap.address1,
          snap.address2,
          [snap.postcode, snap.city].filter(Boolean).join(' '),
          snap.country,
        ].filter(Boolean)
        if (addrParts.length > 0) {
          setShippingAddress(addrParts.join('\n'))
        }
      }
    } else {
      setLineQuantities([])
    }
  }, [orderDetail])

  const handleOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setSelectedOrderId(value ? Number(value) : '')
    // Reset line quantities when order changes
    setLineQuantities([])
    setShippingAddress('')
  }

  const updateLineQty = (lineId: number, qty: number) => {
    setLineQuantities((prev) =>
      prev.map((lq) => (lq.lineId === lineId ? { ...lq, toDeliver: qty } : lq))
    )
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!selectedOrderId || typeof selectedOrderId !== 'number') {
      showError(t('common.error'), t('deliveries.selectOrderRequired', { defaultValue: 'Please select an order.' }))
      return
    }

    if (!orderDetail) {
      showError(t('common.error'), t('deliveries.orderNotLoaded', { defaultValue: 'Order details not loaded yet.' }))
      return
    }

    if (!expectedDate) {
      showError(t('common.error'), t('deliveries.dateRequired', { defaultValue: 'Please select a delivery date.' }))
      return
    }

    // Build delivery lines from line quantities
    const lines: DeliveryLineCreateDto[] = lineQuantities
      .filter((lq) => lq.toDeliver > 0)
      .map((lq) => {
        const orderLine = orderDetail.lines?.find((l: any) => l.id === lq.lineId)
        return {
          orderLineId: lq.lineId,
          description: orderLine?.productName || orderLine?.description || '',
          quantity: lq.toDeliver,
        }
      })

    if (lines.length === 0) {
      showError(
        t('common.error'),
        t('deliveries.noLinesToDeliver', { defaultValue: 'No items with quantity to deliver. Please set quantities.' })
      )
      return
    }

    const data: DeliveryFormCreateDto = {
      orderId: selectedOrderId,
      clientId: orderDetail.clientId,
      expectedDeliveryDate: expectedDate,
      deliveryNotes: deliveryNotes || undefined,
      lines,
    }

    // Parse address into structured fields if possible
    if (shippingAddress) {
      const addressLines = shippingAddress.split('\n').map((l) => l.trim()).filter(Boolean)
      if (addressLines.length > 0) {
        data.deliveryAddress = addressLines[0]
      }
      if (addressLines.length > 1) {
        data.deliveryAddress2 = addressLines[1]
      }
      if (addressLines.length > 2) {
        data.deliveryCity = addressLines[2]
      }
      if (addressLines.length > 3) {
        data.deliveryCountry = addressLines[3]
      }
    }

    try {
      const newDelivery = await createMutation.mutateAsync(data)
      success(
        t('deliveries.createSuccess', { defaultValue: 'Delivery Created' }),
        t('deliveries.createSuccessMessage', { defaultValue: 'The delivery form has been created successfully.' })
      )
      // Navigate to the delivery detail or list
      const newId = newDelivery?.id
      if (newId) {
        navigate({ to: `/deliveries/${newId}` as any })
      } else {
        navigate({ to: '/deliveries' as any })
      }
    } catch (err: any) {
      showError(
        t('common.error'),
        err?.response?.data?.detail?.error?.message ||
          t('deliveries.createError', { defaultValue: 'Failed to create delivery form.' })
      )
    }
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/deliveries' as any })} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSubmit}
        disabled={createMutation.isPending || !selectedOrderId}
        className="btn-primary"
      >
        {createMutation.isPending ? t('common.loading') : t('common.save')}
      </button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('deliveries.newDelivery')}
        description={t('deliveries.manageDescription')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('deliveries.deliveryDetails')} />
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('deliveries.reference')}</label>
                    <input type="text" className="input w-full" placeholder={t('common.autoGenerated', { defaultValue: 'Auto-generated' })} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('deliveries.order')} *</label>
                    <select
                      className="input w-full"
                      value={selectedOrderId}
                      onChange={handleOrderChange}
                    >
                      <option value="">{ordersLoading ? t('common.loading') : t('orders.selectOrder', { defaultValue: 'Select an order...' })}</option>
                      {orderOptions.map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.reference}{order.clientName ? ` \u2014 ${order.clientName}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('deliveries.expectedDate')} *</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('deliveries.carrier')}</label>
                    <select
                      className="input w-full"
                      value={carrierId}
                      onChange={(e) => setCarrierId(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">{t('logistics.selectCarrier', { defaultValue: 'Select a carrier...' })}</option>
                      {carriers.map((carrier) => (
                        <option key={carrier.car_id} value={carrier.car_id}>
                          {carrier.car_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('deliveries.trackingNumber')}</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder={t('deliveries.trackingNumber')}
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('deliveries.packages')}</label>
                    <input
                      type="number"
                      className="input w-full"
                      placeholder="1"
                      min="1"
                      value={packages}
                      onChange={(e) => setPackages(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('deliveries.weight')} (kg)</label>
                    <input
                      type="number"
                      className="input w-full"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">{t('deliveries.shippingAddress')}</label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    placeholder={t('common.address')}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">{t('deliveries.notes')}</label>
                  <textarea
                    className="input w-full"
                    rows={2}
                    placeholder={t('deliveries.notes')}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('deliveries.items')} />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('orders.product')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('orders.quantity')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('orders.delivered')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-28">{t('deliveries.toDeliver', { defaultValue: 'To Deliver' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {orderLoading && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        {t('common.loading')}
                      </td>
                    </tr>
                  )}
                  {!orderLoading && orderDetail?.lines?.length ? (
                    orderDetail.lines.map((line: any) => {
                      const ordered = Number(line.quantity || 0)
                      const delivered = Number(line.deliveredQuantity || 0)
                      const remaining = Math.max(ordered - delivered, 0)
                      const lineQty = lineQuantities.find((lq) => lq.lineId === line.id)
                      const toDeliver = lineQty?.toDeliver ?? remaining
                      return (
                        <tr key={line.id} className="border-b">
                          <td className="py-3">
                            <p className="font-medium">{line.productName || line.description || '-'}</p>
                            {line.productReference && (
                              <p className="text-sm text-muted-foreground font-mono">{line.productReference}</p>
                            )}
                          </td>
                          <td className="text-right py-3">{ordered}</td>
                          <td className="text-right py-3">{delivered}</td>
                          <td className="text-right py-3">
                            <input
                              type="number"
                              className="input w-20 text-right ml-auto"
                              min={0}
                              max={remaining}
                              value={toDeliver}
                              onChange={(e) =>
                                updateLineQty(line.id, Math.max(0, Math.min(remaining, Number(e.target.value) || 0)))
                              }
                            />
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        {selectedOrderId ? t('orders.noLineItems', { defaultValue: 'No line items' }) : t('orders.selectOrder', { defaultValue: 'Select an order to see items to deliver.' })}
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
            <CardHeader title={t('common.status')} />
            <CardContent>
              <select
                className="input w-full"
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
              >
                <option value="preparing">{t('deliveries.preparing')}</option>
                <option value="ready">{t('deliveries.inTransit', { defaultValue: 'Ready to Ship' })}</option>
                <option value="shipped">{t('deliveries.shipped')}</option>
              </select>
            </CardContent>
          </Card>

          {orderDetail && (
            <Card>
              <CardHeader title={t('orders.title')} />
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.reference')}</p>
                  <p className="font-mono">{orderDetail.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.client')}</p>
                  <p className="font-medium">{orderDetail.clientName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.expectedDelivery')}</p>
                  <p>{orderDetail.expectedDeliveryDate ? new Date(orderDetail.expectedDeliveryDate).toLocaleDateString() : '-'}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
