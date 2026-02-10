import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import { EmptyStateError } from '@/components/ui/feedback/EmptyState'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { ClientForm } from '@/components/features/clients/ClientForm'
import { OverviewTab } from '@/components/features/clients/OverviewTab'
import { ContactsTab } from '@/components/features/clients/ContactsTab'
import { PricingTab } from '@/components/features/clients/PricingTab'
import { ActivityTimeline } from '@/components/features/clients/ActivityTimeline'
import { BankDetailsSection } from '@/components/features/clients/BankDetailsSection'
import { useClient, useUpdateClient, useDeleteClient, useClientContacts } from '@/hooks/useClients'
import { useClientPrices } from '@/hooks/usePricing'
import type { ClientCreateDto } from '@/types/client'

export const Route = createFileRoute('/_authenticated/clients/$clientId')({
  component: ClientDetailPage,
})

function ClientDetailPage() {
  const { clientId } = Route.useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const id = Number(clientId)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: client, isLoading, error } = useClient(id)
  const { data: contacts = [] } = useClientContacts(id)
  const { data: pricesData } = useClientPrices(id, { page: 1, pageSize: 1, activeOnly: true })

  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()

  const handleUpdate = async (data: ClientCreateDto) => {
    try {
      await updateMutation.mutateAsync({ ...data, id })
      success(t('clients.clientUpdated'), t('clients.clientUpdatedDesc'))
      setIsFormOpen(false)
    } catch {
      showError(t('common.error'), t('errors.saveError'))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id)
      success(t('clients.clientDeleted'), t('clients.clientDeletedDesc'))
      navigate({ to: '/clients' })
    } catch {
      showError(t('common.error'), t('errors.deleteError'))
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
      </PageContainer>
    )
  }

  if (error || !client) {
    return (
      <PageContainer>
        <EmptyStateError
          message={t('errors.notFound')}
          onRetry={() => navigate({ to: '/clients' })}
        />
      </PageContainer>
    )
  }

  const contactCount = contacts.length
  const priceCount = pricesData?.totalCount || 0

  return (
    <PageContainer>
      {/* Header - always visible */}
      <PageHeader
        title={client.companyName}
        description={
          <span className="flex items-center gap-2">
            <span className="font-mono text-sm">{client.reference}</span>
            <StatusBadge status={client.statusName} />
            {client.email && (
              <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline ml-2">
                {client.email}
              </a>
            )}
            {client.phone && (
              <a href={`tel:${client.phone}`} className="text-sm text-muted-foreground hover:text-foreground ml-2">
                {client.phone}
              </a>
            )}
          </span>
        }
        breadcrumbs={[
          { label: t('nav.clients'), href: '/clients' },
          { label: client.companyName },
        ]}
        actions={
          <>
            <button onClick={() => setIsFormOpen(true)} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('common.edit')}
            </button>
            <button onClick={() => setIsDeleteOpen(true)} className="btn-secondary text-destructive hover:bg-destructive/10">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('common.delete')}
            </button>
          </>
        }
      />

      {/* Tabbed interface */}
      <Tabs defaultTab="overview">
        <TabList>
          <Tab value="overview">{t('clients.overview', 'Overview')}</Tab>
          <Tab value="contacts">{t('clients.contacts')} ({contactCount})</Tab>
          <Tab value="pricing">{t('pricing.productPrices')} ({priceCount})</Tab>
          <Tab value="activity">{t('clients.activity', 'Activity')}</Tab>
          <Tab value="banking">{t('clients.bankDetails', 'Banking')}</Tab>
        </TabList>

        <TabPanel value="overview">
          <OverviewTab client={client} />
        </TabPanel>

        <TabPanel value="contacts">
          <ContactsTab clientId={id} />
        </TabPanel>

        <TabPanel value="pricing">
          <PricingTab clientId={id} />
        </TabPanel>

        <TabPanel value="activity">
          <ActivityTimeline clientId={id} />
        </TabPanel>

        <TabPanel value="banking">
          <BankDetailsSection client={client} />
        </TabPanel>
      </Tabs>

      {/* Edit Form Modal */}
      <ClientForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdate}
        client={client}
        isSubmitting={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={client.companyName}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
