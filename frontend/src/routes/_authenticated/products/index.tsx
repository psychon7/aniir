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
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories'
import type { Category } from '@/types/category'
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
  unitPrice?: number | null
  costPrice?: number | null
  stockQuantity?: number | null
  isActive: boolean
  createdAt?: string
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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    parentId: '',
    order: 0,
    imagePath: '',
    description: '',
    displayInMenu: true,
    displayInExhibition: false,
    isActive: true,
  })

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

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({
    limit: 500,
    skip: 0,
  })
  const categories = categoriesData?.items || []

  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()

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

  const handleCategoryFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      categoryId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      parentId: '',
      order: 0,
      imagePath: '',
      description: '',
      displayInMenu: true,
      displayInExhibition: false,
      isActive: true,
    })
    setEditingCategory(null)
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.cat_name || '',
      parentId: category.cat_parent_cat_id ? String(category.cat_parent_cat_id) : '',
      order: category.cat_order || 0,
      imagePath: category.cat_image_path || '',
      description: category.cat_description || '',
      displayInMenu: category.cat_display_in_menu ?? true,
      displayInExhibition: category.cat_display_in_exhibition ?? false,
      isActive: category.cat_is_actived ?? true,
    })
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      showError(t('common.error'), t('products.categoryNameRequired', 'Category name is required'))
      return
    }

    const payload = {
      name: categoryForm.name.trim(),
      order: categoryForm.order || 0,
      imagePath: categoryForm.imagePath || undefined,
      description: categoryForm.description || undefined,
      displayInMenu: categoryForm.displayInMenu,
      displayInExhibition: categoryForm.displayInExhibition,
      isActive: categoryForm.isActive,
      parentId: categoryForm.parentId ? Number(categoryForm.parentId) : undefined,
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          categoryId: editingCategory.cat_id,
          data: payload,
        })
        success(t('products.categoryUpdated', 'Category updated'), t('products.categoryUpdatedDescription', 'Category has been updated successfully.'))
      } else {
        await createCategoryMutation.mutateAsync(payload)
        success(t('products.categoryCreated', 'Category created'), t('products.categoryCreatedDescription', 'Category has been created successfully.'))
      }
      resetCategoryForm()
    } catch {
      showError(t('common.error'), t('products.categorySaveError', 'Failed to save category.'))
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    try {
      await deleteCategoryMutation.mutateAsync(category.cat_id)
      success(t('products.categoryDeleted', 'Category deleted'), t('products.categoryDeletedDescription', 'Category has been deleted successfully.'))
      if (editingCategory?.cat_id === category.cat_id) resetCategoryForm()
    } catch {
      showError(t('common.error'), t('products.categoryDeleteError', 'Failed to delete category.'))
    }
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
            {row.unitPrice != null
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.unitPrice)
              : '-'}
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
    <div className="flex items-center gap-2">
      <FormSelect
        value={searchParams.categoryId ? String(searchParams.categoryId) : ''}
        onChange={(e) => handleCategoryFilter(e.target.value)}
        options={[
          { value: '', label: t('products.allCategories', 'All categories') },
          ...categories.map((category) => ({ value: String(category.cat_id), label: category.cat_name })),
        ]}
        className="w-44"
      />
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
      <button
        type="button"
        onClick={() => setIsCategoryModalOpen(true)}
        className="btn-secondary"
      >
        {t('products.manageCategories', 'Manage Categories')}
      </button>
    </div>
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

      <FormModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false)
          resetCategoryForm()
        }}
        title={t('products.manageCategories', 'Manage Categories')}
        description={t('products.manageCategoriesDescription', 'Create, update and organize product categories.')}
        size="xl"
        footer={
          <FormModalFooter
            onCancel={() => {
              setIsCategoryModalOpen(false)
              resetCategoryForm()
            }}
            onSubmit={handleSaveCategory}
            submitText={editingCategory ? t('common.saveChanges') : t('common.create', 'Create')}
            isSubmitting={createCategoryMutation.isPending || updateCategoryMutation.isPending}
          />
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">{t('products.categories', 'Categories')}</h4>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => resetCategoryForm()}
              >
                {t('common.new', 'New')}
              </button>
            </div>
            {categoriesLoading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('products.noCategoriesFound', 'No categories found')}</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.cat_id}
                  className={`rounded-lg border p-3 ${
                    editingCategory?.cat_id === category.cat_id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="text-left min-w-0"
                      onClick={() => startEditCategory(category)}
                    >
                      <p className="font-medium text-sm text-foreground truncate">{category.cat_name}</p>
                      <p className="text-xs text-muted-foreground">
                        #{category.cat_id}
                        {category.cat_parent_cat_id ? ` | Parent: ${category.cat_parent_cat_id}` : ''}
                      </p>
                    </button>
                    <button
                      type="button"
                      className="text-xs text-destructive hover:underline"
                      onClick={() => handleDeleteCategory(category)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              {editingCategory
                ? t('products.editCategory', 'Edit Category')
                : t('products.newCategory', 'New Category')}
            </h4>

            <FormInput
              label={t('products.categoryName', 'Category Name')}
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />

            <FormSelect
              label={t('products.parentCategory', 'Parent Category')}
              value={categoryForm.parentId}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, parentId: e.target.value }))}
              options={[
                { value: '', label: t('products.noParent', 'No parent') },
                ...categories
                  .filter((category) => category.cat_id !== editingCategory?.cat_id)
                  .map((category) => ({ value: String(category.cat_id), label: category.cat_name })),
              ]}
            />

            <FormInput
              label={t('products.displayOrder', 'Display Order')}
              type="number"
              value={String(categoryForm.order)}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, order: Number(e.target.value || 0) }))}
            />

            <FormInput
              label={t('products.imageUrl', 'Image URL')}
              value={categoryForm.imagePath}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, imagePath: e.target.value }))}
              placeholder="https://..."
            />

            <FormInput
              label={t('products.description', 'Description')}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div className="grid grid-cols-1 gap-2 pt-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={categoryForm.displayInMenu}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, displayInMenu: e.target.checked }))}
                />
                {t('products.displayInMenu', 'Display In Menu')}
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={categoryForm.displayInExhibition}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, displayInExhibition: e.target.checked }))}
                />
                {t('products.displayInExhibition', 'Display In Exhibition')}
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                {t('common.active')}
              </label>
            </div>
          </div>
        </div>
      </FormModal>
    </PageContainer>
  )
}
