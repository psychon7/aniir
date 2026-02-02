import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import { EmptyStateError } from '@/components/ui/feedback/EmptyState'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { ClientForm } from '@/components/features/clients/ClientForm'
import { useClient, useUpdateClient, useDeleteClient, useClientContacts } from '@/hooks/useClients'
import type { ClientCreateDto } from '@/types/client'

export const Route = createFileRoute('/_authenticated/clients/$clientId')({
  component: ClientDetailPage,
})

function ClientDetailPage() {
  const { clientId } = Route.useParams()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: client, isLoading, error } = useClient(Number(clientId))
  const { data: contacts = [] } = useClientContacts(Number(clientId))
  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()

  const handleUpdate = async (data: ClientCreateDto) => {
    try {
      await updateMutation.mutateAsync({ ...data, id: Number(clientId) })
      success('Client updated', 'The client has been updated successfully.')
      setIsFormOpen(false)
    } catch (err) {
      showError('Error', 'An error occurred while updating the client.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(Number(clientId))
      success('Client deleted', 'The client has been deleted successfully.')
      navigate({ to: '/clients' })
    } catch (err) {
      showError('Error', 'An error occurred while deleting the client.')
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
          message="Client not found"
          onRetry={() => navigate({ to: '/clients' })}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={client.companyName}
        description={`${client.reference} - ${client.statusName}`}
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: client.companyName },
        ]}
        actions={
          <>
            <button onClick={() => setIsFormOpen(true)} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button onClick={() => setIsDeleteOpen(true)} className="btn-secondary text-destructive hover:bg-destructive/10">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader title="Company Information" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Company Name" value={client.companyName} />
                <InfoItem label="Reference" value={client.reference} mono />
                <InfoItem label="Contact" value={`${client.firstName || ''} ${client.lastName || ''}`.trim() || '-'} />
                <InfoItem label="Email" value={client.email} link={`mailto:${client.email}`} />
                <InfoItem label="Phone" value={client.phone} link={`tel:${client.phone}`} />
                <InfoItem label="Mobile" value={client.mobile} link={`tel:${client.mobile}`} />
                <InfoItem label="Website" value={client.website} link={client.website} external />
                <InfoItem
                  label="Status"
                  value={<StatusBadge status={client.statusName} />}
                />
              </dl>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader title="Address" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <dt className="text-sm text-muted-foreground mb-1">Street Address</dt>
                  <dd className="text-foreground">
                    {client.address || '-'}
                    {client.address2 && <><br />{client.address2}</>}
                  </dd>
                </div>
                <InfoItem label="City" value={client.city} />
                <InfoItem label="Postal Code" value={client.postalCode} />
                <InfoItem label="Country" value={client.countryName} />
              </dl>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader title="Business Details" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="VAT Number" value={client.vatNumber} mono />
                <InfoItem label="SIRET" value={client.siret} mono />
                <InfoItem label="Client Type" value={client.clientTypeName} />
                <InfoItem label="Business Unit" value={client.businessUnitName} />
                <InfoItem label="Society" value={client.societyName} />
                <InfoItem label="Language" value={client.languageCode?.toUpperCase()} />
              </dl>
            </CardContent>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader title="Notes" />
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Terms */}
          <Card>
            <CardHeader title="Payment Terms" />
            <CardContent>
              <dl className="space-y-4">
                <InfoItem label="Currency" value={`${client.currencyCode}`} />
                <InfoItem label="Payment Mode" value={client.paymentModeName} />
                <InfoItem label="Payment Terms" value={client.paymentTermDays ? `${client.paymentTermDays} days` : '-'} />
                <InfoItem label="Credit Limit" value={client.creditLimit ? `€${client.creditLimit.toLocaleString()}` : '-'} />
                <InfoItem label="Discount" value={client.discount ? `${client.discount}%` : '-'} />
              </dl>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader
              title="Contacts"
              action={
                <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                  + Add
                </button>
              }
            />
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts added</p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {contact.firstName?.[0]}{contact.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {contact.firstName} {contact.lastName}
                          {contact.isPrimary && (
                            <span className="ml-2 text-xs text-primary">(Primary)</span>
                          )}
                        </p>
                        {contact.position && (
                          <p className="text-xs text-muted-foreground">{contact.position}</p>
                        )}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline">
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader title="Record Information" />
            <CardContent>
              <dl className="space-y-4 text-sm">
                <InfoItem
                  label="Created"
                  value={new Date(client.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
                <InfoItem
                  label="Last Updated"
                  value={new Date(client.updatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

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

// Helper component for displaying info items
function InfoItem({
  label,
  value,
  link,
  external,
  mono,
}: {
  label: string
  value: React.ReactNode
  link?: string
  external?: boolean
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground mb-1">{label}</dt>
      <dd className={`text-foreground ${mono ? 'font-mono text-sm' : ''}`}>
        {link && value ? (
          <a
            href={link}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="text-primary hover:underline"
          >
            {value}
            {external && (
              <svg className="inline-block w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </a>
        ) : (
          value || '-'
        )}
      </dd>
    </div>
  )
}
