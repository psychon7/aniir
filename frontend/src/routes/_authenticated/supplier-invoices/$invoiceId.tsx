import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import {
  useSupplierInvoice,
  useDeleteSupplierInvoice,
  useMarkSupplierInvoicePaid,
  useMarkSupplierInvoiceUnpaid,
  useStartProduction,
  useCompleteProduction,
} from '@/hooks/useSupplierInvoices'

export const Route = createFileRoute('/_authenticated/supplier-invoices/$invoiceId')({
  component: SupplierInvoiceDetailPage,
})

function SupplierInvoiceDetailPage() {
  const { invoiceId } = Route.useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const [isDeleting, setIsDeleting] = useState(false)
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false)
  const [bankReceiptNumber, setBankReceiptNumber] = useState('')

  const { data: invoice, isLoading } = useSupplierInvoice(Number(invoiceId))
  const deleteMutation = useDeleteSupplierInvoice()
  const markPaidMutation = useMarkSupplierInvoicePaid()
  const markUnpaidMutation = useMarkSupplierInvoiceUnpaid()
  const startProductionMutation = useStartProduction()
  const completeProductionMutation = useCompleteProduction()

  const handleDelete = () => {
    deleteMutation.mutate(Number(invoiceId), {
      onSuccess: () => {
        success(t('supplierInvoices.messages.deleteSuccess'), t('supplierInvoices.messages.deleteSuccess'))
        navigate({ to: '/supplier-invoices' as any })
      },
      onError: () => {
        showError(t('common.error'), t('common.errorOccurred'))
      },
    })
  }

  const handleMarkPaid = () => {
    markPaidMutation.mutate(
      {
        invoiceId: Number(invoiceId),
        data: { bank_receipt_number: bankReceiptNumber || undefined },
      },
      {
        onSuccess: () => {
          success(t('supplierInvoices.messages.markPaidSuccess'), t('supplierInvoices.messages.markPaidSuccess'))
          setShowMarkPaidModal(false)
          setBankReceiptNumber('')
        },
        onError: () => {
          showError(t('common.error'), t('common.errorOccurred'))
        },
      }
    )
  }

  const handleMarkUnpaid = () => {
    markUnpaidMutation.mutate(
      {
        invoiceId: Number(invoiceId),
        data: { reason: 'Payment reversed or corrected' },
      },
      {
        onSuccess: () => {
          success(t('supplierInvoices.messages.markUnpaidSuccess'), t('supplierInvoices.messages.markUnpaidSuccess'))
        },
        onError: () => {
          showError(t('common.error'), t('common.errorOccurred'))
        },
      }
    )
  }

  const handleStartProduction = () => {
    startProductionMutation.mutate(
      { invoiceId: Number(invoiceId) },
      {
        onSuccess: () => {
          success(t('supplierInvoices.messages.productionStarted'), t('supplierInvoices.messages.productionStarted'))
        },
        onError: () => {
          showError(t('common.error'), t('common.errorOccurred'))
        },
      }
    )
  }

  const handleCompleteProduction = () => {
    completeProductionMutation.mutate(
      { invoiceId: Number(invoiceId) },
      {
        onSuccess: () => {
          success(t('supplierInvoices.messages.productionCompleted'), t('supplierInvoices.messages.productionCompleted'))
        },
        onError: () => {
          showError(t('common.error'), t('common.errorOccurred'))
        },
      }
    )
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

  if (!invoice) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">{t('common.notFound', 'Invoice not found')}</h2>
          <button onClick={() => navigate({ to: '/supplier-invoices' as any })} className="btn-primary mt-4">
            {t('common.back')}
          </button>
        </div>
      </PageContainer>
    )
  }

  const getPaymentStatusBadge = () => {
    if (invoice.isPaid) {
      return <StatusBadge status="Paid" />
    }
    return <StatusBadge status="Unpaid" />
  }

  const getProductionStatusBadge = () => {
    if (invoice.productionComplete) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          {t('common.completed', 'Completed')}
        </span>
      )
    }
    if (invoice.productionStarted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {t('common.inProgress', 'In Progress')}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
        {t('common.pending', 'Pending')}
      </span>
    )
  }

  const actions = (
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => navigate({ to: '/supplier-invoices' as any })} className="btn-secondary">
        {t('common.back')}
      </button>

      {/* Payment Actions */}
      {!invoice.isPaid ? (
        <button
          onClick={() => setShowMarkPaidModal(true)}
          className="btn-primary"
          disabled={markPaidMutation.isPending}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
          {t('supplierInvoices.markPaid')}
        </button>
      ) : (
        <button
          onClick={handleMarkUnpaid}
          className="btn-secondary"
          disabled={markUnpaidMutation.isPending}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t('supplierInvoices.markUnpaid')}
        </button>
      )}

      {/* Production Actions */}
      {!invoice.productionStarted && !invoice.productionComplete && (
        <button
          onClick={handleStartProduction}
          className="btn-secondary"
          disabled={startProductionMutation.isPending}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('supplierInvoices.startProduction')}
        </button>
      )}

      {invoice.productionStarted && !invoice.productionComplete && (
        <button
          onClick={handleCompleteProduction}
          className="btn-secondary"
          disabled={completeProductionMutation.isPending}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('supplierInvoices.completeProduction')}
        </button>
      )}

      <button
        onClick={() => setIsDeleting(true)}
        className="btn-secondary text-destructive hover:bg-destructive/10"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {t('common.delete')}
      </button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={`${t('supplierInvoices.title')} ${invoice.code || `#${invoice.id}`}`}
        description={invoice.supplierName ? `${t('suppliers.supplier', 'Supplier')}: ${invoice.supplierName}` : undefined}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details Card */}
          <Card>
            <CardHeader title={t('common.details')} />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('supplierInvoices.columns.reference')}</dt>
                  <dd className="font-mono">{invoice.code || `#${invoice.id}`}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('supplierInvoices.columns.supplier')}</dt>
                  <dd className="font-medium">{invoice.supplierName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('common.createdAt', 'Created')}</dt>
                  <dd>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('common.updatedAt', 'Updated')}</dt>
                  <dd>{invoice.updatedAt ? new Date(invoice.updatedAt).toLocaleDateString() : '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('common.currency', 'Currency')}</dt>
                  <dd>{invoice.currencyCode || invoice.currencySymbol || 'EUR'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('products.vatRate', 'VAT Rate')}</dt>
                  <dd>{invoice.vatRate ? `${invoice.vatRate}%` : '-'}</dd>
                </div>
                {invoice.supplierOrderCode && (
                  <div className="col-span-2">
                    <dt className="text-sm text-muted-foreground">{t('nav.supplierOrders', 'Supplier Order')}</dt>
                    <dd className="font-mono text-sm">{invoice.supplierOrderCode}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardHeader title={t('invoices.lines', 'Line Items')} />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('common.description', 'Description')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('products.quantity', 'Qty')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('products.unitPrice', 'Unit Price')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('invoices.discount', 'Discount')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('invoices.total', 'Total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines && invoice.lines.length > 0 ? (
                    invoice.lines.map((line, index) => (
                      <tr key={line.id || index} className="border-b">
                        <td className="py-3">
                          <p className="font-medium">{line.description || '-'}</p>
                        </td>
                        <td className="text-right py-3">{line.quantity || 0}</td>
                        <td className="text-right py-3">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: invoice.currencyCode || 'EUR',
                          }).format(line.unitPrice || 0)}
                        </td>
                        <td className="text-right py-3 text-sm text-muted-foreground">
                          {line.discountAmount
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: invoice.currencyCode || 'EUR',
                              }).format(line.discountAmount)
                            : '-'}
                        </td>
                        <td className="text-right py-3 font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: invoice.currencyCode || 'EUR',
                          }).format(line.lineTotal || line.totalPrice || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t('common.noData', 'No line items')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Comments Card */}
          {(invoice.internalComment || invoice.supplierComment) && (
            <Card>
              <CardHeader title={t('common.notes')} />
              <CardContent>
                <div className="space-y-4">
                  {invoice.internalComment && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t('clients.internalNotes', 'Internal Notes')}
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{invoice.internalComment}</p>
                    </div>
                  )}
                  {invoice.supplierComment && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t('common.supplierNotes', 'Supplier Notes')}
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{invoice.supplierComment}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Payment Status Card */}
          <Card>
            <CardHeader title={t('supplierInvoices.columns.paymentStatus')} />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('common.status')}</span>
                  {getPaymentStatusBadge()}
                </div>
                {invoice.bankReceiptNumber && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common.receipt', 'Receipt #')}</span>
                    <p className="font-mono text-sm">{invoice.bankReceiptNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Production Status Card */}
          <Card>
            <CardHeader title={t('common.production', 'Production Status')} />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('common.status')}</span>
                  {getProductionStatusBadge()}
                </div>
                {invoice.productionStartDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common.startedAt', 'Started')}</span>
                    <p className="text-sm">{new Date(invoice.productionStartDate).toLocaleDateString()}</p>
                  </div>
                )}
                {invoice.productionCompleteDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common.completedAt', 'Completed')}</span>
                    <p className="text-sm">{new Date(invoice.productionCompleteDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Totals Card */}
          <Card>
            <CardHeader title={t('invoices.total', 'Totals')} />
            <CardContent>
              <dl className="space-y-2">
                {invoice.totalHt !== undefined && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('supplierInvoices.columns.totalHT', 'Total (excl. tax)')}</dt>
                    <dd>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: invoice.currencyCode || 'EUR',
                      }).format(invoice.totalHt)}
                    </dd>
                  </div>
                )}
                {invoice.discountAmount !== undefined && invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <dt>{t('invoices.discount')}</dt>
                    <dd>
                      -{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: invoice.currencyCode || 'EUR',
                      }).format(invoice.discountAmount)}
                    </dd>
                  </div>
                )}
                {invoice.totalTtc !== undefined && (
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <dt>{t('supplierInvoices.columns.totalTTC', 'Total (incl. tax)')}</dt>
                    <dd>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: invoice.currencyCode || 'EUR',
                      }).format(invoice.totalTtc)}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Creator Info Card */}
          {invoice.creatorName && (
            <Card>
              <CardHeader title={t('common.createdBy', 'Created By')} />
              <CardContent>
                <p className="text-sm">{invoice.creatorName}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleDelete}
        itemName={invoice.code || invoice.displayName || 'this invoice'}
        isLoading={deleteMutation.isPending}
      />

      {/* Mark as Paid Modal */}
      {showMarkPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('supplierInvoices.markPaid')}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t('common.receipt', 'Bank Receipt Number')} ({t('common.optional')})
              </label>
              <input
                type="text"
                value={bankReceiptNumber}
                onChange={(e) => setBankReceiptNumber(e.target.value)}
                className="input w-full"
                placeholder={t('common.enterValue', 'Enter receipt number...')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowMarkPaidModal(false)
                  setBankReceiptNumber('')
                }}
                className="btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleMarkPaid}
                className="btn-primary"
                disabled={markPaidMutation.isPending}
              >
                {markPaidMutation.isPending ? t('common.loading') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
