import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/products/$productId')({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { productId } = Route.useParams()
  const navigate = useNavigate()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${productId}`)
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

  if (!product) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Product not found</h2>
          <button onClick={() => navigate({ to: '/products' as any })} className="btn-primary mt-4">
            Back to Products
          </button>
        </div>
      </PageContainer>
    )
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/products' as any })} className="btn-secondary">
        Back
      </button>
      <button className="btn-primary">Edit Product</button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={product.name}
        description={`Reference: ${product.reference}`}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Product Information" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Reference</dt>
                  <dd className="font-mono">{product.reference}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd>{product.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Category</dt>
                  <dd>{product.categoryName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Brand</dt>
                  <dd>{product.brandName || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm text-muted-foreground">Description</dt>
                  <dd>{product.description || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Pricing & Inventory" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Unit Price</dt>
                  <dd className="text-lg font-semibold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.unitPrice || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Cost Price</dt>
                  <dd className="text-lg font-semibold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.costPrice || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Stock Quantity</dt>
                  <dd className={`text-lg font-semibold ${product.stockQuantity < 10 ? 'text-destructive' : ''}`}>
                    {product.stockQuantity ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Unit of Measure</dt>
                  <dd>{product.unitOfMeasureName || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" />
            <CardContent>
              <StatusBadge status={product.isActive ? 'Active' : 'Inactive'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Metadata" />
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="text-sm">{new Date(product.createdAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Last Updated</dt>
                  <dd className="text-sm">{new Date(product.updatedAt || product.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
