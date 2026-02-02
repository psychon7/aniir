import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { SupplierForm } from '@/components/features/suppliers/SupplierForm'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, useExportSuppliers, useSupplierTypes } from '@/hooks/useSuppliers'
import { useSocieties } from '@/hooks/useLookups'
import type { Supplier, SupplierCreateDto, SupplierSearchParams } from '@/types/supplier'

export const Route = createFileRoute('/_authenticated/suppliers/')({
  component: SuppliersPage,
})

function SuppliersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<SupplierSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'companyName',
    sortOrder: 'asc',
  })

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)

  // Data fetching
  const { data: suppliersData, isLoading } = useSuppliers(searchParams)
  const { data: supplierTypes = [] } = useSupplierTypes()
  const { data: societies = [] } = useSocieties()

  // Mutations
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const deleteMutation = useDeleteSupplier()
  const exportMutation = useExportSuppliers()

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

  // Handle filter changes
  const handleTypeFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      supplierTypeId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  const handleSocietyFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      societyId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  const handleActiveFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      isActive: value === '' ? undefined : value === 'true',
      page: 1,
    }))
  }

  // Handle row click
  const handleRowClick = (supplier: Supplier) => {
    navigate({ to: '/suppliers/$supplierId', params: { supplierId: String(supplier.id) } })
  }

  // Handle create/edit
  const handleOpenCreate = () => {
    setEditingSupplier(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: SupplierCreateDto) => {
    try {
      if (editingSupplier) {
        await updateMutation.mutateAsync({ ...data, id: editingSupplier.id })
        success(t('suppliers.updateSuccess'), t('suppliers.updateSuccessDescription'))
      } else {
        await createMutation.mutateAsync(data)
        success(t('suppliers.createSuccess'), t('suppliers.createSuccessDescription'))
      }
      setIsFormOpen(false)
      setEditingSupplier(null)
    } catch (err) {
      showError(t('common.error'), t('suppliers.saveError'))
    }
  }

  // Handle delete
  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return

    try {
      await deleteMutation.mutateAsync(deletingSupplier.id)
      success(t('suppliers.deleteSuccess'), t('suppliers.deleteSuccessDescription'))
      setDeletingSupplier(null)
    } catch (err) {
      showError(t('common.error'), t('suppliers.deleteError'))
    }
  }

  // Handle export
  const handleExport = () => {
    exportMutation.mutate(searchParams, {
      onSuccess: () => success(t('common.exportComplete'), t('suppliers.exportSuccess')),
      onError: () => showError(t('common.exportFailed'), t('suppliers.exportError')),
    })
  }

  // Table columns
  const columns = useMemo<Column<Supplier>[]>(
    () => [
      {
        id: 'reference',
        header: t('suppliers.reference'),
        accessorKey: 'reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference}</span>
        ),
      },
      {
        id: 'companyName',
        header: t('suppliers.companyName'),
        accessorKey: 'companyName',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.companyName}</p>
            {row.abbreviation && (
              <p className="text-sm text-muted-foreground">{row.abbreviation}</p>
            )}
          </div>
        ),
      },
      {
        id: 'city',
        header: t('suppliers.location'),
        accessorKey: 'city',
        sortable: true,
        cell: (row) => (
          <div className="text-sm">
            {row.city && <span>{row.city}</span>}
            {row.city && row.country && <span>, </span>}
            {row.country && <span className="text-muted-foreground">{row.country}</span>}
          </div>
        ),
      },
      {
        id: 'supplierTypeName',
        header: t('suppliers.type'),
        accessorKey: 'supplierTypeName',
        sortable: true,
        cell: (row) => row.supplierTypeName || '-',
      },
      {
        id: 'email',
        header: t('suppliers.email'),
        accessorKey: 'email',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{row.email || '-'}</span>
        ),
      },
      {
        id: 'phone',
        header: t('suppliers.phone'),
        accessorKey: 'phone',
        sortable: false,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{row.phone || '-'}</span>
        ),
      },
      {
        id: 'isActive',
        header: t('common.status'),
        accessorKey: 'isActive',
        sortable: true,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />
            {row.isBlocked && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-destructive/10 text-destructive">
                {t('suppliers.blocked')}
              </span>
            )}
          </div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingSupplier(row)
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
    [t]
  )

  // Filter components
  const filters = (
    <>
      <FormSelect
        value={searchParams.supplierTypeId?.toString() || ''}
        onChange={(e) => handleTypeFilter(e.target.value)}
        options={[
          { value: '', label: t('suppliers.allTypes') },
          ...supplierTypes.map((type) => ({ value: type.key, label: type.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.societyId?.toString() || ''}
        onChange={(e) => handleSocietyFilter(e.target.value)}
        options={[
          { value: '', label: t('suppliers.allSocieties') },
          ...societies.map((s) => ({ value: s.key, label: s.value })),
        ]}
        className="w-40"
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
    </>
  )

  // Action buttons
  const actions = (
    <>
      <button onClick={handleExport} className="btn-secondary" disabled={exportMutation.isPending}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t('common.export')}
      </button>
      <button onClick={handleOpenCreate} className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        {t('suppliers.newSupplier')}
      </button>
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('suppliers.title')}
        description={t('suppliers.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={suppliersData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={suppliersData?.totalCount || 0}
        totalPages={suppliersData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('suppliers.searchPlaceholder')}
        filters={filters}
        onRowClick={handleRowClick}
        emptyMessage={t('suppliers.noSuppliersFound')}
        emptyDescription={t('suppliers.createFirst')}
      />

      {/* Create/Edit Form Modal */}
      <SupplierForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingSupplier(null)
        }}
        onSubmit={handleFormSubmit}
        supplier={editingSupplier}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingSupplier?.companyName || 'this supplier'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
