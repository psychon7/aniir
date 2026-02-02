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
import { ClientForm } from '@/components/features/clients/ClientForm'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useExportClients } from '@/hooks/useClients'
import { useClientStatuses, useClientTypes, useBusinessUnits } from '@/hooks/useLookups'
import type { Client, ClientCreateDto, ClientSearchParams } from '@/types/client'

export const Route = createFileRoute('/_authenticated/clients/')({
  component: ClientsPage,
})

function ClientsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<ClientSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'companyName',
    sortOrder: 'asc',
  })

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)

  // Data fetching
  const { data: clientsData, isLoading } = useClients(searchParams)
  const { data: statuses = [] } = useClientStatuses()
  const { data: clientTypes = [] } = useClientTypes()
  const { data: businessUnits = [] } = useBusinessUnits()

  // Mutations
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()
  const exportMutation = useExportClients()

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
  const handleStatusFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      statusId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  const handleTypeFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      clientTypeId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  const handleBusinessUnitFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      businessUnitId: value ? Number(value) : undefined,
      page: 1,
    }))
  }

  // Handle row click
  const handleRowClick = (client: Client) => {
    navigate({ to: '/clients/$clientId', params: { clientId: String(client.id) } })
  }

  // Handle create/edit
  const handleOpenCreate = () => {
    setEditingClient(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: ClientCreateDto) => {
    try {
      if (editingClient) {
        await updateMutation.mutateAsync({ ...data, id: editingClient.id })
        success(t('clients.clientUpdated'), t('clients.clientUpdatedDesc'))
      } else {
        await createMutation.mutateAsync(data)
        success(t('clients.clientCreated'), t('clients.clientCreatedDesc'))
      }
      setIsFormOpen(false)
      setEditingClient(null)
    } catch (err) {
      showError(t('common.error'), t('errors.saveError'))
    }
  }

  // Handle delete
  const handleConfirmDelete = async () => {
    if (!deletingClient) return

    try {
      await deleteMutation.mutateAsync(deletingClient.id)
      success(t('clients.clientDeleted'), t('clients.clientDeletedDesc'))
      setDeletingClient(null)
    } catch (err) {
      showError(t('common.error'), t('errors.deleteError'))
    }
  }

  // Handle export
  const handleExport = () => {
    exportMutation.mutate(searchParams, {
      onSuccess: () => success(t('clients.exportComplete'), t('clients.exportCompleteDesc')),
      onError: () => showError(t('clients.exportFailed'), t('errors.exportError')),
    })
  }

  // Table columns
  const columns = useMemo<Column<Client>[]>(
    () => [
      {
        id: 'reference',
        header: t('clients.reference'),
        accessorKey: 'reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference}</span>
        ),
      },
      {
        id: 'companyName',
        header: t('clients.companyName'),
        accessorKey: 'companyName',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.companyName}</p>
            {row.email && (
              <p className="text-sm text-muted-foreground">{row.email}</p>
            )}
          </div>
        ),
      },
      {
        id: 'city',
        header: t('clients.location'),
        accessorKey: 'city',
        sortable: true,
        cell: (row) => (
          <div className="text-sm">
            {row.city && <span>{row.city}</span>}
            {row.city && row.countryName && <span>, </span>}
            {row.countryName && <span className="text-muted-foreground">{row.countryName}</span>}
          </div>
        ),
      },
      {
        id: 'clientTypeName',
        header: t('clients.clientType'),
        accessorKey: 'clientTypeName',
        sortable: true,
        cell: (row) => row.clientTypeName || '-',
      },
      {
        id: 'businessUnitName',
        header: t('clients.businessUnit'),
        accessorKey: 'businessUnitName',
        sortable: true,
        cell: (row) => row.businessUnitName || '-',
      },
      {
        id: 'statusName',
        header: t('common.status'),
        accessorKey: 'statusName',
        sortable: true,
        cell: (row) => <StatusBadge status={row.statusName} />,
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
                setDeletingClient(row)
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
        value={searchParams.statusId?.toString() || ''}
        onChange={(e) => handleStatusFilter(e.target.value)}
        options={[
          { value: '', label: t('clients.allStatuses') },
          ...statuses.map((s) => ({ value: s.key, label: s.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.clientTypeId?.toString() || ''}
        onChange={(e) => handleTypeFilter(e.target.value)}
        options={[
          { value: '', label: t('clients.allTypes') },
          ...clientTypes.map((t) => ({ value: t.key, label: t.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.businessUnitId?.toString() || ''}
        onChange={(e) => handleBusinessUnitFilter(e.target.value)}
        options={[
          { value: '', label: t('clients.allUnits') },
          ...businessUnits.map((u) => ({ value: u.key, label: u.value })),
        ]}
        className="w-40"
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
        {t('clients.newClient')}
      </button>
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('clients.title')}
        description={t('clients.manageDatabase')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={clientsData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={clientsData?.totalCount || 0}
        totalPages={clientsData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('clients.searchClients')}
        filters={filters}
        onRowClick={handleRowClick}
        emptyMessage={t('clients.noClientsFound')}
        emptyDescription={t('clients.createFirstClient')}
      />

      {/* Create/Edit Form Modal */}
      <ClientForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingClient(null)
        }}
        onSubmit={handleFormSubmit}
        client={editingClient}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingClient?.companyName || 'this client'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
