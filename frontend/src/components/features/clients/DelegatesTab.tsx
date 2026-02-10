import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { useClientDelegates, useCreateClientDelegate, useDeleteClientDelegate } from '@/hooks/useDelegates'
import { DelegateFormModal } from './DelegateFormModal'
import type { ClientDelegate, ClientDelegateCreateDto } from '@/types/delegate'

interface DelegatesTabProps {
  clientId: number
}

export function DelegatesTab({ clientId }: DelegatesTabProps) {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const { data: delegatesData, isLoading } = useClientDelegates(clientId)
  const delegates = delegatesData?.data ?? []

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ClientDelegate | null>(null)

  // Mutations
  const createMutation = useCreateClientDelegate()
  const deleteMutation = useDeleteClientDelegate()

  const handleCreate = async (data: ClientDelegateCreateDto) => {
    try {
      await createMutation.mutateAsync({ clientId, data })
      success(
        t('delegates.created', 'Delegate added'),
        t('delegates.createdDescription', 'The delegate has been added successfully.')
      )
      setIsModalOpen(false)
    } catch (err) {
      showError(
        t('common.error', 'Error'),
        t('delegates.createError', 'An error occurred while adding the delegate.')
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync({ clientId, delegateId: deleteTarget.id })
      success(
        t('delegates.deleted', 'Delegate removed'),
        t('delegates.deletedDescription', 'The delegate has been removed successfully.')
      )
      setDeleteTarget(null)
    } catch (err) {
      showError(
        t('common.error', 'Error'),
        t('delegates.deleteError', 'An error occurred while removing the delegate.')
      )
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title={`${t('delegates.delegates', 'Delegates')} (${delegates.length})`}
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('common.add', 'Add')}
            </button>
          }
        />
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : delegates.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('delegates.noDelegatesFound', 'No delegates found')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">{t('clients.companyName')}</th>
                    <th className="py-2 pr-4 font-medium">{t('clients.contact', 'Contact')}</th>
                    <th className="py-2 pr-4 font-medium">{t('common.email')}</th>
                    <th className="py-2 pr-4 font-medium">{t('common.phone')}</th>
                    <th className="py-2 pr-4 font-medium">{t('clients.flags', 'Flags')}</th>
                    <th className="py-2 pr-4 font-medium w-16">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {delegates.map((delegate: ClientDelegate) => (
                    <tr key={delegate.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{delegate.companyName || delegate.delegateClientName || '-'}</p>
                        {delegate.vatNumber && <p className="text-xs text-muted-foreground font-mono">{delegate.vatNumber}</p>}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{delegate.contactName || '-'}</td>
                      <td className="py-3 pr-4">
                        {delegate.email ? (
                          <a href={`mailto:${delegate.email}`} className="text-primary hover:underline">{delegate.email}</a>
                        ) : '-'}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{delegate.phone || '-'}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1 flex-wrap">
                          {delegate.isPrimary && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t('common.primary', 'Primary')}</span>
                          )}
                          {delegate.isActive ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">{t('common.active', 'Active')}</span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t('common.inactive', 'Inactive')}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => setDeleteTarget(delegate)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title={t('common.delete', 'Delete')}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Delegate Modal */}
      <DelegateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        excludeClientId={clientId}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.companyName || deleteTarget?.delegateClientName || t('delegates.delegate', 'delegate')}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
