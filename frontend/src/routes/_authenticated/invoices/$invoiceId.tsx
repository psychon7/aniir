import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { DocumentAttachments } from '@/components/attachments'
import { AttachFileButton } from '@/components/attachments'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { useToast } from '@/components/ui/feedback/Toast'
import { useUpdateInvoiceDiscount } from '@/hooks/useInvoices'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/invoices/$invoiceId')({
  component: InvoiceDetailPage,
})

function InvoiceDetailPage() {
  const { invoiceId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([])
  const [isLineActionPending, setIsLineActionPending] = useState(false)
  const updateDiscountMutation = useUpdateInvoiceDiscount()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await apiClient.get(`/invoices/${invoiceId}`)
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

  if (!invoice) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Invoice not found</h2>
          <button onClick={() => navigate({ to: '/invoices' as any })} className="btn-primary mt-4">
            Back to Invoices
          </button>
        </div>
      </PageContainer>
    )
  }

  const invoicingSnapshot = invoice.invoicingContactSnapshot

  const openPdfUtility = (mode: 'pdf-viewer' | 'pdf-download') => {
    const safeReference = invoice.reference || invoiceId
    navigate({
      to: '/accounting/export' as any,
      search: {
        mode,
        source: `/invoices/${invoiceId}/pdf`,
        title: `Invoice ${safeReference}`,
        filename: `invoice-${safeReference}.pdf`,
      } as any,
    })
  }

  const openInspectionPdf = () => {
    const safeReference = invoice.reference || invoiceId
    navigate({
      to: '/accounting/export' as any,
      search: {
        mode: 'pdf-viewer',
        source: `/invoices/${invoiceId}/inspection-form-pdf`,
        title: `Inspection Form ${safeReference}`,
        filename: `invoice-${safeReference}-inspection.pdf`,
      } as any,
    })
  }

  const moveLine = async (lineId: number, direction: 'up' | 'down') => {
    const currentIds = (invoice.lines || []).map((line: any) => Number(line.id)).filter(Boolean)
    const fromIndex = currentIds.indexOf(lineId)
    if (fromIndex < 0) return

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= currentIds.length) return

    const reordered = [...currentIds]
    ;[reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]]

    try {
      setIsLineActionPending(true)
      await apiClient.post(`/invoices/${invoiceId}/lines/reorder`, {
        line_ids: reordered,
      })
      await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    } catch {
      showError('Error', 'Unable to reorder line items.')
    } finally {
      setIsLineActionPending(false)
    }
  }

  const mergeSelectedLines = async () => {
    if (selectedLineIds.length < 2) {
      showError('Error', 'Select at least 2 lines to merge.')
      return
    }

    try {
      setIsLineActionPending(true)
      const response = await apiClient.post(`/invoices/${invoiceId}/lines/merge`, {
        line_ids: selectedLineIds,
      })
      const primaryLineId = response?.data?.primaryLineId
      setSelectedLineIds(primaryLineId ? [primaryLineId] : [])
      await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      success('Success', 'Selected lines merged.')
    } catch {
      showError('Error', 'Unable to merge selected lines.')
    } finally {
      setIsLineActionPending(false)
    }
  }

  const balance = invoice.totalAmount - (invoice.paidAmount || 0)
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && balance > 0

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/invoices' as any })} className="btn-secondary">
        Back
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          setDiscountPercentage(invoice.discountPercentage != null ? String(invoice.discountPercentage) : '')
          setDiscountAmount(invoice.discountAmount != null ? String(invoice.discountAmount) : '')
          setIsDiscountModalOpen(true)
        }}
      >
        Discount
      </button>
      <AttachFileButton
        entityType="INVOICE"
        entityId={parseInt(invoiceId, 10)}
        variant="outline"
      />
      <button
        className="btn-secondary"
        onClick={() => openPdfUtility('pdf-viewer')}
      >
        Preview PDF
      </button>
      <button
        className="btn-secondary"
        onClick={() => openPdfUtility('pdf-download')}
      >
        Download PDF
      </button>
      {invoice.lines?.length > 0 && (
        <button className="btn-secondary" onClick={openInspectionPdf}>
          Inspection Form PDF
        </button>
      )}
      <button
        className="btn-secondary"
        onClick={() => {
          setRecipientEmail(invoice?.invoicingContactSnapshot?.email || '')
          setSendMessage('')
          setIsSendModalOpen(true)
        }}
      >
        Send by Email
      </button>
      <button
        className="btn-primary"
        onClick={() => {
          const remaining = balance > 0 ? balance : 0
          setPaymentAmount(remaining ? String(remaining.toFixed(2)) : '')
          setPaymentReference('')
          setIsPaymentModalOpen(true)
        }}
      >
        Record Payment
      </button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={`Invoice ${invoice.reference}`}
        description={`For ${invoice.clientName}`}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Invoice Details" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Reference</dt>
                  <dd className="font-mono">{invoice.reference}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Client</dt>
                  <dd className="font-medium">{invoice.clientName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Invoice Date</dt>
                  <dd>{new Date(invoice.invoiceDate).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Due Date</dt>
                  <dd className={isOverdue ? 'text-destructive font-medium' : ''}>
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                    {isOverdue && ' (Overdue)'}
                  </dd>
                </div>
                {invoice.orderReference && (
                  <div>
                    <dt className="text-sm text-muted-foreground">From Order</dt>
                    <dd className="font-mono text-sm">{invoice.orderReference}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {invoicingSnapshot && (
            <Card>
              <CardHeader title="Billing Snapshot" />
              <CardContent>
                <AddressSnapshotCard title="Commercial / Billing" snapshot={invoicingSnapshot} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="Line Items" />
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
                    <th className="text-left py-2 text-sm text-muted-foreground">Description</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Qty</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Unit Price</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">VAT</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Total</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-28">Order</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines?.map((line: any, index: number) => (
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
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(line.unitPrice)}
                      </td>
                      <td className="text-right py-3 text-sm text-muted-foreground">
                        {line.vatRate ? `${line.vatRate}%` : '-'}
                      </td>
                      <td className="text-right py-3 font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(line.lineTotal)}
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
                            disabled={isLineActionPending || index === (invoice.lines?.length || 0) - 1}
                          >
                            Down
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No line items
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
              <StatusBadge status={invoice.statusName} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Totals" />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(invoice.subtotal || invoice.totalAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">VAT</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(invoice.vatAmount || 0)}</dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>Total</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(invoice.totalAmount)}</dd>
                </div>
                <div className="flex justify-between text-green-600">
                  <dt>Paid</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(invoice.paidAmount || 0)}</dd>
                </div>
                <div className={`flex justify-between font-medium ${balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  <dt>Balance</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(balance)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {invoice.paidAt && (
            <Card>
              <CardHeader title="Payment Info" />
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Paid On</dt>
                    <dd>{new Date(invoice.paidAt).toLocaleDateString()}</dd>
                  </div>
                  {invoice.paymentReference && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Reference</dt>
                      <dd className="font-mono text-sm">{invoice.paymentReference}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Attachments Section */}
          <DocumentAttachments
            entityType="INVOICE"
            entityId={parseInt(invoiceId, 10)}
          />
        </div>
      </div>

      <FormModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title="Send Invoice"
        description="Send invoice PDF by email."
        footer={
          <FormModalFooter
            onCancel={() => setIsSendModalOpen(false)}
            onSubmit={async () => {
              try {
                await apiClient.post(`/invoices/${invoiceId}/send`, {
                  recipient_email: recipientEmail || undefined,
                  message: sendMessage || undefined,
                })
                await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
                success('Invoice sent', 'Invoice has been processed for sending.')
                setIsSendModalOpen(false)
              } catch {
                showError('Error', 'Unable to send invoice.')
              }
            }}
            submitText="Send"
            isSubmitting={false}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <FormInput
            type="email"
            label="Recipient Email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="client@example.com"
          />
          <FormInput
            label="Message"
            value={sendMessage}
            onChange={(e) => setSendMessage(e.target.value)}
            placeholder="Please find attached your invoice."
          />
        </div>
      </FormModal>

      <FormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        description="Register a payment against this invoice."
        footer={
          <FormModalFooter
            onCancel={() => setIsPaymentModalOpen(false)}
            onSubmit={async () => {
              try {
                const amount = Number(paymentAmount)
                if (!amount || amount <= 0) {
                  showError('Error', 'Payment amount must be greater than zero.')
                  return
                }
                await apiClient.post(`/invoices/${invoiceId}/payments`, {
                  amount,
                  payment_date: new Date().toISOString(),
                  payment_reference: paymentReference || undefined,
                })
                await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
                success('Payment recorded', 'Payment has been recorded on this invoice.')
                setIsPaymentModalOpen(false)
              } catch {
                showError('Error', 'Unable to record payment.')
              }
            }}
            submitText="Record Payment"
            isSubmitting={false}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            type="number"
            label="Amount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
          />
          <FormInput
            label="Payment Reference"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Bank transfer ref"
          />
        </div>
      </FormModal>

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
                  id: Number(invoiceId),
                  request: {
                    discountPercentage: discountPercentage !== '' ? Number(discountPercentage) : undefined,
                    discountAmount: discountAmount !== '' ? Number(discountAmount) : undefined,
                  },
                })
                await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
                success('Discount updated', 'Invoice discount has been updated.')
                setIsDiscountModalOpen(false)
              } catch {
                showError('Error', 'Unable to update invoice discount.')
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
            {[snapshot.firstName, snapshot.lastName].filter(Boolean).join(' ')}
          </p>
          <p>{[snapshot.address1, snapshot.address2].filter(Boolean).join(' ') || '-'}</p>
          <p>{[snapshot.postcode, snapshot.city, snapshot.country].filter(Boolean).join(' ') || '-'}</p>
          <p>{snapshot.phone || snapshot.mobile || '-'}</p>
          <p>{snapshot.email || '-'}</p>
        </div>
      )}
    </div>
  )
}
