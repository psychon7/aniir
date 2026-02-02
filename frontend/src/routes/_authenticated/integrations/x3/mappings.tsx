/**
 * X3 Mappings Page
 * Manage customer and product mappings between ERP and Sage X3
 */
import { useState, useMemo, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/layout/Card'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormCheckbox } from '@/components/ui/form/FormCheckbox'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import {
  useX3CustomerMappings,
  useX3ProductMappings,
  useCreateX3CustomerMapping,
  useUpdateX3CustomerMapping,
  useDeleteX3CustomerMapping,
  useCreateX3ProductMapping,
  useUpdateX3ProductMapping,
  useDeleteX3ProductMapping,
  useBulkCreateX3CustomerMappings,
  useBulkCreateX3ProductMappings,
  useX3MappingStats,
} from '@/hooks/useX3Mappings'
import type {
  X3CustomerMapping,
  X3ProductMapping,
  X3CustomerMappingCreateDto,
  X3CustomerMappingUpdateDto,
  X3ProductMappingCreateDto,
  X3ProductMappingUpdateDto,
  X3CustomerMappingSearchParams,
  X3ProductMappingSearchParams,
} from '@/types/x3'

export const Route = createFileRoute('/_authenticated/integrations/x3/mappings' as any)({
  component: X3MappingsPage,
})

type TabType = 'customers' | 'products'

function X3MappingsPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('customers')

  // Customer mappings state
  const [customerSearchParams, setCustomerSearchParams] = useState<X3CustomerMappingSearchParams>({
    page: 1,
    page_size: 10,
  })

  // Product mappings state
  const [productSearchParams, setProductSearchParams] = useState<X3ProductMappingSearchParams>({
    page: 1,
    page_size: 10,
  })

  // Modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingCustomerMapping, setEditingCustomerMapping] = useState<X3CustomerMapping | null>(null)
  const [editingProductMapping, setEditingProductMapping] = useState<X3ProductMapping | null>(null)
  const [deletingCustomerMapping, setDeletingCustomerMapping] = useState<X3CustomerMapping | null>(null)
  const [deletingProductMapping, setDeletingProductMapping] = useState<X3ProductMapping | null>(null)
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false)

  // Form state
  const [customerForm, setCustomerForm] = useState<X3CustomerMappingCreateDto>({
    client_id: 0,
    x3_customer_code: '',
    sales_site: 'FCY1',
    is_active: true,
  })
  const [productForm, setProductForm] = useState<X3ProductMappingCreateDto>({
    product_id: 0,
    x3_product_code: '',
    tax_code: '',
    is_active: true,
  })

  // Data fetching
  const { data: customerMappingsData, isLoading: isLoadingCustomers } = useX3CustomerMappings(customerSearchParams)
  const { data: productMappingsData, isLoading: isLoadingProducts } = useX3ProductMappings(productSearchParams)
  const { data: stats } = useX3MappingStats()

  // Customer mutations
  const createCustomerMutation = useCreateX3CustomerMapping()
  const updateCustomerMutation = useUpdateX3CustomerMapping()
  const deleteCustomerMutation = useDeleteX3CustomerMapping()
  const bulkCreateCustomerMutation = useBulkCreateX3CustomerMappings()

  // Product mutations
  const createProductMutation = useCreateX3ProductMapping()
  const updateProductMutation = useUpdateX3ProductMapping()
  const deleteProductMutation = useDeleteX3ProductMapping()
  const bulkCreateProductMutation = useBulkCreateX3ProductMappings()

  // ==========================================================================
  // Customer Mapping Handlers
  // ==========================================================================

  const handleOpenCustomerCreate = () => {
    setEditingCustomerMapping(null)
    setCustomerForm({
      client_id: 0,
      x3_customer_code: '',
      sales_site: 'FCY1',
      is_active: true,
    })
    setIsCustomerModalOpen(true)
  }

  const handleOpenCustomerEdit = (mapping: X3CustomerMapping) => {
    setEditingCustomerMapping(mapping)
    setCustomerForm({
      client_id: mapping.client_id,
      x3_customer_code: mapping.x3_customer_code,
      sales_site: mapping.sales_site,
      is_active: mapping.is_active,
    })
    setIsCustomerModalOpen(true)
  }

  const handleCustomerFormSubmit = async () => {
    try {
      if (editingCustomerMapping) {
        const updateData: X3CustomerMappingUpdateDto = {
          x3_customer_code: customerForm.x3_customer_code,
          sales_site: customerForm.sales_site,
          is_active: customerForm.is_active,
        }
        await updateCustomerMutation.mutateAsync({
          id: editingCustomerMapping.id,
          data: updateData,
        })
        success(t('x3.mappingUpdated'), t('x3.customerMappingUpdatedDesc'))
      } else {
        await createCustomerMutation.mutateAsync(customerForm)
        success(t('x3.mappingCreated'), t('x3.customerMappingCreatedDesc'))
      }
      setIsCustomerModalOpen(false)
      setEditingCustomerMapping(null)
    } catch (err) {
      showError(t('common.error'), t('x3.failedToSaveMapping'))
    }
  }

  const handleDeleteCustomerMapping = async () => {
    if (!deletingCustomerMapping) return
    try {
      await deleteCustomerMutation.mutateAsync(deletingCustomerMapping.id)
      success(t('x3.mappingDeleted'), t('x3.customerMappingDeletedDesc'))
      setDeletingCustomerMapping(null)
    } catch (err) {
      showError(t('common.error'), t('x3.failedToDeleteMapping'))
    }
  }

  // ==========================================================================
  // Product Mapping Handlers
  // ==========================================================================

  const handleOpenProductCreate = () => {
    setEditingProductMapping(null)
    setProductForm({
      product_id: 0,
      x3_product_code: '',
      tax_code: '',
      is_active: true,
    })
    setIsProductModalOpen(true)
  }

  const handleOpenProductEdit = (mapping: X3ProductMapping) => {
    setEditingProductMapping(mapping)
    setProductForm({
      product_id: mapping.product_id,
      x3_product_code: mapping.x3_product_code,
      tax_code: mapping.tax_code || '',
      is_active: mapping.is_active,
    })
    setIsProductModalOpen(true)
  }

  const handleProductFormSubmit = async () => {
    try {
      if (editingProductMapping) {
        const updateData: X3ProductMappingUpdateDto = {
          x3_product_code: productForm.x3_product_code,
          tax_code: productForm.tax_code || undefined,
          is_active: productForm.is_active,
        }
        await updateProductMutation.mutateAsync({
          id: editingProductMapping.id,
          data: updateData,
        })
        success(t('x3.mappingUpdated'), t('x3.productMappingUpdatedDesc'))
      } else {
        await createProductMutation.mutateAsync(productForm)
        success(t('x3.mappingCreated'), t('x3.productMappingCreatedDesc'))
      }
      setIsProductModalOpen(false)
      setEditingProductMapping(null)
    } catch (err) {
      showError(t('common.error'), t('x3.failedToSaveMapping'))
    }
  }

  const handleDeleteProductMapping = async () => {
    if (!deletingProductMapping) return
    try {
      await deleteProductMutation.mutateAsync(deletingProductMapping.id)
      success(t('x3.mappingDeleted'), t('x3.productMappingDeletedDesc'))
      setDeletingProductMapping(null)
    } catch (err) {
      showError(t('common.error'), t('x3.failedToDeleteMapping'))
    }
  }

  // ==========================================================================
  // Bulk Import Handler
  // ==========================================================================

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

      const mappings = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim())
        const mapping: Record<string, string | number | boolean> = {}
        headers.forEach((header, index) => {
          const value = values[index] || ''
          if (header === 'client_id' || header === 'product_id') {
            mapping[header] = parseInt(value, 10)
          } else if (header === 'is_active') {
            mapping[header] = value.toLowerCase() === 'true' || value === '1'
          } else {
            mapping[header] = value
          }
        })
        return mapping
      })

      if (activeTab === 'customers') {
        const result = await bulkCreateCustomerMutation.mutateAsync(mappings)
        if (result.failed > 0) {
          showError(
            t('x3.bulkImportPartial'),
            t('x3.bulkImportPartialDesc', { created: result.created, failed: result.failed })
          )
        } else {
          success(t('x3.bulkImportSuccess'), t('x3.bulkImportSuccessDesc', { count: result.created }))
        }
      } else {
        const result = await bulkCreateProductMutation.mutateAsync(mappings)
        if (result.failed > 0) {
          showError(
            t('x3.bulkImportPartial'),
            t('x3.bulkImportPartialDesc', { created: result.created, failed: result.failed })
          )
        } else {
          success(t('x3.bulkImportSuccess'), t('x3.bulkImportSuccessDesc', { count: result.created }))
        }
      }
    } catch (err) {
      showError(t('common.error'), t('x3.bulkImportFailed'))
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ==========================================================================
  // Search and Pagination Handlers
  // ==========================================================================

  const handleCustomerSearch = (search: string) => {
    setCustomerSearchParams((prev) => ({ ...prev, search, page: 1 }))
  }

  const handleCustomerPageChange = (page: number) => {
    setCustomerSearchParams((prev) => ({ ...prev, page }))
  }

  const handleCustomerPageSizeChange = (page_size: number) => {
    setCustomerSearchParams((prev) => ({ ...prev, page_size, page: 1 }))
  }

  const handleProductSearch = (search: string) => {
    setProductSearchParams((prev) => ({ ...prev, search, page: 1 }))
  }

  const handleProductPageChange = (page: number) => {
    setProductSearchParams((prev) => ({ ...prev, page }))
  }

  const handleProductPageSizeChange = (page_size: number) => {
    setProductSearchParams((prev) => ({ ...prev, page_size, page: 1 }))
  }

  const handleStatusFilter = (value: string) => {
    const isActive = value === '' ? undefined : value === 'active'
    if (activeTab === 'customers') {
      setCustomerSearchParams((prev) => ({ ...prev, is_active: isActive, page: 1 }))
    } else {
      setProductSearchParams((prev) => ({ ...prev, is_active: isActive, page: 1 }))
    }
  }

  // ==========================================================================
  // Table Columns
  // ==========================================================================

  const customerColumns = useMemo<Column<X3CustomerMapping>[]>(
    () => [
      {
        id: 'client_id',
        header: t('x3.erpCustomerId'),
        accessorKey: 'client_id',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm">{row.client_id}</span>
        ),
      },
      {
        id: 'client_name',
        header: t('x3.customerName'),
        accessorKey: 'client_name',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.client_name || '-'}</p>
            {row.client_code && (
              <p className="text-xs text-muted-foreground">{row.client_code}</p>
            )}
          </div>
        ),
      },
      {
        id: 'x3_customer_code',
        header: t('x3.x3CustomerCode'),
        accessorKey: 'x3_customer_code',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm font-medium text-primary">{row.x3_customer_code}</span>
        ),
      },
      {
        id: 'sales_site',
        header: t('x3.salesSite'),
        accessorKey: 'sales_site',
        cell: (row) => <span className="text-sm">{row.sales_site}</span>,
      },
      {
        id: 'is_active',
        header: t('x3.status'),
        accessorKey: 'is_active',
        cell: (row) => (
          <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
        ),
      },
      {
        id: 'last_exported_at',
        header: t('x3.lastExported'),
        accessorKey: 'last_exported_at',
        cell: (row) =>
          row.last_exported_at ? (
            <span className="text-sm text-muted-foreground">
              {new Date(row.last_exported_at).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/50">-</span>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOpenCustomerEdit(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.edit')}
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingCustomerMapping(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('common.delete')}
            >
              <DeleteIcon className="w-4 h-4" />
            </button>
          </div>
        ),
        className: 'w-24',
      },
    ],
    [t]
  )

  const productColumns = useMemo<Column<X3ProductMapping>[]>(
    () => [
      {
        id: 'product_id',
        header: t('x3.erpProductId'),
        accessorKey: 'product_id',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm">{row.product_id}</span>
        ),
      },
      {
        id: 'product_name',
        header: t('x3.productName'),
        accessorKey: 'product_name',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.product_name || '-'}</p>
          </div>
        ),
      },
      {
        id: 'product_sku',
        header: t('x3.sku'),
        accessorKey: 'product_sku',
        cell: (row) => (
          <span className="font-mono text-xs text-muted-foreground">{row.product_sku || '-'}</span>
        ),
      },
      {
        id: 'x3_product_code',
        header: t('x3.x3ProductCode'),
        accessorKey: 'x3_product_code',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm font-medium text-primary">{row.x3_product_code}</span>
        ),
      },
      {
        id: 'tax_code',
        header: t('x3.taxCode'),
        accessorKey: 'tax_code',
        cell: (row) => (
          <span className="text-sm">{row.tax_code || '-'}</span>
        ),
      },
      {
        id: 'is_active',
        header: t('x3.status'),
        accessorKey: 'is_active',
        cell: (row) => (
          <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOpenProductEdit(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.edit')}
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingProductMapping(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('common.delete')}
            >
              <DeleteIcon className="w-4 h-4" />
            </button>
          </div>
        ),
        className: 'w-24',
      },
    ],
    [t]
  )

  // ==========================================================================
  // Filters
  // ==========================================================================

  const filters = (
    <FormSelect
      value={
        activeTab === 'customers'
          ? customerSearchParams.is_active === undefined
            ? ''
            : customerSearchParams.is_active
              ? 'active'
              : 'inactive'
          : productSearchParams.is_active === undefined
            ? ''
            : productSearchParams.is_active
              ? 'active'
              : 'inactive'
      }
      onChange={(e) => handleStatusFilter(e.target.value)}
      options={[
        { value: '', label: t('x3.allStatuses') },
        { value: 'active', label: t('x3.statusActive') },
        { value: 'inactive', label: t('x3.statusInactive') },
      ]}
      className="w-40"
    />
  )

  // ==========================================================================
  // Actions
  // ==========================================================================

  const actions = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleBulkImport}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="btn-secondary"
        disabled={bulkCreateCustomerMutation.isPending || bulkCreateProductMutation.isPending}
      >
        <UploadIcon className="w-4 h-4" />
        {t('x3.bulkImport')}
      </button>
      <button
        onClick={activeTab === 'customers' ? handleOpenCustomerCreate : handleOpenProductCreate}
        className="btn-primary"
      >
        <PlusIcon className="w-4 h-4" />
        {activeTab === 'customers' ? t('x3.addCustomerMapping') : t('x3.addProductMapping')}
      </button>
    </>
  )

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <PageContainer>
      <PageHeader
        title={t('x3.mappingsTitle')}
        description={t('x3.mappingsDescription')}
        breadcrumbs={[
          { label: t('breadcrumbs.integrations') },
          { label: t('breadcrumbs.sageX3') },
          { label: t('breadcrumbs.mappings') },
        ]}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">{t('x3.totalCustomerMappings')}</p>
              <p className="text-2xl font-bold text-foreground">{stats.customer_mappings.total}</p>
              <p className="text-xs text-muted-foreground">
                {stats.customer_mappings.active} {t('x3.active')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">{t('x3.customersExported')}</p>
              <p className="text-2xl font-bold text-foreground">{stats.customer_mappings.exported}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">{t('x3.totalProductMappings')}</p>
              <p className="text-2xl font-bold text-foreground">{stats.product_mappings.total}</p>
              <p className="text-xs text-muted-foreground">
                {stats.product_mappings.active} {t('x3.active')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">{t('x3.productsWithTaxCode')}</p>
              <p className="text-2xl font-bold text-foreground">{stats.product_mappings.with_tax_code}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-secondary/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'customers'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <UsersIcon className="w-4 h-4 inline-block mr-2" />
          {t('x3.customerMappings')}
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'products'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PackageIcon className="w-4 h-4 inline-block mr-2" />
          {t('x3.productMappings')}
        </button>
      </div>

      {/* Data Tables */}
      {activeTab === 'customers' ? (
        <DataTable
          columns={customerColumns}
          data={customerMappingsData?.items || []}
          keyField="id"
          isLoading={isLoadingCustomers}
          page={customerSearchParams.page}
          pageSize={customerSearchParams.page_size}
          totalCount={customerMappingsData?.total || 0}
          totalPages={customerMappingsData?.total_pages || 1}
          onPageChange={handleCustomerPageChange}
          onPageSizeChange={handleCustomerPageSizeChange}
          searchValue={customerSearchParams.search}
          onSearchChange={handleCustomerSearch}
          searchPlaceholder={t('x3.searchCustomerMappings')}
          filters={filters}
          actions={actions}
          onRowClick={handleOpenCustomerEdit}
          emptyMessage={t('x3.noCustomerMappings')}
          emptyDescription={t('x3.noCustomerMappingsDesc')}
        />
      ) : (
        <DataTable
          columns={productColumns}
          data={productMappingsData?.items || []}
          keyField="id"
          isLoading={isLoadingProducts}
          page={productSearchParams.page}
          pageSize={productSearchParams.page_size}
          totalCount={productMappingsData?.total || 0}
          totalPages={productMappingsData?.total_pages || 1}
          onPageChange={handleProductPageChange}
          onPageSizeChange={handleProductPageSizeChange}
          searchValue={productSearchParams.search}
          onSearchChange={handleProductSearch}
          searchPlaceholder={t('x3.searchProductMappings')}
          filters={filters}
          actions={actions}
          onRowClick={handleOpenProductEdit}
          emptyMessage={t('x3.noProductMappings')}
          emptyDescription={t('x3.noProductMappingsDesc')}
        />
      )}

      {/* Customer Mapping Modal */}
      <FormModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false)
          setEditingCustomerMapping(null)
        }}
        title={editingCustomerMapping ? t('x3.editCustomerMapping') : t('x3.addCustomerMapping')}
        description={t('x3.customerMappingFormDesc')}
        footer={
          <FormModalFooter
            onCancel={() => {
              setIsCustomerModalOpen(false)
              setEditingCustomerMapping(null)
            }}
            onSubmit={handleCustomerFormSubmit}
            submitText={editingCustomerMapping ? t('common.save') : t('common.create')}
            isSubmitting={createCustomerMutation.isPending || updateCustomerMutation.isPending}
            submitDisabled={!customerForm.client_id || !customerForm.x3_customer_code}
          />
        }
      >
        <div className="space-y-4">
          <FormInput
            label={t('x3.erpCustomerId')}
            type="number"
            value={customerForm.client_id || ''}
            onChange={(e) => setCustomerForm((f) => ({ ...f, client_id: parseInt(e.target.value, 10) || 0 }))}
            placeholder={t('x3.enterErpCustomerId')}
            disabled={!!editingCustomerMapping}
            required
          />
          <FormInput
            label={t('x3.x3CustomerCode')}
            value={customerForm.x3_customer_code}
            onChange={(e) => setCustomerForm((f) => ({ ...f, x3_customer_code: e.target.value }))}
            placeholder={t('x3.enterX3CustomerCode')}
            maxLength={20}
            required
          />
          <FormInput
            label={t('x3.salesSite')}
            value={customerForm.sales_site || ''}
            onChange={(e) => setCustomerForm((f) => ({ ...f, sales_site: e.target.value }))}
            placeholder="FCY1"
            maxLength={10}
          />
          <FormCheckbox
            label={t('x3.mappingActive')}
            checked={customerForm.is_active ?? true}
            onChange={(e) => setCustomerForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
        </div>
      </FormModal>

      {/* Product Mapping Modal */}
      <FormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setEditingProductMapping(null)
        }}
        title={editingProductMapping ? t('x3.editProductMapping') : t('x3.addProductMapping')}
        description={t('x3.productMappingFormDesc')}
        footer={
          <FormModalFooter
            onCancel={() => {
              setIsProductModalOpen(false)
              setEditingProductMapping(null)
            }}
            onSubmit={handleProductFormSubmit}
            submitText={editingProductMapping ? t('common.save') : t('common.create')}
            isSubmitting={createProductMutation.isPending || updateProductMutation.isPending}
            submitDisabled={!productForm.product_id || !productForm.x3_product_code}
          />
        }
      >
        <div className="space-y-4">
          <FormInput
            label={t('x3.erpProductId')}
            type="number"
            value={productForm.product_id || ''}
            onChange={(e) => setProductForm((f) => ({ ...f, product_id: parseInt(e.target.value, 10) || 0 }))}
            placeholder={t('x3.enterErpProductId')}
            disabled={!!editingProductMapping}
            required
          />
          <FormInput
            label={t('x3.x3ProductCode')}
            value={productForm.x3_product_code}
            onChange={(e) => setProductForm((f) => ({ ...f, x3_product_code: e.target.value }))}
            placeholder={t('x3.enterX3ProductCode')}
            maxLength={20}
            required
          />
          <FormInput
            label={t('x3.taxCode')}
            value={productForm.tax_code || ''}
            onChange={(e) => setProductForm((f) => ({ ...f, tax_code: e.target.value }))}
            placeholder={t('x3.enterTaxCode')}
            maxLength={10}
          />
          <FormCheckbox
            label={t('x3.mappingActive')}
            checked={productForm.is_active ?? true}
            onChange={(e) => setProductForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
        </div>
      </FormModal>

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmDialog
        isOpen={!!deletingCustomerMapping}
        onClose={() => setDeletingCustomerMapping(null)}
        onConfirm={handleDeleteCustomerMapping}
        itemName={deletingCustomerMapping?.x3_customer_code || ''}
        isLoading={deleteCustomerMutation.isPending}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingProductMapping}
        onClose={() => setDeletingProductMapping(null)}
        onConfirm={handleDeleteProductMapping}
        itemName={deletingProductMapping?.x3_product_code || ''}
        isLoading={deleteProductMutation.isPending}
      />
    </PageContainer>
  )
}

// ==========================================================================
// Icon Components
// ==========================================================================

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
