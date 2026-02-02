import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { DocumentAttachments } from '@/components/attachments'
import { AttachFileButton } from '@/components/attachments'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/quotes/$quoteId')({
  component: QuoteDetailPage,
})

function QuoteDetailPage() {
  const { quoteId } = Route.useParams()
  const navigate = useNavigate()

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const response = await apiClient.get(`/quotes/${quoteId}`)
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

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/quotes' as any })} className="btn-secondary">
        Back
      </button>
      <AttachFileButton
        entityType="QUOTE"
        entityId={parseInt(quoteId, 10)}
        variant="outline"
      />
      <button className="btn-secondary">Download PDF</button>
      <button className="btn-primary">Convert to Order</button>
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

          <Card>
            <CardHeader title="Line Items" />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">Product</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Qty</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Unit Price</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lines?.map((line: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-3">
                        <p className="font-medium">{line.productName || line.description}</p>
                        {line.description && line.productName && (
                          <p className="text-sm text-muted-foreground">{line.description}</p>
                        )}
                      </td>
                      <td className="text-right py-3">{line.quantity}</td>
                      <td className="text-right py-3">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD' }).format(line.unitPrice)}
                      </td>
                      <td className="text-right py-3 font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD' }).format(line.lineTotal)}
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
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
              <StatusBadge status={quote.statusName} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Totals" />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD' }).format(quote.subtotal || quote.totalAmount)}</dd>
                </div>
                {quote.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>Discount</dt>
                    <dd>-{new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD' }).format(quote.discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD' }).format(quote.taxAmount || 0)}</dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>Total</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD' }).format(quote.totalAmount)}</dd>
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
    </PageContainer>
  )
}
