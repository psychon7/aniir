import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import { EmptyStateError } from '@/components/ui/feedback/EmptyState'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { AttachFileButton, DocumentAttachments } from '@/components/attachments'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/products/$productId')({
  component: ProductDetailPage,
})

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function InfoItem({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value?: ReactNode
  mono?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-sm text-muted-foreground mb-1">{label}</dt>
      <dd className={`text-foreground ${mono ? 'font-mono text-sm' : ''}`}>
        {value ?? '-'}
      </dd>
    </div>
  )
}

function formatCurrency(amount?: number | null): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return '-'
  }
}

function formatDecimal(val?: number | string | null, unit?: string): string {
  if (val == null || val === '') return '-'
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return '-'
  return unit ? `${num} ${unit}` : String(num)
}

type ComponentType = 'DRIVER' | 'ACCESSORY' | 'OPTION'

interface ProductComponent {
  id: number
  productId: number
  componentProductId: number
  componentType: ComponentType
  quantity?: number
  isRequired: boolean
  order: number
  componentReference?: string
  componentName?: string
}

const componentTypeLabels: Record<ComponentType, string> = {
  DRIVER: 'Drivers',
  ACCESSORY: 'Accessories',
  OPTION: 'Options',
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function ProductDetailPage() {
  const { productId } = Route.useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [componentDrafts, setComponentDrafts] = useState<Record<ComponentType, { componentProductId: string; quantity: string; isRequired: boolean }>>({
    DRIVER: { componentProductId: '', quantity: '1', isRequired: true },
    ACCESSORY: { componentProductId: '', quantity: '1', isRequired: false },
    OPTION: { componentProductId: '', quantity: '1', isRequired: false },
  })

  // Fetch product detail (enriched with resolved names)
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${productId}`)
      return response.data
    },
  })

  // Fetch product instances
  const { data: instances = [] } = useQuery({
    queryKey: ['product', productId, 'instances'],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${productId}/instances`)
      return response.data
    },
    enabled: !!product,
  })

  const { data: componentsData } = useQuery({
    queryKey: ['product', productId, 'components'],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${productId}/components`)
      return response.data
    },
    enabled: !!product,
  })
  const components: ProductComponent[] = componentsData?.items || []

  const { data: componentOptionsData } = useQuery({
    queryKey: ['products', 'component-options', product?.societyId],
    queryFn: async () => {
      const response = await apiClient.get('/products', {
        params: { page: 1, pageSize: 200, soc_id: product?.societyId || undefined },
      })
      return response.data
    },
    enabled: !!product,
  })
  const componentOptions = (componentOptionsData?.data || []).filter((item: any) => item.id !== Number(productId))

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      success(
        t('products.deleteSuccess', 'Product deleted'),
        t('products.deleteSuccessDescription', 'The product has been deleted successfully.')
      )
      navigate({ to: '/products' })
    },
    onError: () => {
      showError(t('common.error', 'Error'), t('products.deleteError', 'Failed to delete product.'))
    },
  })

  const createComponentMutation = useMutation({
    mutationFn: async ({
      type,
      payload,
    }: {
      type: ComponentType
      payload: { componentProductId: string; quantity: string; isRequired: boolean }
    }) =>
      apiClient.post(`/products/${productId}/components`, {
        componentProductId: Number(payload.componentProductId),
        componentType: type,
        quantity: payload.quantity ? Number(payload.quantity) : undefined,
        isRequired: payload.isRequired,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId, 'components'] })
      success(t('products.componentAdded', 'Component added'), t('products.componentAddedDescription', 'Component relation created successfully.'))
    },
    onError: () => {
      showError(t('common.error', 'Error'), t('products.componentAddError', 'Unable to add product component.'))
    },
  })

  const deleteComponentMutation = useMutation({
    mutationFn: async (componentId: number) =>
      apiClient.delete(`/products/${productId}/components/${componentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId, 'components'] })
      success(t('products.componentDeleted', 'Component deleted'), t('products.componentDeletedDescription', 'Component relation removed successfully.'))
    },
    onError: () => {
      showError(t('common.error', 'Error'), t('products.componentDeleteError', 'Unable to delete component relation.'))
    },
  })

  // ---------------------------------------------------------------------------
  // Loading & Error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
      </PageContainer>
    )
  }

  if (error || !product) {
    return (
      <PageContainer>
        <EmptyStateError
          message={t('products.notFound', 'Product not found')}
          onRetry={() => navigate({ to: '/products' })}
        />
      </PageContainer>
    )
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const hasDimensions =
    product.length || product.width || product.height || product.weight || product.outsideDiameter || product.depth || product.holeSize

  const hasUnitDimensions =
    product.unitLength || product.unitWidth || product.unitHeight || product.unitWeight

  const hasCartonDimensions =
    product.cartonLength || product.cartonWidth || product.cartonHeight || product.cartonWeight || product.quantityEachCarton

  const componentTypes: ComponentType[] = ['DRIVER', 'ACCESSORY', 'OPTION']

  const updateComponentDraft = (
    type: ComponentType,
    updates: Partial<{ componentProductId: string; quantity: string; isRequired: boolean }>
  ) => {
    setComponentDrafts((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }))
  }

  const handleAddComponent = async (type: ComponentType) => {
    const draft = componentDrafts[type]
    if (!draft.componentProductId) {
      showError(t('common.error', 'Error'), t('products.componentSelectRequired', 'Select a product component first.'))
      return
    }

    await createComponentMutation.mutateAsync({ type, payload: draft })
    updateComponentDraft(type, { componentProductId: '', quantity: '1', isRequired: type === 'DRIVER' })
  }

  const openTechnicalSheetPdf = (mode: 'pdf-viewer' | 'pdf-download') => {
    const safeReference = product.reference || productId
    navigate({
      to: '/accounting/export' as any,
      search: {
        mode,
        source: `/products/${productId}/technical-sheet-pdf`,
        title: `Technical Sheet ${safeReference}`,
        filename: `technical-sheet-${safeReference}.pdf`,
      } as any,
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageContainer>
      <PageHeader
        title={product.name || product.reference}
        description={`${product.reference}${product.code ? ` - ${product.code}` : ''}`}
        breadcrumbs={[
          { label: t('products.title', 'Products'), href: '/products' },
          { label: product.name || product.reference },
        ]}
        actions={
          <>
            <button
              onClick={() => navigate({ to: '/products' })}
              className="btn-secondary"
            >
              {t('common.back', 'Back')}
            </button>
            <AttachFileButton
              entityType="PRODUCT"
              entityId={Number(productId)}
              variant="outline"
            />
            <button
              onClick={() => openTechnicalSheetPdf('pdf-viewer')}
              className="btn-secondary"
            >
              Technical Sheet
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="btn-secondary text-destructive hover:bg-destructive/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('common.delete', 'Delete')}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ====== Main content (2 cols) ====== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader title={t('products.information', 'Product Information')} />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label={t('products.reference', 'Reference')} value={product.reference} mono />
                <InfoItem label={t('products.product', 'Name')} value={product.name} />
                <InfoItem label={t('products.category', 'Category / Type')} value={product.categoryName || product.productTypeName || '-'} />
                <InfoItem label={t('products.code', 'Code')} value={product.code} mono />
                {product.subName && (
                  <InfoItem label={t('products.subName', 'Sub-name / Family')} value={product.subName} />
                )}
                {product.supDescription && (
                  <InfoItem label={t('products.supplierDescription', 'Supplier Description')} value={product.supDescription} />
                )}
                <InfoItem
                  label={t('products.description', 'Description')}
                  value={product.description}
                  className="md:col-span-2"
                />
              </dl>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader title={t('products.pricingInventory', 'Pricing & Inventory')} />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground mb-1">{t('products.price', 'Selling Price')}</dt>
                  <dd className="text-lg font-semibold text-foreground">{formatCurrency(product.price)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground mb-1">{t('products.costPrice', 'Purchase Price')}</dt>
                  <dd className="text-lg font-semibold text-foreground">{formatCurrency(product.purchasePrice)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground mb-1">{t('products.stock', 'Stock Quantity')}</dt>
                  <dd className={`text-lg font-semibold ${product.stockQuantity != null && product.stockQuantity < 10 ? 'text-destructive' : 'text-foreground'}`}>
                    {product.stockQuantity ?? 0}
                  </dd>
                </div>
                <InfoItem label={t('products.margin', 'Margin')} value={
                  product.price && product.purchasePrice
                    ? `${((product.price - product.purchasePrice) / product.price * 100).toFixed(1)}%`
                    : undefined
                } />
              </dl>
            </CardContent>
          </Card>

          {/* Physical Dimensions */}
          {hasDimensions && (
            <Card>
              <CardHeader title={t('products.dimensions', 'Physical Dimensions')} />
              <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoItem label={t('products.length', 'Length')} value={formatDecimal(product.length, 'mm')} />
                  <InfoItem label={t('products.width', 'Width')} value={formatDecimal(product.width, 'mm')} />
                  <InfoItem label={t('products.height', 'Height')} value={formatDecimal(product.height, 'mm')} />
                  <InfoItem label={t('products.weight', 'Weight')} value={formatDecimal(product.weight, 'kg')} />
                  <InfoItem label={t('products.outsideDiameter', 'Outside Diameter')} value={formatDecimal(product.outsideDiameter, 'mm')} />
                  <InfoItem label={t('products.depth', 'Depth')} value={formatDecimal(product.depth, 'mm')} />
                  <InfoItem label={t('products.holeSize', 'Hole Size')} value={formatDecimal(product.holeSize, 'mm')} />
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Unit & Carton Dimensions */}
          {(hasUnitDimensions || hasCartonDimensions) && (
            <Card>
              <CardHeader title={t('products.packaging', 'Packaging Dimensions')} />
              <CardContent>
                {hasUnitDimensions && (
                  <>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">{t('products.unitDimensions', 'Unit Dimensions')}</h4>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <InfoItem label={t('products.length', 'Length')} value={formatDecimal(product.unitLength, 'mm')} />
                      <InfoItem label={t('products.width', 'Width')} value={formatDecimal(product.unitWidth, 'mm')} />
                      <InfoItem label={t('products.height', 'Height')} value={formatDecimal(product.unitHeight, 'mm')} />
                      <InfoItem label={t('products.weight', 'Weight')} value={formatDecimal(product.unitWeight, 'kg')} />
                    </dl>
                  </>
                )}
                {hasCartonDimensions && (
                  <>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">{t('products.cartonDimensions', 'Carton Dimensions')}</h4>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <InfoItem label={t('products.quantityPerCarton', 'Qty / Carton')} value={product.quantityEachCarton} />
                      <InfoItem label={t('products.length', 'Length')} value={formatDecimal(product.cartonLength, 'mm')} />
                      <InfoItem label={t('products.width', 'Width')} value={formatDecimal(product.cartonWidth, 'mm')} />
                      <InfoItem label={t('products.height', 'Height')} value={formatDecimal(product.cartonHeight, 'mm')} />
                      <InfoItem label={t('products.weight', 'Weight')} value={formatDecimal(product.cartonWeight, 'kg')} />
                    </dl>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Components */}
          <Card>
            <CardHeader title={t('products.components', 'Product Components')} />
            <CardContent>
              <div className="space-y-6">
                {componentTypes.map((type) => {
                  const items = components.filter((item) => item.componentType === type)
                  const draft = componentDrafts[type]
                  return (
                    <div key={type} className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">
                          {componentTypeLabels[type]}
                        </h4>
                        <span className="text-xs text-muted-foreground">{items.length}</span>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t('products.noComponentsForType', 'No components linked for this type yet.')}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded border border-border px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {item.componentName || `#${item.componentProductId}`}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.componentReference || '-'} | Qty: {item.quantity ?? 1}
                                  {item.isRequired ? ' | Required' : ''}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="text-xs text-destructive hover:underline ml-3"
                                onClick={() => deleteComponentMutation.mutate(item.id)}
                                disabled={deleteComponentMutation.isPending}
                              >
                                {t('common.delete', 'Delete')}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-6">
                          <label className="block text-xs text-muted-foreground mb-1">
                            {t('products.componentProduct', 'Component Product')}
                          </label>
                          <select
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                            value={draft.componentProductId}
                            onChange={(e) => updateComponentDraft(type, { componentProductId: e.target.value })}
                          >
                            <option value="">
                              {t('products.selectComponent', 'Select product')}
                            </option>
                            {componentOptions.map((option: any) => (
                              <option key={option.id} value={String(option.id)}>
                                {option.reference} - {option.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted-foreground mb-1">
                            {t('products.quantity', 'Qty')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                            value={draft.quantity}
                            onChange={(e) => updateComponentDraft(type, { quantity: e.target.value })}
                          />
                        </div>

                        <label className="md:col-span-2 flex items-center gap-2 text-sm text-foreground pb-2">
                          <input
                            type="checkbox"
                            checked={draft.isRequired}
                            onChange={(e) => updateComponentDraft(type, { isRequired: e.target.checked })}
                          />
                          {t('products.required', 'Required')}
                        </label>

                        <div className="md:col-span-2">
                          <button
                            type="button"
                            className="btn-secondary w-full"
                            onClick={() => handleAddComponent(type)}
                            disabled={createComponentMutation.isPending}
                          >
                            {t('common.add', 'Add')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ====== Sidebar (1 col) ====== */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader title={t('common.status', 'Status')} />
            <CardContent>
              <StatusBadge status="Active" />
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader title={t('products.details', 'Details')} />
            <CardContent>
              <dl className="space-y-3">
                <InfoItem label={t('products.society', 'Society')} value={product.societyName} />
                <InfoItem label={t('products.productType', 'Product Type')} value={product.productTypeName} />
                {product.fileName && (
                  <InfoItem label={t('products.fileName', 'File')} value={product.fileName} />
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Product Instances */}
          <Card>
            <CardHeader
              title={t('products.instances', 'Variants / Instances')}
              action={
                <span className="text-sm text-muted-foreground">
                  {instances.length}
                </span>
              }
            />
            <CardContent>
              {instances.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('products.noInstances', 'No variants defined')}
                </p>
              ) : (
                <div className="space-y-3">
                  {instances.slice(0, 10).map((inst: any) => (
                    <div
                      key={inst.pit_id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {inst.pit_ref || `#${inst.pit_id}`}
                        </p>
                        {inst.pit_description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {inst.pit_description}
                          </p>
                        )}
                      </div>
                      {inst.pit_price != null && (
                        <span className="text-sm font-medium text-foreground ml-2 flex-shrink-0">
                          {formatCurrency(inst.pit_price)}
                        </span>
                      )}
                    </div>
                  ))}
                  {instances.length > 10 && (
                    <p className="text-sm text-primary">
                      +{instances.length - 10} {t('common.more', 'more')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Record Information */}
          <Card>
            <CardHeader title={t('common.recordInfo', 'Record Information')} />
            <CardContent>
              <dl className="space-y-3">
                <InfoItem label={t('common.created', 'Created')} value={formatDate(product.createdAt)} />
                <InfoItem label={t('common.updated', 'Last Updated')} value={formatDate(product.updatedAt)} />
              </dl>
            </CardContent>
          </Card>

          <DocumentAttachments
            entityType="PRODUCT"
            entityId={Number(productId)}
          />
        </div>
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        itemName={product.name || product.reference}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
