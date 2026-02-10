import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
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
import { useOrdersByQuote } from '@/hooks/useOrders'
import { useInvoicesByQuote } from '@/hooks/useInvoices'
import {
  useConvertQuoteToOrder,
  useUpdateQuoteDiscount,
  useAddQuoteLine,
  useUpdateQuoteLine,
  useDeleteQuoteLine,
} from '@/hooks/useQuotes'
import { LineType } from '@/types/quote'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/quotes/$quoteId')({
  component: QuoteDetailPage,
})

interface LineFormState {
  description: string
  quantity: string
  unitPrice: string
  discount: string
}

const emptyLineForm: LineFormState = {
  description: '',
  quantity: '1',
  unitPrice: '0',
  discount: '0',
}

function QuoteDetailPage() {
  const { quoteId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([])
  const [isLineActionPending, setIsLineActionPending] = useState(false)

  // Line management state
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false)
  const [isEditLineModalOpen, setIsEditLineModalOpen] = useState(false)
  const [isDeleteLineDialogOpen, setIsDeleteLineDialogOpen] = useState(false)
  const [editingLineId, setEditingLineId] = useState<number | null>(null)
  const [deletingLineId, setDeletingLineId] = useState<number | null>(null)
  const [lineForm, setLineForm] = useState<LineFormState>(emptyLineForm)

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const response = await apiClient.get(`/quotes/${quoteId}`)
      return response.data
    },
  })
  const { data: orders = [] } = useOrdersByQuote(Number(quoteId))
  const { data: invoices = [] } = useInvoicesByQuote(Number(quoteId))
  const convertMutation = useConvertQuoteToOrder()
  const updateDiscountMutation = useUpdateQuoteDiscount()
  const addLineMutation = useAddQuoteLine()
  const updateLineMutation = useUpdateQuoteLine()
  const deleteLineMutation = useDeleteQuoteLine()

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

  if (!quote) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Quote not found</h2>
          <button onClick={() => navigate({ to: '/quotes' as any })} className="btn-primary mt-4">
            Back to Quotes
          </button>
        </div>
      </PageContainer>
    )
  }

  const invoicingSnapshot = quote.invoicingContactSnapshot
  const deliverySnapshot = quote.deliveryContactSnapshot
  const currencyCode = quote.currency || 'EUR'

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount)

  const openPdfUtility = (mode: 'pdf-viewer' | 'pdf-download') => {
    const safeReference = quote.reference || quoteId
    navigate({
      to: '/accounting/export' as any,
      search: {
        mode,
        source: `/quotes/${quoteId}/pdf`,
        title: `Quote ${safeReference}`,
        filename: `quote-${safeReference}.pdf`,
      } as any,
    })
  }

  const moveLine = async (lineId: number, direction: 'up' | 'down') => {
    const currentIds = (quote.lines || []).map((line: any) => Number(line.id)).filter(Boolean)
    const fromIndex = currentIds.indexOf(lineId)
    if (fromIndex < 0) return

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= currentIds.length) return

    const reordered = [...currentIds]
    ;[reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]]

    try {
      setIsLineActionPending(true)
      await apiClient.post(`/quotes/${quoteId}/lines/reorder`, {
        line_ids: reordered,
      })
      await queryClient.invalidateQueries({ queryKey: ['quote', quoteId] })
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
      const response = await apiClient.post(`/quotes/${quoteId}/lines/merge`, {
        line_ids: selectedLineIds,
      })
      const primaryLineId = response?.data?.primaryLineId
      setSelectedLineIds(primaryLineId ? [primaryLineId] : [])
      await queryClient.invalidateQueries({ queryKey: ['quote', quoteId] })
      success('Success', 'Selected lines merged.')
    } catch {
      showError('Error', 'Unable to merge selected lines.')
    } finally {
      setIsLineActionPending(false)
    }
  }

  // Line management handlers
  const openAddLineModal = () => {
    setLineForm(emptyLineForm)
    setIsAddLineModalOpen(true)
  }

  const openEditLineModal = (line: any) => {
    setEditingLineId(Number(line.id))
    setLineForm({
      description: line.description || line.productName || '',
      quantity: String(line.quantity || 1),
      unitPrice: String(line.unitPrice || 0),
      discount: String(line.discountPercentage || 0),
    })
    setIsEditLineModalOpen(true)
  }

  const openDeleteLineDialog = (lineId: number) => {
    setDeletingLineId(lineId)
    setIsDeleteLineDialogOpen(true)
  }

  const handleAddLine = async () => {
    if (!lineForm.description.trim()) {
      showError('Error', 'Description is required.')
      return
    }

    try {
      await addLineMutation.mutateAsync({
        quoteId: Number(quoteId),
        data: {
          description: lineForm.description,
          quantity: Number(lineForm.quantity) || 1,
          unitPrice: Number(lineForm.unitPrice) || 0,
          discountPercentage: Number(lineForm.discount) || undefined,
          lineTypeId: LineType.SALE,
        },
      })
      await queryClient.invalidateQueries({ queryKey: ['quote', quoteId] })
      success('Line added', 'Quote line has been added.')
      setIsAddLineModalOpen(false)
      setLineForm(emptyLineForm)
    } catch {
      showError('Error', 'Unable to add line.')
    }
  }

  const handleUpdateLine = async () => {
    if (!editingLineId) return
    if (!lineForm.description.trim()) {
      showError('Error', 'Description is required.')
      return
    }

    try {
      await updateLineMutation.mutateAsync({
        quoteId: Number(quoteId),
        lineId: editingLineId,
        data: {
          description: lineForm.description,
          quantity: Number(lineForm.quantity) || 1,
          unitPrice: Number(lineForm.unitPrice) || 0,
          discountPercentage: Number(lineForm.discount) || undefined,
        },
      })
      await queryClient.invalidateQueries({ queryKey: ['quote', quoteId] })
      success('Line updated', 'Quote line has been updated.')
      setIsEditLineModalOpen(false)
      setEditingLineId(null)
      setLineForm(emptyLineForm)
    } catch {
      showError('Error', 'Unable to update line.')
    }
  }

  const handleDeleteLine = async () => {
    if (!deletingLineId) return

    try {
      await deleteLineMutation.mutateAsync({
        quoteId: Number(quoteId),
        lineId: deletingLineId,
      })
      await queryClient.invalidateQueries({ queryKey: ['quote', quoteId] })
      setSelectedLineIds((prev) => prev.filter((id) => id !== deletingLineId))
      success('Line deleted', 'Quote line has been removed.')
      setIsDeleteLineDialogOpen(false)
      setDeletingLineId(null)
    } catch {
      showError('Error', 'Unable to delete line.')
    }
  }

  // Recalculate totals from lines
  const computedSubtotal = (quote.lines || []).reduce(
    (sum: number, line: any) => sum + (line.lineTotal || 0),
    0
  )
  const computedTotal = computedSubtotal - (quote.discountAmount || 0)

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/quotes' as any })} className="btn-secondary">
        Back
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          setDiscountPercentage(quote.discountPercentage != null ? String(quote.discountPercentage) : '')
          setDiscountAmount(quote.discountAmount != null ? String(quote.discountAmount) : '')
          setIsDiscountModalOpen(true)
        }}
      >
        Discount
      </button>
      <AttachFileButton
        entityType="QUOTE"
        entityId={parseInt(quoteId, 10)}
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
      <button
        className="btn-primary"
        disabled={convertMutation.isPending}
        onClick={async () => {
          try {
            const result = await convertMutation.mutateAsync({ id: Number(quoteId) })
            success('Success', `Order ${result.orderReference} created`)
            navigate({ to: '/orders/$orderId' as any, params: { orderId: String(result.orderId) } })
          } catch (error) {
            showError('Error', error instanceof Error ? error.message : 'Failed to convert quote')
          }
        }}
      >
        {convertMutation.isPending ? 'Converting...' : 'Convert to Order'}
      </button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={`Quote ${quote.reference}`}
        description={`For ${quote.clientName}`}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Quote Details" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Reference</dt>
                  <dd className="font-mono">{quote.reference}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Client</dt>
                  <dd className="font-medium">{quote.clientName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Quote Date</dt>
                  <dd>{new Date(quote.quoteDate).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Valid Until</dt>
                  <dd>{quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : '-'}</dd>
                </div>
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
            <CardHeader
              title="Line Items"
              action={
                <button onClick={openAddLineModal} className="btn-secondary text-sm">
                  + Add Line
                </button>
              }
            />
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
                    <th className="text-left py-2 text-sm text-muted-foreground">Product</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Qty</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Unit Price</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Total</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lines?.map((line: any, index: number) => (
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
                        {formatCurrency(line.unitPrice)}
                      </td>
                      <td className="text-right py-3 font-medium">
                        {formatCurrency(line.lineTotal)}
                      </td>
                      <td className="text-right py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit button */}
                          <button
                            type="button"
                            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            onClick={() => openEditLineModal(line)}
                            disabled={isLineActionPending}
                            title="Edit line"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          {/* Delete button */}
                          <button
                            type="button"
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => openDeleteLineDialog(Number(line.id))}
                            disabled={isLineActionPending}
                            title="Delete line"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                          {/* Reorder buttons */}
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
                            disabled={isLineActionPending || index === (quote.lines?.length || 0) - 1}
                          >
                            Down
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No line items. Click "Add Line" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Orders Section */}
          <Card>
            <CardHeader
              title="Orders"
              action={
                <Link
                  to="/orders/new"
                  search={{ quoteId: Number(quoteId) }}
                  className="text-sm text-primary hover:underline"
                >
                  Create Order
                </Link>
              }
            />
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              ) : (
                <div className="divide-y divide-border">
                  {orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      to="/orders/$orderId"
                      params={{ orderId: String(order.id) }}
                      className="block py-3 hover:bg-accent/50 -mx-4 px-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm">{order.reference}</p>
                          <p className="text-xs text-muted-foreground">{order.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(order.totalAmount || 0)}
                          </p>
                          <StatusBadge status={order.statusName || 'Pending'} />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {orders.length > 5 && (
                    <p className="text-sm text-muted-foreground pt-3">
                      +{orders.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices Section */}
          <Card>
            <CardHeader
              title="Invoices"
              action={
                <Link
                  to="/invoices/new"
                  search={{ quoteId: Number(quoteId) }}
                  className="text-sm text-primary hover:underline"
                >
                  Create Invoice
                </Link>
              }
            />
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet</p>
              ) : (
                <div className="divide-y divide-border">
                  {invoices.slice(0, 5).map((invoice) => (
                    <Link
                      key={invoice.id}
                      to="/invoices/$invoiceId"
                      params={{ invoiceId: String(invoice.id) }}
                      className="block py-3 hover:bg-accent/50 -mx-4 px-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm">{invoice.reference}</p>
                          <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'EUR' }).format(invoice.totalAmount || 0)}
                          </p>
                          <StatusBadge status={invoice.statusName || 'Pending'} />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {invoices.length > 5 && (
                    <p className="text-sm text-muted-foreground pt-3">
                      +{invoices.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" />
            <CardContent>
              <StatusBadge status={quote.statusName} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Totals" />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatCurrency(computedSubtotal || quote.subtotal || quote.totalAmount)}</dd>
                </div>
                {(quote.discountAmount > 0) && (
                  <div className="flex justify-between text-green-600">
                    <dt>Discount</dt>
                    <dd>-{formatCurrency(quote.discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd>{formatCurrency(quote.taxAmount || 0)}</dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>Total</dt>
                  <dd>{formatCurrency(computedTotal || quote.totalAmount)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <DocumentAttachments
            entityType="QUOTE"
            entityId={parseInt(quoteId, 10)}
          />
        </div>
      </div>

      {/* Discount Modal */}
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
                  id: Number(quoteId),
                  request: {
                    discountPercentage: discountPercentage !== '' ? Number(discountPercentage) : undefined,
                    discountAmount: discountAmount !== '' ? Number(discountAmount) : undefined,
                  },
                })
                await queryClient.invalidateQueries({ queryKey: ['quote', quoteId] })
                success('Discount updated', 'Quote discount has been updated.')
                setIsDiscountModalOpen(false)
              } catch {
                showError('Error', 'Unable to update quote discount.')
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

      {/* Add Line Modal */}
      <FormModal
        isOpen={isAddLineModalOpen}
        onClose={() => setIsAddLineModalOpen(false)}
        title="Add Line Item"
        description="Add a new line to this quote."
        footer={
          <FormModalFooter
            onCancel={() => setIsAddLineModalOpen(false)}
            onSubmit={handleAddLine}
            submitText="Add Line"
            isSubmitting={addLineMutation.isPending}
          />
        }
      >
        <div className="space-y-4">
          <FormInput
            label="Description"
            value={lineForm.description}
            onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })}
            placeholder="Line description..."
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              type="number"
              label="Quantity"
              value={lineForm.quantity}
              onChange={(e) => setLineForm({ ...lineForm, quantity: e.target.value })}
              min={1}
              step="1"
            />
            <FormInput
              type="number"
              label="Unit Price"
              value={lineForm.unitPrice}
              onChange={(e) => setLineForm({ ...lineForm, unitPrice: e.target.value })}
              min={0}
              step="0.01"
            />
            <FormInput
              type="number"
              label="Discount %"
              value={lineForm.discount}
              onChange={(e) => setLineForm({ ...lineForm, discount: e.target.value })}
              min={0}
              max={100}
              step="0.01"
            />
          </div>
          <div className="text-right text-sm text-muted-foreground">
            Line total: <span className="font-medium text-foreground">
              {formatCurrency(
                (Number(lineForm.quantity) || 0) *
                (Number(lineForm.unitPrice) || 0) *
                (1 - (Number(lineForm.discount) || 0) / 100)
              )}
            </span>
          </div>
        </div>
      </FormModal>

      {/* Edit Line Modal */}
      <FormModal
        isOpen={isEditLineModalOpen}
        onClose={() => {
          setIsEditLineModalOpen(false)
          setEditingLineId(null)
          setLineForm(emptyLineForm)
        }}
        title="Edit Line Item"
        description="Update the line item details."
        footer={
          <FormModalFooter
            onCancel={() => {
              setIsEditLineModalOpen(false)
              setEditingLineId(null)
              setLineForm(emptyLineForm)
            }}
            onSubmit={handleUpdateLine}
            submitText="Save Changes"
            isSubmitting={updateLineMutation.isPending}
          />
        }
      >
        <div className="space-y-4">
          <FormInput
            label="Description"
            value={lineForm.description}
            onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })}
            placeholder="Line description..."
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              type="number"
              label="Quantity"
              value={lineForm.quantity}
              onChange={(e) => setLineForm({ ...lineForm, quantity: e.target.value })}
              min={1}
              step="1"
            />
            <FormInput
              type="number"
              label="Unit Price"
              value={lineForm.unitPrice}
              onChange={(e) => setLineForm({ ...lineForm, unitPrice: e.target.value })}
              min={0}
              step="0.01"
            />
            <FormInput
              type="number"
              label="Discount %"
              value={lineForm.discount}
              onChange={(e) => setLineForm({ ...lineForm, discount: e.target.value })}
              min={0}
              max={100}
              step="0.01"
            />
          </div>
          <div className="text-right text-sm text-muted-foreground">
            Line total: <span className="font-medium text-foreground">
              {formatCurrency(
                (Number(lineForm.quantity) || 0) *
                (Number(lineForm.unitPrice) || 0) *
                (1 - (Number(lineForm.discount) || 0) / 100)
              )}
            </span>
          </div>
        </div>
      </FormModal>

      {/* Delete Line Confirmation Dialog */}
      <FormModal
        isOpen={isDeleteLineDialogOpen}
        onClose={() => {
          setIsDeleteLineDialogOpen(false)
          setDeletingLineId(null)
        }}
        title="Delete Line Item"
        description="Are you sure you want to delete this line item? This action cannot be undone."
        size="sm"
        footer={
          <FormModalFooter
            onCancel={() => {
              setIsDeleteLineDialogOpen(false)
              setDeletingLineId(null)
            }}
            onSubmit={handleDeleteLine}
            submitText="Delete"
            isSubmitting={deleteLineMutation.isPending}
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          This will permanently remove the line from this quote and recalculate totals.
        </p>
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
