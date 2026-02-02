import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { StatementForm } from '@/components/features/statements/StatementForm'
import {
  useStatements,
  useCreateStatement,
  useUpdateStatement,
  useDeleteStatement,
  useExportStatements,
} from '@/hooks/useStatements'
import { useStatementStatuses, useStatementTypes } from '@/hooks/useStatementLookups'
import { useBusinessUnits } from '@/hooks/useLookups'
import type { Statement, StatementCreateDto, StatementSearchParams } from '@/types/statement'

export const Route = createFileRoute('/_authenticated/accounting/statements/')({
  component: StatementsPage,
})

function StatementsPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<StatementSearchParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'statementDate',
    sortOrder: 'desc',
  })

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStatement, setEditingStatement] = useState<Statement | null>(null)
  const [deletingStatement, setDeletingStatement] = useState<Statement | null>(null)

  // Data fetching
  const { data: statementsData, isLoading } = useStatements(searchParams)
  const { data: statuses = [] } = useStatementStatuses()
  const { data: statementTypes = [] } = useStatementTypes()
  const { data: businessUnits = [] } = useBusinessUnits()

  // Mutations
  const createMutation = useCreateStatement()
  const updateMutation = useUpdateStatement()
  const deleteMutation = useDeleteStatement()
  const exportMutation = useExportStatements()

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
      statementTypeId: value ? Number(value) : undefined,
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

  // Handle create/edit
  const handleOpenCreate = () => {
    setEditingStatement(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (statement: Statement) => {
    setEditingStatement(statement)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: StatementCreateDto) => {
    try {
      if (editingStatement) {
        await updateMutation.mutateAsync({ ...data, id: editingStatement.id })
        success(t('statements.statementUpdated'), t('statements.statementUpdatedDesc'))
      } else {
        await createMutation.mutateAsync(data)
        success(t('statements.statementCreated'), t('statements.statementCreatedDesc'))
      }
      setIsFormOpen(false)
      setEditingStatement(null)
    } catch {
      showError(t('common.error'), t('statements.saveError'))
    }
  }

  // Handle delete
  const handleConfirmDelete = async () => {
    if (!deletingStatement) return

    try {
      await deleteMutation.mutateAsync(deletingStatement.id)
      success(t('statements.statementDeleted'), t('statements.statementDeletedDesc'))
      setDeletingStatement(null)
    } catch {
      showError(t('common.error'), t('statements.deleteError'))
    }
  }

  // Handle export
  const handleExport = () => {
    exportMutation.mutate(searchParams, {
      onSuccess: () => success(t('statements.exportComplete'), t('statements.exportCompleteDesc')),
      onError: () => showError(t('statements.exportFailed'), t('statements.exportFailedDesc')),
    })
  }

  // Format currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Format date range for period
  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
    })
    const endDate = new Date(end).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${startDate} - ${endDate}`
  }

  // Table columns
  const columns = useMemo<Column<Statement>[]>(
    () => [
      {
        id: 'reference',
        header: t('statements.reference'),
        accessorKey: 'reference',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference}</span>
        ),
      },
      {
        id: 'clientName',
        header: t('statements.client'),
        accessorKey: 'clientName',
        sortable: true,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.clientName}</p>
            <p className="text-sm text-muted-foreground">{row.statementTypeName}</p>
          </div>
        ),
      },
      {
        id: 'period',
        header: t('statements.period'),
        accessorKey: 'periodStart',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {formatPeriod(row.periodStart, row.periodEnd)}
          </span>
        ),
      },
      {
        id: 'openingBalance',
        header: t('statements.openingBalance'),
        accessorKey: 'openingBalance',
        sortable: true,
        cell: (row) => (
          <span className={`font-medium ${row.openingBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {formatAmount(row.openingBalance, row.currencyCode)}
          </span>
        ),
        className: 'text-right',
      },
      {
        id: 'closingBalance',
        header: t('statements.closingBalance'),
        accessorKey: 'closingBalance',
        sortable: true,
        cell: (row) => (
          <span className={`font-medium ${row.closingBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
            {formatAmount(row.closingBalance, row.currencyCode)}
          </span>
        ),
        className: 'text-right',
      },
      {
        id: 'statementDate',
        header: t('statements.date'),
        accessorKey: 'statementDate',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.statementDate)}</span>
        ),
      },
      {
        id: 'statusName',
        header: t('statements.status'),
        accessorKey: 'statusName',
        sortable: true,
        cell: (row) => <StatusBadge status={row.statusName} />,
      },
      {
        id: 'actions',
        header: t('common.actions'),
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
                setDeletingStatement(row)
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
          { value: '', label: t('statements.allStatuses') },
          ...statuses.map((s) => ({ value: s.key, label: s.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.statementTypeId?.toString() || ''}
        onChange={(e) => handleTypeFilter(e.target.value)}
        options={[
          { value: '', label: t('statements.allTypes') },
          ...statementTypes.map((t) => ({ value: t.key, label: t.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.businessUnitId?.toString() || ''}
        onChange={(e) => handleBusinessUnitFilter(e.target.value)}
        options={[
          { value: '', label: t('statements.allUnits') },
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
        {t('statements.newStatement')}
      </button>
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('statements.title')}
        description={t('statements.description')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={statementsData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page}
        pageSize={searchParams.pageSize}
        totalCount={statementsData?.totalCount || 0}
        totalPages={statementsData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('statements.searchStatements')}
        filters={filters}
        onRowClick={handleOpenEdit}
        emptyMessage={t('statements.noStatementsFound')}
        emptyDescription={t('statements.getStartedStatements')}
      />

      {/* Create/Edit Form Modal */}
      <StatementForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingStatement(null)
        }}
        onSubmit={handleFormSubmit}
        statement={editingStatement}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deletingStatement}
        onClose={() => setDeletingStatement(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingStatement?.reference || t('statements.thisStatement')}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
