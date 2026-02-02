import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'

export const Route = createFileRoute('/_authenticated/deliveries/new')({
  component: NewDeliveryPage,
})

function NewDeliveryPage() {
  const navigate = useNavigate()

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/deliveries' as any })} className="btn-secondary">
        Cancel
      </button>
      <button className="btn-primary">Save Delivery</button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title="New Delivery"
        description="Create a new delivery"
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Delivery Details" />
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Reference</label>
                    <input type="text" className="input w-full" placeholder="Auto-generated" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Order *</label>
                    <select className="input w-full">
                      <option value="">Select an order...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Scheduled Date *</label>
                    <input type="date" className="input w-full" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Carrier</label>
                    <select className="input w-full">
                      <option value="">Select a carrier...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Tracking Number</label>
                    <input type="text" className="input w-full" placeholder="Enter tracking number..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Packages</label>
                    <input type="number" className="input w-full" placeholder="1" min="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Weight (kg)</label>
                    <input type="number" className="input w-full" placeholder="0.00" step="0.01" min="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Shipping Address</label>
                  <textarea className="input w-full" rows={3} placeholder="Enter shipping address..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Notes</label>
                  <textarea className="input w-full" rows={2} placeholder="Delivery notes..." />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Items to Deliver" />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">Product</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Ordered</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">Already Delivered</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">To Deliver</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      Select an order to see items to deliver.
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
                <option value="preparing">Preparing</option>
                <option value="ready">Ready to Ship</option>
                <option value="shipped">Shipped</option>
              </select>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
