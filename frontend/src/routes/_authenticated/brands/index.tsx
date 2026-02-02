import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { BrandForm } from '@/components/features/brands/BrandForm'
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '@/hooks/useBrands'
import type { Brand, BrandCreateDto, BrandSearchParams } from '@/types/brand'

export const Route = createFileRoute('/_authenticated/brands/')({
  component: BrandsPage,
})

function BrandsPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<BrandSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'braName',
    sortOrder: 'asc',
  })

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)

  // Data fetching
  const { data: brandsData = [], isLoading } = useBrands(searchParams)

  // Mutations
  const createMutation = useCreateBrand()
  const updateMutation = useUpdateBrand()
  const deleteMutation = useDeleteBrand()

  // Filter brands based on search
  const filteredBrands = useMemo(() => {
    if (!searchParams.search) return brandsData
    const searchLower = searchParams.search.toLowerCase()
    return brandsData.filter(
      (brand) =>
        brand.braName.toLowerCase().includes(searchLower) ||
        brand.braCode.toLowerCase().includes(searchLower)
    )
  }, [brandsData, searchParams.search])

  // Handle search
  const handleSearch = (search: string) => {
    setSearchParams((prev) => ({ ...prev, search, page: 1 }))
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }))
  }

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, pageSize, page: 1 }))
  }

  // Handle sort change
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSearchParams((prev) => ({ ...prev, sortBy, sortOrder }))
  }

  // Handle create/edit
  const handleOpenCreate = () => {
    setEditingBrand(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: BrandCreateDto) => {
    try {
      if (editingBrand) {
        await updateMutation.mutateAsync({
          id: editingBrand.braId,
          data: { ...data, braId: editingBrand.braId },
        })
        success(t('brands.updateSuccess'), t('brands.updateSuccessMessage'))
      } else {
        await createMutation.mutateAsync(data)
        success(t('brands.createSuccess'), t('brands.createSuccessMessage'))
      }
      setIsFormOpen(false)
      setEditingBrand(null)
    } catch (err) {
      showError(t('common.error'), t('brands.saveError'))
    }
  }

  // Handle delete
  const handleConfirmDelete = async () => {
    if (!deletingBrand) return

    try {
      await deleteMutation.mutateAsync(deletingBrand.braId)
      success(t('brands.deleteSuccess'), t('brands.deleteSuccessMessage'))
      setDeletingBrand(null)
    } catch (err) {
      showError(t('common.error'), t('brands.deleteError'))
    }
  }

  // Table columns
  const columns = useMemo<Column<Brand>[]>(
    () => [
      {
        id: 'braCode',
        header: t('brands.code'),
        accessorKey: 'braCode',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.braCode}</span>
        ),
      },
      {
        id: 'braName',
        header: t('brands.name'),
        accessorKey: 'braName',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.braName}</p>
            {row.braDescription && (
              <p className="text-sm text-muted-foreground truncate max-w-xs">
                {row.braDescription}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'braIsActived',
        header: t('common.status'),
        accessorKey: 'braIsActived',
        sortable: true,
        cell: (row) => (
          <StatusBadge status={row.braIsActived ? 'Active' : 'Inactive'} />
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
                handleOpenEdit(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.edit')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingBrand(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('common.delete')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ),
        className: 'w-24',
      },
    ],
    [t]
  )

  // Action buttons
  const actions = (
    <button onClick={handleOpenCreate} className="btn-primary">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
      {t('brands.newBrand')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('nav.brands', 'Brands')}
        description={t('brands.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={filteredBrands}
        keyField="braId"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={filteredBrands.length}
        totalPages={Math.ceil(filteredBrands.length / (searchParams.pageSize || 10))}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('brands.searchPlaceholder')}
        emptyMessage={t('brands.noBrandsFound')}
        emptyDescription={t('brands.createFirst')}
      />

      {/* Create/Edit Form Modal */}
      <BrandForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingBrand(null)
        }}
        onSubmit={handleFormSubmit}
        brand={editingBrand}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deletingBrand}
        onClose={() => setDeletingBrand(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingBrand?.braName || 'this brand'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
