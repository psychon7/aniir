import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import {
  usePurchaseIntent,
  useDeletePurchaseIntent,
  useClosePurchaseIntent,
  useReopenPurchaseIntent,
  useAddPurchaseIntentLine,
  useDeletePurchaseIntentLine,
} from '@/hooks/usePurchaseIntents'
import type { PurchaseIntentLine, PurchaseIntentLineCreateDto } from '@/types/purchaseIntent'

export const Route = createFileRoute('/_authenticated/purchase-intents/$intentId')({
  component: PurchaseIntentDetailPage,
})

function PurchaseIntentDetailPage() {
  const { intentId } = Route.useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const [isAddingLine, setIsAddingLine] = useState(false)
  const [deletingLine, setDeletingLine] = useState<PurchaseIntentLine | null>(null)
  const [newLine, setNewLine] = useState<PurchaseIntentLineCreateDto>({
    pil_quantity: 1,
    pil_description: '',
  })

  const { data: intent, isLoading } = usePurchaseIntent(parseInt(intentId, 10))
  const deleteMutation = useDeletePurchaseIntent()
  const closeMutation = useClosePurchaseIntent()
  const reopenMutation = useReopenPurchaseIntent()
  const addLineMutation = useAddPurchaseIntentLine()
  const deleteLineMutation = useDeletePurchaseIntentLine()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(parseInt(intentId, 10))
      success(t('purchaseIntents.deleteSuccess'), t('purchaseIntents.deleteSuccessMessage'))
      navigate({ to: '/purchase-intents' as any })
    } catch {
      showError(t('common.error'), t('purchaseIntents.deleteError'))
    }
  }

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync(parseInt(intentId, 10))
      success(t('purchaseIntents.closeSuccess'), t('purchaseIntents.closeSuccessMessage'))
    } catch {
      showError(t('common.error'), t('purchaseIntents.closeError'))
    }
  }

  const handleReopen = async () => {
    try {
      await reopenMutation.mutateAsync(parseInt(intentId, 10))
      success(t('purchaseIntents.reopenSuccess'), t('purchaseIntents.reopenSuccessMessage'))
    } catch {
      showError(t('common.error'), t('purchaseIntents.reopenError'))
    }
  }

  const handleAddLine = async () => {
    try {
      await addLineMutation.mutateAsync({
        intentId: parseInt(intentId, 10),
        line: newLine,
      })
      setIsAddingLine(false)
      setNewLine({ pil_quantity: 1, pil_description: '' })
      success(t('purchaseIntents.lineAdded'), t('purchaseIntents.lineAddedMessage'))
    } catch {
      showError(t('common.error'), t('purchaseIntents.lineAddError'))
    }
  }

  const handleDeleteLine = async () => {
    if (!deletingLine) return
    try {
      await deleteLineMutation.mutateAsync({
        intentId: parseInt(intentId, 10),
        lineId: deletingLine.id,
      })
      setDeletingLine(null)
      success(t('purchaseIntents.lineDeleted'), t('purchaseIntents.lineDeletedMessage'))
    } catch {
      showError(t('common.error'), t('purchaseIntents.lineDeleteError'))
    }
  }

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

  if (!intent) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">{t('purchaseIntents.notFound')}</h2>
          <button onClick={() => navigate({ to: '/purchase-intents' as any })} className="btn-primary mt-4">
            {t('purchaseIntents.backToList')}
          </button>
        </div>
      </PageContainer>
    )
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/purchase-intents' as any })} className="btn-secondary">
        {t('common.back')}
      </button>
      {intent.isClosed ? (
        <button
          onClick={handleReopen}
          disabled={reopenMutation.isPending}
          className="btn-secondary"
        >
          {reopenMutation.isPending ? t('common.loading') : t('purchaseIntents.reopen')}
        </button>
      ) : (
        <button
          onClick={handleClose}
          disabled={closeMutation.isPending}
          className="btn-secondary"
        >
          {closeMutation.isPending ? t('common.loading') : t('purchaseIntents.close')}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        className="btn-destructive"
      >
        {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
      </button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={`${t('purchaseIntents.purchaseIntent')} ${intent.code || intent.id}`}
        description={intent.name || ''}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('purchaseIntents.details')} />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('purchaseIntents.reference')}</dt>
                  <dd className="font-mono">{intent.code || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('purchaseIntents.name')}</dt>
                  <dd className="font-medium">{intent.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('purchaseIntents.createdDate')}</dt>
                  <dd>{intent.createdAt ? new Date(intent.createdAt).toLocaleDateString() : '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('purchaseIntents.lastUpdated')}</dt>
                  <dd>{intent.updatedAt ? new Date(intent.updatedAt).toLocaleDateString() : '-'}</dd>
                </div>
                {intent.internalComment && (
                  <div className="col-span-2">
                    <dt className="text-sm text-muted-foreground">{t('purchaseIntents.internalComment')}</dt>
                    <dd className="whitespace-pre-wrap">{intent.internalComment}</dd>
                  </div>
                )}
                {intent.supplierComment && (
                  <div className="col-span-2">
                    <dt className="text-sm text-muted-foreground">{t('purchaseIntents.supplierComment')}</dt>
                    <dd className="whitespace-pre-wrap">{intent.supplierComment}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={t('purchaseIntents.lineItems')}
              action={
                !intent.isClosed && (
                  <button
                    onClick={() => setIsAddingLine(true)}
                    className="btn-secondary btn-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('purchaseIntents.addLine')}
                  </button>
                )
              }
            />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">#</th>
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('purchaseIntents.description')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground">{t('purchaseIntents.quantity')}</th>
                    {!intent.isClosed && (
                      <th className="text-right py-2 text-sm text-muted-foreground w-20">{t('common.actions')}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {intent.lines?.map((line, index) => (
                    <tr key={line.id} className="border-b">
                      <td className="py-3 text-muted-foreground">{line.lineOrder || index + 1}</td>
                      <td className="py-3">
                        <p className="font-medium">{line.description || line.productName || '-'}</p>
                        {line.productReference && (
                          <p className="text-sm text-muted-foreground font-mono">{line.productReference}</p>
                        )}
                      </td>
                      <td className="text-right py-3">{line.quantity || 0}</td>
                      {!intent.isClosed && (
                        <td className="text-right py-3">
                          <button
                            onClick={() => setDeletingLine(line)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title={t('common.delete')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={intent.isClosed ? 3 : 4} className="text-center py-8 text-muted-foreground">
                        {t('purchaseIntents.noLineItems')}
                      </td>
                    </tr>
                  )}
                  {isAddingLine && (
                    <tr className="border-b bg-muted/50">
                      <td className="py-3 text-muted-foreground">-</td>
                      <td className="py-3">
                        <input
                          type="text"
                          value={newLine.pil_description || ''}
                          onChange={(e) => setNewLine({ ...newLine, pil_description: e.target.value })}
                          placeholder={t('purchaseIntents.enterDescription')}
                          className="input w-full"
                          autoFocus
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          value={newLine.pil_quantity || 1}
                          onChange={(e) => setNewLine({ ...newLine, pil_quantity: parseInt(e.target.value, 10) || 1 })}
                          min={1}
                          className="input w-20 text-right"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={handleAddLine}
                            disabled={addLineMutation.isPending}
                            className="p-1 rounded text-green-600 hover:bg-green-100 transition-colors"
                            title={t('common.save')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingLine(false)
                              setNewLine({ pil_quantity: 1, pil_description: '' })
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title={t('common.cancel')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t('purchaseIntents.status')} />
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('purchaseIntents.currentStatus')}</p>
                <StatusBadge status={intent.isClosed ? t('purchaseIntents.closed') : t('purchaseIntents.open')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('purchaseIntents.summary')} />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('purchaseIntents.totalLines')}</dt>
                  <dd className="font-medium">{intent.lines?.length || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('purchaseIntents.totalQuantity')}</dt>
                  <dd className="font-medium">
                    {intent.lines?.reduce((sum, line) => sum + (line.quantity || 0), 0) || 0}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={!!deletingLine}
        onClose={() => setDeletingLine(null)}
        onConfirm={handleDeleteLine}
        itemName={deletingLine?.description || 'this line'}
        isLoading={deleteLineMutation.isPending}
      />
    </PageContainer>
  )
}
