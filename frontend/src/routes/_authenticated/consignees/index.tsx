import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { ConsigneeForm } from '@/components/features/consignees/ConsigneeForm'
import { useConsignees, useCreateConsignee, useUpdateConsignee, useDeleteConsignee } from '@/hooks/useConsignees'
import { useSocieties } from '@/hooks/useLookups'
import type { Consignee, ConsigneeCreateDto, ConsigneeSearchParams } from '@/types/consignee'

export const Route = createFileRoute('/_authenticated/consignees/')({
  component: ConsigneesPage,
})

function ConsigneesPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const [searchParams, setSearchParams] = useState<ConsigneeSearchParams>({
    page: 1,
    pageSize: 10,
    sort_by: 'con_firstname',
    sort_order: 'asc',
  })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConsignee, setEditingConsignee] = useState<Consignee | null>(null)
  const [deletingConsignee, setDeletingConsignee] = useState<Consignee | null>(null)

  const { data: consigneesData, isLoading } = useConsignees(searchParams)
  const { data: societies = [] } = useSocieties()

  const createMutation = useCreateConsignee()
  const updateMutation = useUpdateConsignee()
  const deleteMutation = useDeleteConsignee()

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
    setSearchParams((prev) => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }))
  }

  const handleSocietyFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      soc_id: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  const handleDeliveryFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      con_is_delivery_adr: value === '' ? undefined : value === 'true',
      page: 1,
    }))
  }

  const handleInvoiceFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      con_is_invoicing_adr: value === '' ? undefined : value === 'true',
      page: 1,
    }))
  }

  const handleOpenCreate = () => {
    setEditingConsignee(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (consignee: Consignee) => {
    setEditingConsignee(consignee)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: ConsigneeCreateDto) => {
    try {
      if (editingConsignee) {
        await updateMutation.mutateAsync({ id: editingConsignee.con_id, data })
        success(t('consignees.updateSuccess'), t('consignees.updateSuccessDesc'))
      } else {
        await createMutation.mutateAsync(data)
        success(t('consignees.createSuccess'), t('consignees.createSuccessDesc'))
      }
      setIsFormOpen(false)
      setEditingConsignee(null)
    } catch (err) {
      showError(t('common.error'), t('consignees.saveError'))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingConsignee) return

    try {
      await deleteMutation.mutateAsync(deletingConsignee.con_id)
      success(t('consignees.deleteSuccess'), t('consignees.deleteSuccessDesc'))
      setDeletingConsignee(null)
    } catch (err) {
      showError(t('common.error'), t('consignees.deleteError'))
    }
  }

  const columns = useMemo<Column<Consignee>[]>(
    () => [
      {
        id: 'con_code',
        header: t('consignees.code'),
        accessorKey: 'con_code',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.con_code || '-'}</span>
        ),
      },
      {
        id: 'name',
        header: t('consignees.name'),
        accessorKey: 'con_firstname',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">
              {row.con_company_name || `${row.con_firstname || ''} ${row.con_lastname || ''}`.trim() || '-'}
            </p>
            {(row.con_firstname || row.con_lastname) && row.con_company_name && (
              <p className="text-sm text-muted-foreground">
                {`${row.con_firstname || ''} ${row.con_lastname || ''}`.trim()}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'location',
        header: t('consignees.location'),
        accessorKey: 'con_city',
        sortable: true,
        cell: (row) => (
          <div className="text-sm">
            {row.con_city && <span>{row.con_city}</span>}
            {row.con_city && row.con_postcode && <span>, </span>}
            {row.con_postcode && <span className="text-muted-foreground">{row.con_postcode}</span>}
          </div>
        ),
      },
      {
        id: 'contact',
        header: t('consignees.contact'),
        accessorKey: 'con_email',
        cell: (row) => (
          <div className="text-sm">
            {row.con_email && <span className="text-muted-foreground">{row.con_email}</span>}
            {row.con_email && row.con_tel1 && <span className="text-muted-foreground"> · </span>}
            {row.con_tel1 && <span>{row.con_tel1}</span>}
          </div>
        ),
      },
      {
        id: 'flags',
        header: t('consignees.types'),
        cell: (row) => (
          <div className="flex flex-wrap gap-2">
            {row.con_is_delivery_adr && (
              <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                {t('consignees.deliveryShort')}
              </span>
            )}
            {row.con_is_invoicing_adr && (
              <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                {t('consignees.invoiceShort')}
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
                setDeletingConsignee(row)
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

  const filters = (
    <>
      <FormSelect
        value={searchParams.soc_id?.toString() || ''}
        onChange={(e) => handleSocietyFilter(e.target.value)}
        options={[
          { value: '', label: t('consignees.allSocieties') },
          ...societies.map((s) => ({ value: s.key, label: s.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.con_is_delivery_adr === undefined ? '' : String(searchParams.con_is_delivery_adr)}
        onChange={(e) => handleDeliveryFilter(e.target.value)}
        options={[
          { value: '', label: t('consignees.allDelivery') },
          { value: 'true', label: t('consignees.deliveryOnly') },
          { value: 'false', label: t('consignees.notDelivery') },
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.con_is_invoicing_adr === undefined ? '' : String(searchParams.con_is_invoicing_adr)}
        onChange={(e) => handleInvoiceFilter(e.target.value)}
        options={[
          { value: '', label: t('consignees.allInvoicing') },
          { value: 'true', label: t('consignees.invoicingOnly') },
          { value: 'false', label: t('consignees.notInvoicing') },
        ]}
        className="w-40"
      />
    </>
  )

  const actions = (
    <>
      <button onClick={handleOpenCreate} className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        {t('consignees.newConsignee')}
      </button>
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('consignees.title')}
        description={t('consignees.subtitle')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={consigneesData?.data || []}
        keyField="con_id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={consigneesData?.totalCount || 0}
        totalPages={consigneesData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sort_by}
        sortOrder={searchParams.sort_order}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('consignees.searchConsignees')}
        filters={filters}
        onRowClick={handleOpenEdit}
        emptyMessage={t('consignees.noConsignees')}
        emptyDescription={t('consignees.createFirst')}
      />

      <ConsigneeForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingConsignee(null)
        }}
        onSubmit={handleFormSubmit}
        consignee={editingConsignee}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingConsignee}
        onClose={() => setDeletingConsignee(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingConsignee?.con_company_name || deletingConsignee?.con_firstname || 'this consignee'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
