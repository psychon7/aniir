import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useProject } from '@/hooks/useProjects'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()

  const { data: project, isLoading } = useProject(Number(projectId))

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </PageContainer>
    )
  }

  if (!project) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <button onClick={() => navigate({ to: '/projects' as any })} className="btn-primary mt-4">
            Back to Projects
          </button>
        </div>
      </PageContainer>
    )
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/projects' as any })} className="btn-secondary">
        Back
      </button>
      <button className="btn-primary">Edit Project</button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={project.name}
        description={`Code: ${project.code}`}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Project Details" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Code</dt>
                  <dd className="font-mono">{project.code}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd className="font-medium">{project.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Client</dt>
                  <dd>{project.clientName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Created By</dt>
                  <dd>{project.creatorName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Payment Term</dt>
                  <dd>{project.paymentTermName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Payment Mode</dt>
                  <dd>{project.paymentModeName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">VAT Rate</dt>
                  <dd>{project.vatRateName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Society</dt>
                  <dd>{project.societyName || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Metadata" />
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="text-sm">{new Date(project.createdAt).toLocaleDateString()}</dd>
                </div>
                {project.updatedAt && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Last Updated</dt>
                    <dd className="text-sm">{new Date(project.updatedAt).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
