import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { ContactFormModal } from './ContactFormModal'
import {
  useClientContacts,
  useCreateClientContact,
  useUpdateClientContact,
  useDeleteClientContact,
} from '@/hooks/useClients'
import type { ClientContact } from '@/types/client'

interface ContactsTabProps {
  clientId: number
}

export function ContactsTab({ clientId }: ContactsTabProps) {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const { data: contacts = [], isLoading } = useClientContacts(clientId)
  const createMutation = useCreateClientContact(clientId)
  const updateMutation = useUpdateClientContact(clientId)
  const deleteMutation = useDeleteClientContact(clientId)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null)
  const [deleteContactId, setDeleteContactId] = useState<number | null>(null)

  const handleCreate = async (data: Omit<ClientContact, 'id' | 'clientId'>) => {
    try {
      await createMutation.mutateAsync(data)
      success(t('clients.contactCreated', 'Contact created'), t('clients.contactCreatedDesc', 'The contact has been added.'))
      setIsFormOpen(false)
    } catch {
      showError(t('common.error'), t('clients.contactCreateError', 'Failed to create contact.'))
    }
  }

  const handleUpdate = async (data: Omit<ClientContact, 'id' | 'clientId'>) => {
    if (!editingContact) return
    try {
      await updateMutation.mutateAsync({ contactId: editingContact.id, data })
      success(t('clients.contactUpdated', 'Contact updated'), t('clients.contactUpdatedDesc', 'The contact has been updated.'))
      setEditingContact(null)
    } catch {
      showError(t('common.error'), t('clients.contactUpdateError', 'Failed to update contact.'))
    }
  }

  const handleDelete = async () => {
    if (deleteContactId === null) return
    try {
      await deleteMutation.mutateAsync(deleteContactId)
      success(t('clients.contactDeleted', 'Contact deleted'), t('clients.contactDeletedDesc', 'The contact has been removed.'))
      setDeleteContactId(null)
    } catch {
      showError(t('common.error'), t('clients.contactDeleteError', 'Failed to delete contact.'))
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title={`${t('clients.contacts')} (${contacts.length})`}
          action={
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              + {t('clients.addContact')}
            </button>
          }
        />
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('clients.noContacts', 'No contacts added')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">{t('clients.name')}</th>
                    <th className="py-2 pr-4 font-medium">{t('clients.contactRole', 'Role')}</th>
                    <th className="py-2 pr-4 font-medium">{t('common.email')}</th>
                    <th className="py-2 pr-4 font-medium">{t('common.phone')}</th>
                    <th className="py-2 pr-4 font-medium">{t('clients.flags', 'Flags')}</th>
                    <th className="py-2 font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">
                              {contact.firstName?.[0]}{contact.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{contact.firstName} {contact.lastName}</p>
                            {contact.position && <p className="text-xs text-muted-foreground">{contact.position}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{contact.role || '-'}</td>
                      <td className="py-3 pr-4">
                        {contact.email ? (
                          <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
                        ) : '-'}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{contact.phone || contact.mobile || '-'}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1 flex-wrap">
                          {contact.isPrimary && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t('common.primary', 'Primary')}</span>
                          )}
                          {contact.isInvoicingAddress && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{t('clients.invoiceAddress', 'Invoice')}</span>
                          )}
                          {contact.isDeliveryAddress && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{t('clients.deliveryAddress', 'Delivery')}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingContact(contact)}
                            className="text-xs text-primary hover:underline"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => setDeleteContactId(contact.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ContactFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <ContactFormModal
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        onSubmit={handleUpdate}
        contact={editingContact}
        isSubmitting={updateMutation.isPending}
      />

      <DeleteConfirmDialog
        isOpen={deleteContactId !== null}
        onClose={() => setDeleteContactId(null)}
        onConfirm={handleDelete}
        itemName={t('clients.contact', 'contact')}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
