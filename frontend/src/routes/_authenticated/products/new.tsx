import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'

export const Route = createFileRoute('/_authenticated/products/new')({
  component: NewProductPage,
})

function NewProductPage() {
  const navigate = useNavigate()

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/products' as any })} className="btn-secondary">
        Cancel
      </button>
      <button className="btn-primary">Save Product</button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title="New Product"
        description="Create a new product"
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Product Information" />
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Reference</label>
                    <input type="text" className="input w-full" placeholder="Auto-generated" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Name *</label>
                    <input type="text" className="input w-full" placeholder="Product name..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                    <select className="input w-full">
                      <option value="">Select a category...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Brand</label>
                    <select className="input w-full">
                      <option value="">Select a brand...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Unit of Measure</label>
                    <select className="input w-full">
                      <option value="">Select unit...</option>
                      <option value="unit">Unit</option>
                      <option value="kg">Kilogram</option>
                      <option value="m">Meter</option>
                      <option value="l">Liter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">VAT Rate</label>
                    <select className="input w-full">
                      <option value="20">20%</option>
                      <option value="10">10%</option>
                      <option value="5.5">5.5%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                  <textarea className="input w-full" rows={3} placeholder="Product description..." />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Pricing" />
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Purchase Price</label>
                  <input type="number" className="input w-full" placeholder="0.00" step="0.01" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Sale Price</label>
                  <input type="number" className="input w-full" placeholder="0.00" step="0.01" min="0" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Dimensions" />
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Weight (kg)</label>
                  <input type="number" className="input w-full" placeholder="0.00" step="0.01" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Length (cm)</label>
                  <input type="number" className="input w-full" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Width (cm)</label>
                  <input type="number" className="input w-full" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Height (cm)</label>
                  <input type="number" className="input w-full" placeholder="0" min="0" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" />
            <CardContent>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" className="rounded" defaultChecked />
                <label htmlFor="isActive" className="text-sm">Active</label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Stock" />
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Current Stock</label>
                  <input type="number" className="input w-full" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Minimum Stock</label>
                  <input type="number" className="input w-full" placeholder="0" min="0" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
