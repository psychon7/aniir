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
import { useDownloadInvoicePdf, useUpdateInvoiceDiscount } from '@/hooks/useInvoices'
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
  const downloadPdf = useDownloadInvoicePdf()
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
        disabled={downloadPdf.isPending}
        onClick={() => downloadPdf.mutate(parseInt(invoiceId, 10))}
      >
        {downloadPdf.isPending ? 'Generating...' : 'Download PDF'}
      </button>
      <button className="btn-secondary">Send by Email</button>
      <button className="btn-primary">Record Payment</button>
    </div>
  )

  const balance = invoice.totalAmount - (invoice.paidAmount || 0)
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && balance > 0

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
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">Image</th>
                    <th className="text-left py-2 text-sm text-muted-foreground">Description</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Qty</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Unit Price</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">VAT</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines?.map((line: any, index: number) => (
                    <tr key={index} className="border-b">
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
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
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
