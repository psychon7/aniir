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
import { useUsers, useDeleteUser, useRolesLookup } from '@/hooks/useUsers'
import { useSocieties } from '@/hooks/useLookups'
import type { UserListItem, UserListParams } from '@/types/user'

export const Route = createFileRoute('/_authenticated/settings/users/')({
  component: UsersPage,
})

function UsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  // Search and filter state
  const [searchParams, setSearchParams] = useState<UserListParams>({
    skip: 0,
    limit: 10,
  })

  // Modal state
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null)

  // Data fetching
  const { data: usersData, isLoading } = useUsers(searchParams)
  const { data: roles = [] } = useRolesLookup(false)
  const { data: societies = [] } = useSocieties()

  // Mutations
  const deleteMutation = useDeleteUser()

  // Calculate page from skip/limit
  const page = Math.floor((searchParams.skip || 0) / (searchParams.limit || 10)) + 1

  // Handle search
  const handleSearch = (search: string) => {
    setSearchParams((prev) => ({ ...prev, search: search || undefined, skip: 0 }))
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => ({ ...prev, skip: (newPage - 1) * (prev.limit || 10) }))
  }

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, limit: pageSize, skip: 0 }))
  }

  // Handle filter changes
  const handleRoleFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      role_id: value ? Number(value) : undefined,
      skip: 0,
    }))
  }

  const handleSocietyFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      society_id: value ? Number(value) : undefined,
      skip: 0,
    }))
  }

  const handleActiveFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      is_active: value === '' ? undefined : value === 'true',
      skip: 0,
    }))
  }

  const handleAdminFilter = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      is_admin: value === '' ? undefined : value === 'true',
      skip: 0,
    }))
  }

  // Handle row click
  const handleRowClick = (user: UserListItem) => {
    navigate({ to: '/settings/users/$userId', params: { userId: String(user.id) } })
  }

  // Handle create
  const handleOpenCreate = () => {
    navigate({ to: '/settings/users/new' })
  }

  // Handle delete
  const handleConfirmDelete = async () => {
    if (!deletingUser) return

    try {
      await deleteMutation.mutateAsync(deletingUser.id)
      success(t('users.deleteSuccess'), t('users.deleteSuccessDescription'))
      setDeletingUser(null)
    } catch (err) {
      showError(t('common.error'), t('users.deleteError'))
    }
  }

  // Table columns
  const columns = useMemo<Column<UserListItem>[]>(
    () => [
      {
        id: 'login',
        header: t('users.login'),
        accessorKey: 'login',
        sortable: false,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.login}</span>
        ),
      },
      {
        id: 'fullName',
        header: t('users.name'),
        accessorKey: 'fullName',
        sortable: false,
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.fullName || '-'}</p>
            {row.email && (
              <p className="text-sm text-muted-foreground">{row.email}</p>
            )}
          </div>
        ),
      },
      {
        id: 'roleName',
        header: t('users.role'),
        accessorKey: 'roleName',
        sortable: false,
        cell: (row) => (
          <span className={row.isAdmin ? 'font-medium text-primary' : ''}>
            {row.roleName || '-'}
            {row.isAdmin && (
              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded bg-primary/10 text-primary">
                {t('users.admin')}
              </span>
            )}
          </span>
        ),
      },
      {
        id: 'societyName',
        header: t('users.society'),
        accessorKey: 'societyName',
        sortable: false,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{row.societyName || '-'}</span>
        ),
      },
      {
        id: 'isActive',
        header: t('common.status'),
        accessorKey: 'isActive',
        sortable: false,
        cell: (row) => (
          <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />
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
                navigate({ to: '/settings/users/$userId', params: { userId: String(row.id) } })
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.edit')}
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingUser(row)
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
    [t, navigate]
  )

  // Filter components
  const filters = (
    <>
      <FormSelect
        value={searchParams.role_id?.toString() || ''}
        onChange={(e) => handleRoleFilter(e.target.value)}
        options={[
          { value: '', label: t('users.allRoles') },
          ...roles.map((role) => ({ value: String(role.id), label: role.name })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.society_id?.toString() || ''}
        onChange={(e) => handleSocietyFilter(e.target.value)}
        options={[
          { value: '', label: t('users.allSocieties') },
          ...societies.map((s) => ({ value: s.key, label: s.value })),
        ]}
        className="w-40"
      />
      <FormSelect
        value={searchParams.is_active === undefined ? '' : searchParams.is_active.toString()}
        onChange={(e) => handleActiveFilter(e.target.value)}
        options={[
          { value: '', label: t('common.allStatuses') },
          { value: 'true', label: t('common.active') },
          { value: 'false', label: t('common.inactive') },
        ]}
        className="w-32"
      />
      <FormSelect
        value={searchParams.is_admin === undefined ? '' : searchParams.is_admin.toString()}
        onChange={(e) => handleAdminFilter(e.target.value)}
        options={[
          { value: '', label: t('users.allUserTypes') },
          { value: 'true', label: t('users.adminsOnly') },
          { value: 'false', label: t('users.regularUsers') },
        ]}
        className="w-36"
      />
    </>
  )

  // Action buttons
  const actions = (
    <button onClick={handleOpenCreate} className="btn-primary">
      <PlusIcon className="w-4 h-4" />
      {t('users.newUser')}
    </button>
  )

  const totalCount = usersData?.total || 0
  const pageSize = searchParams.limit || 10
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <PageContainer>
      <PageHeader
        title={t('users.title')}
        description={t('users.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={usersData?.items || []}
        keyField="id"
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('users.searchPlaceholder')}
        filters={filters}
        onRowClick={handleRowClick}
        emptyMessage={t('users.noUsersFound')}
        emptyDescription={t('users.createFirst')}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingUser?.fullName || deletingUser?.login || 'this user'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}

// Icon components
function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  )
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  )
}
