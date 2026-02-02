import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormSelect } from '@/components/ui/form/FormSelect'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/products/')({
  component: ProductsPage,
})

interface Product {
  id: number
  reference: string
  name: string
  description?: string
  categoryName?: string
  brandName?: string
  unitPrice: number
  costPrice?: number
  stockQuantity?: number
  isActive: boolean
  createdAt: string
}

interface ProductSearchParams {
  page: number
  pageSize: number
  search?: string
  categoryId?: number
  brandId?: number
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

function ProductsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  const [searchParams, setSearchParams] = useState<ProductSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', searchParams.page.toString())
      params.append('pageSize', searchParams.pageSize.toString())
      if (searchParams.search) params.append('search', searchParams.search)
      if (searchParams.categoryId) params.append('categoryId', searchParams.categoryId.toString())
      if (searchParams.brandId) params.append('brandId', searchParams.brandId.toString())
      if (searchParams.isActive !== undefined) params.append('isActive', searchParams.isActive.toString())
      if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy)
      if (searchParams.sortOrder) params.append('sortOrder', searchParams.sortOrder)
      
      const response = await apiClient.get(`/products?${params}`)
      return response.data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      success(t('products.deleteSuccess'), t('products.deleteSuccessDescription'))
      setDeletingProduct(null)
    },
    onError: () => {
      showError(t('common.error'), t('products.deleteError'))
    },
  })

  const handleSearch = (search: string) => {
    setSearchParams((prev) => ({ ...prev, search, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, pageSize, page: 1 }))
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSearchParams((prev) => ({ ...prev, sortBy, sortOrder }))
  }

  const handleRowClick = (product: Product) => {
    navigate({ to: '/products/$productId', params: { productId: String(product.id) } })
  }

  const handleActiveFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      isActive: value === '' ? undefined : value === 'true',
      page: 1,
    }))
  }

  const columns = useMemo<Column<Product>[]>(
    () => [
      {
        id: 'reference',
        header: t('products.reference'),
        accessorKey: 'reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference}</span>
        ),
      },
      {
        id: 'name',
        header: t('products.product'),
        accessorKey: 'name',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            {row.description && (
              <p className="text-sm text-muted-foreground truncate max-w-xs">{row.description}</p>
            )}
          </div>
        ),
      },
      {
        id: 'categoryName',
        header: t('products.category'),
        accessorKey: 'categoryName',
        sortable: true,
        cell: (row) => row.categoryName || '-',
      },
      {
        id: 'brandName',
        header: t('products.brand'),
        accessorKey: 'brandName',
        sortable: true,
        cell: (row) => row.brandName || '-',
      },
      {
        id: 'unitPrice',
        header: t('products.price'),
        accessorKey: 'unitPrice',
        sortable: true,
        cell: (row) => (
          <span className="font-medium">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.unitPrice)}
          </span>
        ),
      },
      {
        id: 'stockQuantity',
        header: t('products.stock'),
        accessorKey: 'stockQuantity',
        sortable: true,
        cell: (row) => (
          <span className={row.stockQuantity && row.stockQuantity < 10 ? 'text-destructive font-medium' : ''}>
            {row.stockQuantity ?? '-'}
          </span>
        ),
      },
      {
        id: 'isActive',
        header: t('common.status'),
        accessorKey: 'isActive',
        sortable: true,
        cell: (row) => <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />,
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: '/products/$productId', params: { productId: String(row.id) } })
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.edit')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingProduct(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('common.delete')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ),
        className: 'w-24',
      },
    ],
    [navigate, t]
  )

  const filters = (
    <FormSelect
      value={searchParams.isActive === undefined ? '' : searchParams.isActive.toString()}
      onChange={(e) => handleActiveFilter(e.target.value)}
      options={[
        { value: '', label: t('common.allStatuses') },
        { value: 'true', label: t('common.active') },
        { value: 'false', label: t('common.inactive') },
      ]}
      className="w-32"
    />
  )

  const actions = (
    <button
      onClick={() => navigate({ to: '/products/new' as any })}
      className="btn-primary"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
      {t('products.newProduct')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('products.title')}
        description={t('products.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={productsData?.data || productsData?.items || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={productsData?.totalCount || 0}
        totalPages={productsData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('products.searchPlaceholder')}
        filters={filters}
        onRowClick={handleRowClick}
        emptyMessage={t('products.noProductsFound')}
        emptyDescription={t('products.createFirst')}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
        itemName={deletingProduct?.name || 'this product'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
