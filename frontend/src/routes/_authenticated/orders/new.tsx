import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'

export const Route = createFileRoute('/_authenticated/orders/new')({
  component: NewOrderPage,
})

function NewOrderPage() {
  const navigate = useNavigate()

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/orders' as any })} className="btn-secondary">
        Cancel
      </button>
      <button className="btn-primary">Save Order</button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title="New Order"
        description="Create a new sales order"
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Order Details" />
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Reference</label>
                    <input type="text" className="input w-full" placeholder="Auto-generated" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Client *</label>
                    <select className="input w-full">
                      <option value="">Select a client...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Order Date *</label>
                    <input type="date" className="input w-full" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Required Date</label>
                    <input type="date" className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Currency</label>
                    <select className="input w-full">
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">From Quote</label>
                    <select className="input w-full">
                      <option value="">None</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Shipping Address</label>
                  <textarea className="input w-full" rows={3} placeholder="Enter shipping address..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Notes</label>
                  <textarea className="input w-full" rows={2} placeholder="Order notes..." />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader 
              title="Line Items" 
              action={<button className="btn-secondary text-sm">+ Add Line</button>}
            />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">Product</th>
                    <th className="text-left py-2 text-sm text-muted-foreground">Description</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Qty</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Unit Price</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No line items yet. Click "Add Line" to add products.
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" />
            <CardContent>
              <select className="input w-full">
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Totals" />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>€0.00</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd>€0.00</dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>Total</dt>
                  <dd>€0.00</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
