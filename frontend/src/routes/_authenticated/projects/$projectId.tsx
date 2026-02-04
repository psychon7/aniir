import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { useProject } from '@/hooks/useProjects'
import { useQuotesByProject } from '@/hooks/useQuotes'
import { useOrdersByProject } from '@/hooks/useOrders'
import { useInvoicesByProject } from '@/hooks/useInvoices'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: project, isLoading } = useProject(Number(projectId))
  const { data: quotes = [] } = useQuotesByProject(Number(projectId))
  const { data: orders = [] } = useOrdersByProject(Number(projectId))
  const { data: invoices = [] } = useInvoicesByProject(Number(projectId))

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
          <h2 className="text-xl font-semibold">{t('projects.notFound')}</h2>
          <button onClick={() => navigate({ to: '/projects' })} className="btn-primary mt-4">
            {t('common.back')}
          </button>
        </div>
      </PageContainer>
    )
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/projects' })} className="btn-secondary">
        {t('common.back')}
      </button>
      <button className="btn-primary">{t('common.edit')}</button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={project.name}
        description={`${t('projects.code')}: ${project.code}`}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader title={t('projects.details')} />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('projects.code')}</dt>
                  <dd className="font-mono">{project.code}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('projects.name')}</dt>
                  <dd className="font-medium">{project.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('projects.client')}</dt>
                  <dd>{project.clientName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('projects.createdBy')}</dt>
                  <dd>{project.creatorName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('projects.paymentTerm')}</dt>
                  <dd>{project.paymentTermName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('projects.paymentMode')}</dt>
                  <dd>{project.paymentModeName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('projects.vatRate')}</dt>
                  <dd>{project.vatRateName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('projects.society')}</dt>
                  <dd>{project.societyName || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Quotes Section */}
          <Card>
            <CardHeader
              title={t('quotes.title')}
              action={
                <Link
                  to="/quotes/new"
                  search={{ projectId: Number(projectId) }}
                  className="text-sm text-primary hover:underline"
                >
                  {t('quotes.newQuote')}
                </Link>
              }
            />
            <CardContent>
              {quotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('quotes.noQuotesFound')}</p>
              ) : (
                <div className="divide-y divide-border">
                  {quotes.slice(0, 5).map((quote) => (
                    <Link
                      key={quote.id}
                      to="/quotes/$quoteId"
                      params={{ quoteId: String(quote.id) }}
                      className="block py-3 hover:bg-accent/50 -mx-4 px-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm">{quote.reference}</p>
                          <p className="text-xs text-muted-foreground">{quote.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{quote.totalAmount?.toLocaleString()} €</p>
                          <StatusBadge status={quote.statusName || 'Draft'} />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {quotes.length > 5 && (
                    <p className="text-sm text-muted-foreground pt-3">
                      {t('common.andMore', { count: quotes.length - 5 })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Section */}
          <Card>
            <CardHeader
              title={t('orders.title')}
              action={
                <Link
                  to="/orders/new"
                  search={{ projectId: Number(projectId) }}
                  className="text-sm text-primary hover:underline"
                >
                  {t('orders.newOrder')}
                </Link>
              }
            />
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('orders.noOrdersFound')}</p>
              ) : (
                <div className="divide-y divide-border">
                  {orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      to="/orders/$orderId"
                      params={{ orderId: String(order.id) }}
                      className="block py-3 hover:bg-accent/50 -mx-4 px-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm">{order.reference}</p>
                          <p className="text-xs text-muted-foreground">{order.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'EUR' }).format(order.totalAmount || 0)}
                          </p>
                          <StatusBadge status={order.statusName || 'Pending'} />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {orders.length > 5 && (
                    <p className="text-sm text-muted-foreground pt-3">
                      {t('common.andMore', { count: orders.length - 5 })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices Section */}
          <Card>
            <CardHeader
              title={t('invoices.title')}
              action={
                <Link
                  to="/invoices/new"
                  search={{ projectId: Number(projectId) }}
                  className="text-sm text-primary hover:underline"
                >
                  {t('invoices.newInvoice')}
                </Link>
              }
            />
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('invoices.noInvoicesFound')}</p>
              ) : (
                <div className="divide-y divide-border">
                  {invoices.slice(0, 5).map((invoice) => (
                    <Link
                      key={invoice.id}
                      to="/invoices/$invoiceId"
                      params={{ invoiceId: String(invoice.id) }}
                      className="block py-3 hover:bg-accent/50 -mx-4 px-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm">{invoice.reference}</p>
                          <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'EUR' }).format(invoice.totalAmount || 0)}
                          </p>
                          <StatusBadge status={invoice.statusName || 'Pending'} />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {invoices.length > 5 && (
                    <p className="text-sm text-muted-foreground pt-3">
                      {t('common.andMore', { count: invoices.length - 5 })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader title={t('common.details')} />
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('common.createdAt')}</dt>
                  <dd className="text-sm">{new Date(project.createdAt).toLocaleDateString()}</dd>
                </div>
                {project.updatedAt && (
                  <div>
                    <dt className="text-sm text-muted-foreground">{t('common.updatedAt')}</dt>
                    <dd className="text-sm">{new Date(project.updatedAt).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader title={t('projects.statistics')} />
            <CardContent>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">{t('quotes.title')}</dt>
                  <dd className="font-medium">{quotes.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
