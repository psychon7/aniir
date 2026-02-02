import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { useProjects, useDeleteProject } from '@/hooks/useProjects'
import type { Project, ProjectSearchParams } from '@/types/project'

export const Route = createFileRoute('/_authenticated/projects/')({
  component: ProjectsPage,
})

function ProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [searchParams, setSearchParams] = useState<ProjectSearchParams>({
    page: 1,
    page_size: 10,
    sort_by: 'prj_d_creation',
    sort_order: 'desc',
  })

  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  // Data fetching with hooks
  const { data: projectsData, isLoading } = useProjects(searchParams)
  const deleteMutation = useDeleteProject()

  const handleSearch = (search: string) => {
    setSearchParams((prev) => ({ ...prev, search, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, page_size: pageSize, page: 1 }))
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSearchParams((prev) => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }))
  }

  const handleRowClick = (project: Project) => {
    navigate({ to: '/projects/$projectId' as any, params: { projectId: String(project.id) } })
  }

  const handleConfirmDelete = async () => {
    if (!deletingProject) return
    try {
      await deleteMutation.mutateAsync(deletingProject.id)
      success(t('projects.projectDeleted'), t('projects.projectDeletedDescription'))
      setDeletingProject(null)
    } catch {
      showError(t('common.error'), t('projects.deleteError'))
    }
  }

  const columns = useMemo<Column<Project>[]>(
    () => [
      {
        id: 'code',
        header: t('projects.reference'),
        accessorKey: 'code',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.code}</span>
        ),
      },
      {
        id: 'name',
        header: t('projects.project'),
        accessorKey: 'name',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        id: 'clientName',
        header: t('projects.client'),
        accessorKey: 'clientName',
        sortable: true,
        cell: (row) => row.clientName || '-',
      },
      {
        id: 'createdAt',
        header: t('projects.created'),
        accessorKey: 'createdAt',
        sortable: true,
        cell: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-',
      },
      {
        id: 'paymentTermName',
        header: t('projects.paymentTerm'),
        accessorKey: 'paymentTermName',
        sortable: false,
        cell: (row) => row.paymentTermName || '-',
      },
      {
        id: 'actions',
        header: t('common.actions'),
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: '/projects/$projectId' as any, params: { projectId: String(row.id) } })
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.view')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingProject(row)
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

  const actions = (
    <button
      onClick={() => navigate({ to: '/projects/new' as any })}
      className="btn-primary"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
      {t('projects.newProject')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('projects.title')}
        description={t('projects.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={projectsData?.data || []}
        keyField="id"
        isLoading={isLoading}
        page={searchParams.page || 1}
        pageSize={searchParams.page_size || 10}
        totalCount={projectsData?.totalCount || 0}
        totalPages={projectsData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={searchParams.sort_by}
        sortOrder={searchParams.sort_order}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('projects.searchProjects')}
        onRowClick={handleRowClick}
        emptyMessage={t('projects.noProjectsFound')}
        emptyDescription={t('projects.createFirst')}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingProject?.name || 'this project'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
