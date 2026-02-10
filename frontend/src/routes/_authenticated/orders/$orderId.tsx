import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { PageActionBar, ActionButtons, ActionDivider, PdfActionsDropdown } from '@/components/ui/layout/PageActionBar'
import { StatusBadge } from '@/components/ui/Badge'
import { DocumentAttachments } from '@/components/attachments'
import { AttachFileButton } from '@/components/attachments'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { useDeliveriesByOrder } from '@/hooks/useDeliveries'
import { useCreateInvoiceFromOrder } from '@/hooks/useInvoices'
import { useConvertOrderToQuote, useUpdateOrderDiscount } from '@/hooks/useOrders'
import { useToast } from '@/components/ui/feedback/Toast'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  component: OrderDetailPage,
})

function OrderDetailPage() {
  const { orderId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([])
  const [isLineActionPending, setIsLineActionPending] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${orderId}`)
      return response.data
    },
  })

  const { data: deliveries = [] } = useDeliveriesByOrder(Number(orderId))
  const createInvoiceMutation = useCreateInvoiceFromOrder()
  const convertToQuoteMutation = useConvertOrderToQuote()
  const updateDiscountMutation = useUpdateOrderDiscount()

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

  if (!order) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Order not found</h2>
          <button onClick={() => navigate({ to: '/orders' as any })} className="btn-primary mt-4">
            Back to Orders
          </button>
        </div>
      </PageContainer>
    )
  }

  const invoicingSnapshot = order.invoicingContactSnapshot
  const deliverySnapshot = order.deliveryContactSnapshot

  const openPdfUtility = (mode: 'pdf-viewer' | 'pdf-download') => {
    const safeReference = order.reference || orderId
    navigate({
      to: '/accounting/export' as any,
      search: {
        mode,
        source: `/orders/${orderId}/pdf`,
        title: `Order ${safeReference}`,
        filename: `order-${safeReference}.pdf`,
      } as any,
    })
  }

  const moveLine = async (lineId: number, direction: 'up' | 'down') => {
    const currentIds = (order.lines || []).map((line: any) => Number(line.id)).filter(Boolean)
    const fromIndex = currentIds.indexOf(lineId)
    if (fromIndex < 0) return

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= currentIds.length) return

    const reordered = [...currentIds]
    ;[reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]]

    try {
      setIsLineActionPending(true)
      await apiClient.post(`/orders/${orderId}/lines/reorder`, {
        line_ids: reordered,
      })
      await queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    } catch {
      showError(t('common.error'), 'Unable to reorder line items.')
    } finally {
      setIsLineActionPending(false)
    }
  }

  const mergeSelectedLines = async () => {
    if (selectedLineIds.length < 2) {
      showError(t('common.error'), 'Select at least 2 lines to merge.')
      return
    }

    try {
      setIsLineActionPending(true)
      const response = await apiClient.post(`/orders/${orderId}/lines/merge`, {
        line_ids: selectedLineIds,
      })
      const primaryLineId = response?.data?.primaryLineId
      setSelectedLineIds(primaryLineId ? [primaryLineId] : [])
      await queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      success(t('common.success'), 'Selected lines merged.')
    } catch {
      showError(t('common.error'), 'Unable to merge selected lines.')
    } finally {
      setIsLineActionPending(false)
    }
  }

  const actions = (
    <PageActionBar>
      <ActionButtons.Back onClick={() => navigate({ to: '/orders' as any })} />
      <ActionDivider />
      <ActionButtons.Discount
        onClick={() => {
          setDiscountPercentage(order.discountPercentage != null ? String(order.discountPercentage) : '')
          setDiscountAmount(order.discountAmount != null ? String(order.discountAmount) : '')
          setIsDiscountModalOpen(true)
        }}
      />
      <AttachFileButton
        entityType="ORDER"
        entityId={parseInt(orderId, 10)}
        variant="outline"
      />
      <PdfActionsDropdown
        onPreview={() => openPdfUtility('pdf-viewer')}
        onDownload={() => openPdfUtility('pdf-download')}
      />
      <ActionDivider />
      <ActionButtons.CreateDelivery
        onClick={() => navigate({ to: '/deliveries/new' as any, search: { orderId: Number(orderId) } } as any)}
      />
      <ActionButtons.ConvertToQuote
        disabled={convertToQuoteMutation.isPending}
        isPending={convertToQuoteMutation.isPending}
        onClick={async () => {
          try {
            const result = await convertToQuoteMutation.mutateAsync(Number(orderId))
            success(t('common.success'), `Quote ${result.quoteReference} created`)
            navigate({ to: '/quotes/$quoteId' as any, params: { quoteId: String(result.quoteId) } } as any)
          } catch {
            showError(t('common.error'), 'Unable to convert this order to a quote.')
          }
        }}
      />
      <ActionButtons.CreateInvoice
        onClick={async () => {
          try {
            const invoice = await createInvoiceMutation.mutateAsync({ orderId: Number(orderId) })
            if (invoice?.id) {
              success(t('common.success'), t('invoices.invoiceCreated'))
              navigate({ to: '/invoices/$invoiceId' as any, params: { invoiceId: String(invoice.id) } } as any)
            }
          } catch {
            showError(t('common.error'), t('common.errorOccurred'))
          }
        }}
      />
    </PageActionBar>
  )

  return (
    <PageContainer>
      <PageHeader
        title={`Order ${order.reference}`}
        description={`For ${order.clientName}`}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Order Details" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Reference</dt>
                  <dd className="font-mono">{order.reference}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Client</dt>
                  <dd className="font-medium">{order.clientName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Order Date</dt>
                  <dd>{new Date(order.orderDate).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Required Date</dt>
                  <dd>{order.requiredDate ? new Date(order.requiredDate).toLocaleDateString() : '-'}</dd>
                </div>
                {order.quoteReference && (
                  <div>
                    <dt className="text-sm text-muted-foreground">From Quote</dt>
                    <dd className="font-mono text-sm">{order.quoteReference}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {(invoicingSnapshot || deliverySnapshot) && (
            <Card>
              <CardHeader title="Address Snapshots" />
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AddressSnapshotCard title="Commercial / Billing" snapshot={invoicingSnapshot} />
                  <AddressSnapshotCard title="Delivery" snapshot={deliverySnapshot} />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title={t('orders.lineItems')} />
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {selectedLineIds.length} selected
                </p>
                <button
                  className="btn-secondary"
                  onClick={mergeSelectedLines}
                  disabled={isLineActionPending || selectedLineIds.length < 2}
                >
                  Merge Selected
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground w-10"></th>
                    <th className="text-left py-2 text-sm text-muted-foreground">Image</th>
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('orders.product')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('orders.quantity')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('orders.delivered')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('orders.unitPrice')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('orders.total')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-28">Order</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines?.map((line: any, index: number) => (
                    <tr key={line.id ?? index} className="border-b">
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedLineIds.includes(Number(line.id))}
                          onChange={(e) => {
                            const numericId = Number(line.id)
                            if (!numericId) return
                            if (e.target.checked) {
                              setSelectedLineIds((prev) => [...prev, numericId])
                            } else {
                              setSelectedLineIds((prev) => prev.filter((id) => id !== numericId))
                            }
                          }}
                          disabled={isLineActionPending}
                        />
                      </td>
                      <td className="py-3 pr-2">
                        {line.imageUrl ? (
                          <img
                            src={line.imageUrl}
                            alt={line.productName || 'Product image'}
                            className="w-12 h-12 rounded-md border border-border object-cover bg-muted"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md border border-border bg-muted/40" />
                        )}
                      </td>
                      <td className="py-3">
                        <p className="font-medium">{line.productName || line.description}</p>
                        {line.description && line.productName && (
                          <p className="text-sm text-muted-foreground">{line.description}</p>
                        )}
                      </td>
                      <td className="text-right py-3">{line.quantity}</td>
                      <td className="text-right py-3">
                        <span className={line.deliveredQuantity < line.quantity ? 'text-amber-600' : 'text-green-600'}>
                          {line.deliveredQuantity || 0}
                        </span>
                      </td>
                      <td className="text-right py-3">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(line.unitPrice)}
                      </td>
                      <td className="text-right py-3 font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(line.lineTotal)}
                      </td>
                      <td className="text-right py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-xs"
                            onClick={() => moveLine(Number(line.id), 'up')}
                            disabled={isLineActionPending || index === 0}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-xs"
                            onClick={() => moveLine(Number(line.id), 'down')}
                            disabled={isLineActionPending || index === (order.lines?.length || 0) - 1}
                          >
                            Down
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        {t('orders.noLineItems')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Deliveries Section */}
          <Card>
            <CardHeader
              title={t('deliveries.title')}
              action={
                <Link
                  to="/deliveries/new"
                  search={{ orderId: Number(orderId) }}
                  className="text-sm text-primary hover:underline"
                >
                  {t('deliveries.newDelivery')}
                </Link>
              }
            />
            <CardContent>
              {deliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('deliveries.noDeliveriesFound')}</p>
              ) : (
                <div className="divide-y divide-border">
                  {deliveries.map((delivery) => (
                    <Link
                      key={delivery.id}
                      to="/deliveries/$deliveryId"
                      params={{ deliveryId: String(delivery.id) }}
                      className="block py-3 hover:bg-accent/50 -mx-4 px-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm">{delivery.reference}</p>
                          <p className="text-xs text-muted-foreground">
                            {delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : t('common.pending')}
                          </p>
                        </div>
                        <StatusBadge status={delivery.statusName || 'Draft'} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" />
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Status</p>
                <StatusBadge status={order.statusName} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                <StatusBadge status={order.paymentStatusName || 'Unpaid'} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Totals" />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.subtotal || order.totalAmount)}</dd>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>Discount</dt>
                    <dd>-{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.taxAmount || 0)}</dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>Total</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.totalAmount)}</dd>
                </div>
                {order.paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <dt>Paid</dt>
                      <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.paidAmount)}</dd>
                    </div>
                    <div className="flex justify-between font-medium">
                      <dt>Balance</dt>
                      <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.totalAmount - order.paidAmount)}</dd>
                    </div>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <DocumentAttachments
            entityType="ORDER"
            entityId={parseInt(orderId, 10)}
          />
        </div>
      </div>

      <FormModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title="Apply Discount"
        description="Set either discount percentage or fixed amount."
        footer={
          <FormModalFooter
            onCancel={() => setIsDiscountModalOpen(false)}
            onSubmit={async () => {
              try {
                await updateDiscountMutation.mutateAsync({
                  id: Number(orderId),
                  request: {
                    discountPercentage: discountPercentage !== '' ? Number(discountPercentage) : undefined,
                    discountAmount: discountAmount !== '' ? Number(discountAmount) : undefined,
                  },
                })
                await queryClient.invalidateQueries({ queryKey: ['order', orderId] })
                success('Discount updated', 'Order discount has been updated.')
                setIsDiscountModalOpen(false)
              } catch {
                showError('Error', 'Unable to update order discount.')
              }
            }}
            submitText="Apply"
            isSubmitting={updateDiscountMutation.isPending}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            type="number"
            label="Discount %"
            value={discountPercentage}
            onChange={(e) => setDiscountPercentage(e.target.value)}
            placeholder="0"
          />
          <FormInput
            type="number"
            label="Discount Amount"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
            placeholder="0"
          />
        </div>
      </FormModal>
    </PageContainer>
  )
}

function AddressSnapshotCard({
  title,
  snapshot,
}: {
  title: string
  snapshot?: any
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-medium text-foreground mb-2">{title}</p>
      {!snapshot ? (
        <p className="text-sm text-muted-foreground">No snapshot available.</p>
      ) : (
        <div className="text-sm text-foreground space-y-1">
          <p className="font-medium">
            {[snapshot.addressTitle, snapshot.firstName, snapshot.lastName].filter(Boolean).join(' ')}
          </p>
          {snapshot.reference && <p className="font-mono text-xs text-muted-foreground">{snapshot.reference}</p>}
          <p>{[snapshot.address1, snapshot.address2].filter(Boolean).join(' ') || '-'}</p>
          <p>{[snapshot.postcode, snapshot.city, snapshot.country].filter(Boolean).join(' ') || '-'}</p>
          <p>{snapshot.phone || snapshot.mobile || '-'}</p>
          <p>{snapshot.email || '-'}</p>
        </div>
      )}
    </div>
  )
}
