import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import { EmptyStateError } from '@/components/ui/feedback/EmptyState'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { DataTable, Column } from '@/components/ui/data-table'
import { SupplierForm } from '@/components/features/suppliers/SupplierForm'
import { useSupplier, useUpdateSupplier, useDeleteSupplier, useSupplierContacts } from '@/hooks/useSuppliers'
import { useSupplierPrices, useSupplierProducts } from '@/hooks/usePricing'
import type { SupplierCreateDto } from '@/types/supplier'
import type { SupplierProduct } from '@/types/pricing'

export const Route = createFileRoute('/_authenticated/suppliers/$supplierId')({
  component: SupplierDetailPage,
})

function SupplierDetailPage() {
  const { supplierId } = Route.useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'products'>('details')

  // Products tab state
  const [productsParams, setProductsParams] = useState({
    page: 1,
    pageSize: 10,
    search: undefined as string | undefined,
    activeOnly: true,
  })

  const { data: supplier, isLoading, error } = useSupplier(Number(supplierId))
  const { data: contacts = [] } = useSupplierContacts(Number(supplierId))
  const { data: pricesData } = useSupplierPrices(Number(supplierId), { page: 1, pageSize: 5, activeOnly: true })
  const { data: productsData, isLoading: isLoadingProducts } = useSupplierProducts(
    Number(supplierId),
    productsParams,
    activeTab === 'products'
  )
  const prices = pricesData?.data || []
  const updateMutation = useUpdateSupplier()
  const deleteMutation = useDeleteSupplier()

  const handleUpdate = async (data: SupplierCreateDto) => {
    try {
      await updateMutation.mutateAsync({ ...data, id: Number(supplierId) })
      success('Supplier updated', 'The supplier has been updated successfully.')
      setIsFormOpen(false)
    } catch (err) {
      showError('Error', 'An error occurred while updating the supplier.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(Number(supplierId))
      success('Supplier deleted', 'The supplier has been deleted successfully.')
      navigate({ to: '/suppliers' })
    } catch (err) {
      showError('Error', 'An error occurred while deleting the supplier.')
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
      </PageContainer>
    )
  }

  if (error || !supplier) {
    return (
      <PageContainer>
        <EmptyStateError
          message="Supplier not found"
          onRetry={() => navigate({ to: '/suppliers' })}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={supplier.companyName}
        description={`${supplier.reference} - ${supplier.supplierTypeName || 'Supplier'}`}
        breadcrumbs={[
          { label: 'Suppliers', href: '/suppliers' },
          { label: supplier.companyName },
        ]}
        actions={
          <>
            <button onClick={() => setIsFormOpen(true)} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button onClick={() => setIsDeleteOpen(true)} className="btn-secondary text-destructive hover:bg-destructive/10">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </>
        }
      />

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {t('common.details', 'Details')}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {t('pricing.supplierProducts', 'Supplier Products')}
            {productsData?.totalCount != null && productsData.totalCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                {productsData.totalCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <SupplierProductsTab
          supplierId={Number(supplierId)}
          productsData={productsData}
          isLoading={isLoadingProducts}
          params={productsParams}
          onParamsChange={setProductsParams}
        />
      )}

      {/* Details Tab Content */}
      {activeTab === 'details' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader title="Company Information" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Company Name" value={supplier.companyName} />
                <InfoItem label="Reference" value={supplier.reference} mono />
                <InfoItem label="Abbreviation" value={supplier.abbreviation} />
                <InfoItem label="Supplier Type" value={supplier.supplierTypeName} />
                <InfoItem label="Email" value={supplier.email} link={`mailto:${supplier.email}`} />
                <InfoItem label="Phone" value={supplier.phone} link={`tel:${supplier.phone}`} />
                <InfoItem label="Phone 2" value={supplier.phone2} link={`tel:${supplier.phone2}`} />
                <InfoItem label="Mobile" value={supplier.mobile} link={`tel:${supplier.mobile}`} />
                <InfoItem label="Fax" value={supplier.fax} />
                <InfoItem
                  label="Status"
                  value={
                    <div className="flex items-center gap-2">
                      <StatusBadge status={supplier.isActive ? 'Active' : 'Inactive'} />
                      {supplier.isBlocked && (
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-destructive/10 text-destructive">
                          Blocked
                        </span>
                      )}
                    </div>
                  }
                />
              </dl>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader title="Address" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <dt className="text-sm text-muted-foreground mb-1">Street Address</dt>
                  <dd className="text-foreground">
                    {supplier.address || '-'}
                    {supplier.address2 && <><br />{supplier.address2}</>}
                  </dd>
                </div>
                <InfoItem label="City" value={supplier.city} />
                <InfoItem label="Postal Code" value={supplier.postalCode} />
                <InfoItem label="Country" value={supplier.country} />
              </dl>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader title="Business Details" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="VAT Number" value={supplier.vatNumber} mono />
                <InfoItem label="SIREN" value={supplier.siren} mono />
                <InfoItem label="SIRET" value={supplier.siret} mono />
                <InfoItem label="Society" value={supplier.societyName} />
                <InfoItem label="Free of Harbor (Min)" value={supplier.freeOfHarbor ? `${supplier.freeOfHarbor.toLocaleString()}` : '-'} />
              </dl>
            </CardContent>
          </Card>

          {/* Comments */}
          {(supplier.internalComment || supplier.supplierComment) && (
            <Card>
              <CardHeader title="Comments" />
              <CardContent>
                <div className="space-y-4">
                  {supplier.internalComment && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Internal Comment</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{supplier.internalComment}</p>
                    </div>
                  )}
                  {supplier.supplierComment && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Supplier Comment</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{supplier.supplierComment}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Terms */}
          <Card>
            <CardHeader title="Payment Terms" />
            <CardContent>
              <dl className="space-y-4">
                <InfoItem label="Currency" value={supplier.currencyCode} />
                <InfoItem label="Payment Mode" value={supplier.paymentModeName} />
                <InfoItem label="Payment Terms" value={supplier.paymentConditionName} />
              </dl>
            </CardContent>
          </Card>

          {/* Newsletter */}
          <Card>
            <CardHeader title="Newsletter" />
            <CardContent>
              <dl className="space-y-4">
                <InfoItem
                  label="Receives Newsletter"
                  value={
                    <span className={supplier.receiveNewsletter ? 'text-green-600' : 'text-muted-foreground'}>
                      {supplier.receiveNewsletter ? 'Yes' : 'No'}
                    </span>
                  }
                />
                {supplier.receiveNewsletter && supplier.newsletterEmail && (
                  <InfoItem label="Newsletter Email" value={supplier.newsletterEmail} link={`mailto:${supplier.newsletterEmail}`} />
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader
              title={t('suppliers.contacts', 'Contacts')}
              action={
                <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                  + {t('common.add', 'Add')}
                </button>
              }
            />
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('suppliers.noContacts', 'No contacts added')}</p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {contact.firstName?.[0]}{contact.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.addressTitle && (
                          <p className="text-xs text-muted-foreground">{contact.addressTitle}</p>
                        )}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline">
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Prices */}
          <Card>
            <CardHeader
              title={t('pricing.productPrices')}
              action={
                <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                  + {t('pricing.addPrice')}
                </button>
              }
            />
            <CardContent>
              {prices.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('pricing.noPricesFound')}</p>
              ) : (
                <div className="space-y-3">
                  {prices.map((price) => (
                    <div key={price.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {price.productName || `Product #${price.productId}`}
                          </p>
                          {price.isPreferred && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-primary/10 text-primary">
                              {t('pricing.preferred')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {price.supplierRef && <span>{price.supplierRef} · </span>}
                          {price.leadTimeDays ? `${price.leadTimeDays} ${t('pricing.days')}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {price.currencyCode || '€'}{price.unitCost.toFixed(2)}
                        </p>
                        {price.discountPercent && price.discountPercent > 0 && (
                          <p className="text-xs text-green-600">-{price.discountPercent}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {pricesData && pricesData.total > 5 && (
                    <button className="text-xs text-primary hover:underline w-full text-center pt-2">
                      {t('common.viewAll', 'View all')} ({pricesData.total})
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader title="Record Information" />
            <CardContent>
              <dl className="space-y-4 text-sm">
                <InfoItem
                  label="Created"
                  value={new Date(supplier.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
                <InfoItem
                  label="Last Updated"
                  value={new Date(supplier.updatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Edit Form Modal */}
      <SupplierForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdate}
        supplier={supplier}
        isSubmitting={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={supplier.companyName}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}

// Supplier Products Tab Component
function SupplierProductsTab({
  supplierId,
  productsData,
  isLoading,
  params,
  onParamsChange,
}: {
  supplierId: number
  productsData: import('@/types/pricing').SupplierProductPagedResponse | undefined
  isLoading: boolean
  params: { page: number; pageSize: number; search?: string; activeOnly: boolean }
  onParamsChange: (params: { page: number; pageSize: number; search?: string; activeOnly: boolean }) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const columns = useMemo<Column<SupplierProduct>[]>(
    () => [
      {
        id: 'productReference',
        header: t('products.reference', 'Reference'),
        accessorKey: 'productReference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.productReference || '-'}</span>
        ),
      },
      {
        id: 'productName',
        header: t('products.name', 'Product Name'),
        accessorKey: 'productName',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.productName || `Product #${row.productId}`}</p>
            {row.supplierProductName && (
              <p className="text-xs text-muted-foreground">{row.supplierProductName}</p>
            )}
          </div>
        ),
      },
      {
        id: 'supplierRef',
        header: t('pricing.supplierRef', 'Supplier Ref'),
        accessorKey: 'supplierRef',
        cell: (row) => (
          <span className="font-mono text-sm">{row.supplierRef || '-'}</span>
        ),
      },
      {
        id: 'unitCost',
        header: t('pricing.unitCost', 'Unit Cost'),
        accessorKey: 'unitCost',
        sortable: true,
        cell: (row) => (
          <div className="text-right">
            <span className="font-semibold">
              {row.currencyCode || '\u20AC'}{Number(row.unitCost).toFixed(2)}
            </span>
            {row.discountPercent != null && Number(row.discountPercent) > 0 && (
              <p className="text-xs text-green-600">-{Number(row.discountPercent)}%</p>
            )}
          </div>
        ),
      },
      {
        id: 'leadTimeDays',
        header: t('pricing.leadTime', 'Lead Time'),
        accessorKey: 'leadTimeDays',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.leadTimeDays ? `${row.leadTimeDays} ${t('pricing.days', 'days')}` : '-'}
          </span>
        ),
      },
      {
        id: 'minOrderQty',
        header: t('pricing.minQuantity', 'Min Qty'),
        accessorKey: 'minOrderQty',
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.minOrderQty || t('pricing.noMinimum', '-')}
          </span>
        ),
      },
      {
        id: 'priority',
        header: t('pricing.priority', 'Priority'),
        accessorKey: 'priority',
        sortable: true,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <span className="text-sm">{row.priority}</span>
            {row.isPreferred && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-primary/10 text-primary">
                {t('pricing.preferred', 'Preferred')}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'isActive',
        header: t('common.status', 'Status'),
        accessorKey: 'isActive',
        cell: (row) => (
          <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />
        ),
      },
    ],
    [t]
  )

  const handleSearch = (search: string) => {
    onParamsChange({ ...params, search: search || undefined, page: 1 })
  }

  const handlePageChange = (page: number) => {
    onParamsChange({ ...params, page })
  }

  const handlePageSizeChange = (pageSize: number) => {
    onParamsChange({ ...params, pageSize, page: 1 })
  }

  const handleRowClick = (row: SupplierProduct) => {
    navigate({ to: '/products/$productId', params: { productId: String(row.productId) } })
  }

  return (
    <DataTable
      columns={columns}
      data={productsData?.data || []}
      keyField="priceId"
      isLoading={isLoading}
      page={params.page}
      pageSize={params.pageSize}
      totalCount={productsData?.totalCount || 0}
      totalPages={productsData?.totalPages || 1}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      searchValue={params.search || ''}
      onSearchChange={handleSearch}
      searchPlaceholder={t('products.searchProducts', 'Search products...')}
      onRowClick={handleRowClick}
      emptyMessage={t('pricing.noProductsFound', 'No products from this supplier')}
      emptyDescription={t('pricing.noProductsDescription', 'Add product pricing to see products here')}
    />
  )
}

// Helper component for displaying info items
function InfoItem({
  label,
  value,
  link,
  external,
  mono,
}: {
  label: string
  value: React.ReactNode
  link?: string
  external?: boolean
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground mb-1">{label}</dt>
      <dd className={`text-foreground ${mono ? 'font-mono text-sm' : ''}`}>
        {link && value ? (
          <a
            href={link}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="text-primary hover:underline"
          >
            {value}
            {external && (
              <svg className="inline-block w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </a>
        ) : (
          value || '-'
        )}
      </dd>
    </div>
  )
}
