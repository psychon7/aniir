import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import {
  useSupplierOrder,
  useConfirmSupplierOrder,
  useCancelSupplierOrder,
  useDeleteSupplierOrder,
} from '@/hooks/useSupplierOrders'
import type { SupplierOrder } from '@/types/supplierOrder'

export const Route = createFileRoute('/_authenticated/supplier-orders/$orderId')({
  component: SupplierOrderDetailPage,
})

/**
 * Get status badge styling based on order state
 */
function getStatusBadge(order: SupplierOrder) {
  if (order.isCanceled) {
    return {
      label: 'Cancelled',
      className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
  }
  if (order.isStarted) {
    return {
      label: 'Confirmed',
      className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    }
  }
  return {
    label: 'Draft',
    className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  }
}

function SupplierOrderDetailPage() {
  const { orderId } = Route.useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { data: order, isLoading } = useSupplierOrder(parseInt(orderId, 10))
  const confirmMutation = useConfirmSupplierOrder()
  const cancelMutation = useCancelSupplierOrder()
  const deleteMutation = useDeleteSupplierOrder()

  const handleConfirm = async () => {
    if (!order) return
    try {
      await confirmMutation.mutateAsync({ id: order.id })
      success(t('supplierOrders.confirmSuccess'), t('supplierOrders.confirmSuccessMessage'))
    } catch {
      showError(t('common.error'), t('supplierOrders.confirmError'))
    }
  }

  const handleCancel = async () => {
    if (!order || !cancelReason.trim()) return
    try {
      await cancelMutation.mutateAsync({ id: order.id, request: { reason: cancelReason } })
      success(t('supplierOrders.cancelSuccess'), t('supplierOrders.cancelSuccessMessage'))
      setShowCancelDialog(false)
      setCancelReason('')
    } catch {
      showError(t('common.error'), t('supplierOrders.cancelError'))
    }
  }

  const handleDelete = async () => {
    if (!order) return
    try {
      await deleteMutation.mutateAsync(order.id)
      success(t('supplierOrders.deleteSuccess'), t('supplierOrders.deleteSuccessMessage'))
      navigate({ to: '/supplier-orders' as any })
    } catch {
      showError(t('common.error'), t('supplierOrders.deleteError'))
    }
  }

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
          <h2 className="text-xl font-semibold">{t('supplierOrders.notFound')}</h2>
          <button onClick={() => navigate({ to: '/supplier-orders' as any })} className="btn-primary mt-4">
            {t('supplierOrders.backToList')}
          </button>
        </div>
      </PageContainer>
    )
  }

  const status = getStatusBadge(order)
  const canEdit = !order.isStarted && !order.isCanceled
  const canConfirm = !order.isStarted && !order.isCanceled
  const canCancel = !order.isCanceled

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/supplier-orders' as any })} className="btn-secondary">
        {t('common.back')}
      </button>
      {canEdit && (
        <button
          onClick={() => navigate({ to: '/supplier-orders/$orderId/edit' as any, params: { orderId } })}
          className="btn-secondary"
        >
          {t('common.edit')}
        </button>
      )}
      {canConfirm && (
        <button
          onClick={handleConfirm}
          disabled={confirmMutation.isPending}
          className="btn-primary"
        >
          {confirmMutation.isPending ? t('common.loading') : t('supplierOrders.confirm')}
        </button>
      )}
      {canCancel && order.isStarted && (
        <button
          onClick={() => setShowCancelDialog(true)}
          className="btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {t('supplierOrders.cancel')}
        </button>
      )}
      {canEdit && (
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {t('common.delete')}
        </button>
      )}
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={`${t('supplierOrders.order')} ${order.code || order.displayName}`}
        description={order.supplierName ? `${t('supplierOrders.for')} ${order.supplierName}` : ''}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('supplierOrders.orderDetails')} />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('supplierOrders.reference')}</dt>
                  <dd className="font-mono">{order.code || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('supplierOrders.supplier')}</dt>
                  <dd className="font-medium">{order.supplierName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('supplierOrders.orderDate')}</dt>
                  <dd>{new Date(order.createdAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('supplierOrders.expectedDelivery')}</dt>
                  <dd>{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '-'}</dd>
                </div>
                {order.name && (
                  <div className="col-span-2">
                    <dt className="text-sm text-muted-foreground">{t('supplierOrders.name')}</dt>
                    <dd>{order.name}</dd>
                  </div>
                )}
                {order.purchaseIntentId && (
                  <div>
                    <dt className="text-sm text-muted-foreground">{t('supplierOrders.purchaseIntent')}</dt>
                    <dd className="font-mono text-sm">#{order.purchaseIntentId}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('supplierOrders.lines')} />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('supplierOrders.product')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('supplierOrders.quantity')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('supplierOrders.unitPrice')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('supplierOrders.discount')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('supplierOrders.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines && order.lines.length > 0 ? (
                    order.lines.map((line) => (
                      <tr key={line.id} className="border-b">
                        <td className="py-3">
                          <p className="font-medium">{line.productName || line.description}</p>
                          {line.description && line.productName && (
                            <p className="text-sm text-muted-foreground">{line.description}</p>
                          )}
                        </td>
                        <td className="text-right py-3">{line.quantity || 0}</td>
                        <td className="text-right py-3">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(line.unitPrice || 0)}
                        </td>
                        <td className="text-right py-3">
                          {line.discountAmount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(line.discountAmount) : '-'}
                        </td>
                        <td className="text-right py-3 font-medium">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(line.lineTotal || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t('supplierOrders.noLines')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {(order.internalComment || order.supplierComment) && (
            <Card>
              <CardHeader title={t('supplierOrders.comments')} />
              <CardContent className="space-y-4">
                {order.internalComment && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">{t('supplierOrders.internalComment')}</dt>
                    <dd className="text-sm bg-muted/50 p-3 rounded-lg">{order.internalComment}</dd>
                  </div>
                )}
                {order.supplierComment && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">{t('supplierOrders.supplierComment')}</dt>
                    <dd className="text-sm bg-muted/50 p-3 rounded-lg">{order.supplierComment}</dd>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t('supplierOrders.status')} />
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('supplierOrders.orderStatus')}</p>
                <span className={status.className}>{status.label}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('supplierOrders.createdBy')}</p>
                <p>{order.creatorName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('supplierOrders.lastUpdated')}</p>
                <p>{new Date(order.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('supplierOrders.totals')} />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('supplierOrders.subtotalHT')}</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(order.totalHt || 0)}</dd>
                </div>
                {order.discountAmount && order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>{t('supplierOrders.discount')}</dt>
                    <dd>-{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(order.discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('supplierOrders.vat')}</dt>
                  <dd>
                    {order.vatRate ? `${order.vatRate}%` : '-'}
                  </dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>{t('supplierOrders.totalTTC')}</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(order.totalTtc || 0)}</dd>
                </div>
                {order.paidAmount && order.paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <dt>{t('supplierOrders.paid')}</dt>
                      <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(order.paidAmount)}</dd>
                    </div>
                    <div className="flex justify-between font-medium">
                      <dt>{t('supplierOrders.balance')}</dt>
                      <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(order.balanceDue)}</dd>
                    </div>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('supplierOrders.additionalInfo')} />
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('supplierOrders.society')}</dt>
                  <dd>{order.societyName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('supplierOrders.currency')}</dt>
                  <dd>{order.currencyCode || '-'}</dd>
                </div>
                {order.lineCount !== undefined && (
                  <div>
                    <dt className="text-sm text-muted-foreground">{t('supplierOrders.lineCount')}</dt>
                    <dd>{order.lineCount}</dd>
                  </div>
                )}
                {order.totalQuantity !== undefined && (
                  <div>
                    <dt className="text-sm text-muted-foreground">{t('supplierOrders.totalQuantity')}</dt>
                    <dd>{order.totalQuantity}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold">{t('supplierOrders.cancelOrder')}</h3>
            <p className="text-sm text-muted-foreground">{t('supplierOrders.cancelConfirmMessage')}</p>
            <div>
              <label className="block text-sm font-medium mb-1">{t('supplierOrders.cancelReason')}</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder={t('supplierOrders.cancelReasonPlaceholder')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCancelDialog(false)} className="btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelMutation.isPending}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                {cancelMutation.isPending ? t('common.loading') : t('supplierOrders.confirmCancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        itemName={order.code || order.displayName || 'this order'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
