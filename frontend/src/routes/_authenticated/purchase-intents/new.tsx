import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCreatePurchaseIntent } from '@/hooks/usePurchaseIntents'
import { lookupsApi } from '@/api/lookups'
import type { PurchaseIntentCreateDto, PurchaseIntentLineCreateDto } from '@/types/purchaseIntent'

export const Route = createFileRoute('/_authenticated/purchase-intents/new')({
  component: NewPurchaseIntentPage,
})

interface LineItem {
  id: string
  description: string
  quantity: number
  productId?: number
}

function NewPurchaseIntentPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const createMutation = useCreatePurchaseIntent()

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [societyId, setSocietyId] = useState<number | ''>('')
  const [internalComment, setInternalComment] = useState('')
  const [supplierComment, setSupplierComment] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])

  // Lookups
  const { data: societies } = useQuery({
    queryKey: ['lookups', 'societies'],
    queryFn: lookupsApi.getSocieties,
    staleTime: 10 * 60 * 1000,
  })

  // Set default values when lookups are loaded
  useEffect(() => {
    if (societies && societies.length > 0 && societyId === '') {
      setSocietyId(societies[0].key)
    }
  }, [societies, societyId])

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
      },
    ])
  }

  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setLines(
      lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      )
    )
  }

  const removeLine = (id: string) => {
    setLines(lines.filter((line) => line.id !== id))
  }

  const calculateTotalQuantity = () => {
    return lines.reduce((sum, line) => sum + line.quantity, 0)
  }

  const handleSubmit = async () => {
    if (!societyId) {
      showError(t('common.error'), t('supplierOrders.requiredFields'))
      return
    }

    const intentLines: PurchaseIntentLineCreateDto[] = lines
      .filter((line) => line.description.trim())
      .map((line, index) => ({
        pil_order: index + 1,
        pil_description: line.description,
        pil_quantity: line.quantity,
        prd_id: line.productId || undefined,
      }))

    const data: PurchaseIntentCreateDto = {
      soc_id: societyId as number,
      pin_creator_id: 1, // TODO: Get from auth context
      pin_code: code || undefined,
      pin_name: name || undefined,
      pin_inter_comment: internalComment || undefined,
      pin_supplier_comment: supplierComment || undefined,
      lines: intentLines,
    }

    try {
      const newIntent = await createMutation.mutateAsync(data)
      success(t('purchaseIntents.messages.createSuccess'), t('purchaseIntents.messages.createSuccess'))
      navigate({ to: '/purchase-intents/$intentId' as any, params: { intentId: String(newIntent.id) } })
    } catch {
      showError(t('common.error'), t('purchaseIntents.deleteError'))
    }
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/purchase-intents' as any })} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSubmit}
        disabled={createMutation.isPending || !societyId}
        className="btn-primary"
      >
        {createMutation.isPending ? t('common.loading') : t('common.save')}
      </button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('purchaseIntents.newIntent')}
        description={t('purchaseIntents.manageDescription')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('purchaseIntents.details')} />
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('purchaseIntents.reference')}
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="input w-full"
                      placeholder={t('purchaseIntents.reference')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('purchaseIntents.name')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input w-full"
                      placeholder={t('purchaseIntents.name')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('supplierOrders.society')} *
                    </label>
                    <select
                      value={societyId}
                      onChange={(e) => setSocietyId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('supplierOrders.selectSociety')}</option>
                      {societies?.map((society) => (
                        <option key={society.key} value={society.key}>
                          {society.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('purchaseIntents.internalComment')}
                  </label>
                  <textarea
                    value={internalComment}
                    onChange={(e) => setInternalComment(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('purchaseIntents.internalComment')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('purchaseIntents.supplierComment')}
                  </label>
                  <textarea
                    value={supplierComment}
                    onChange={(e) => setSupplierComment(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('purchaseIntents.supplierComment')}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={t('purchaseIntents.lineItems')}
              action={
                <button onClick={addLine} className="btn-secondary text-sm">
                  + {t('purchaseIntents.addLine')}
                </button>
              }
            />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">#</th>
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('purchaseIntents.description')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-28">{t('purchaseIntents.quantity')}</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length > 0 ? (
                    lines.map((line, index) => (
                      <tr key={line.id} className="border-b">
                        <td className="py-2 text-muted-foreground">{index + 1}</td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                            className="input w-full"
                            placeholder={t('purchaseIntents.enterDescription')}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                            className="input w-full text-right"
                            min={1}
                          />
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => removeLine(line.id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title={t('common.delete')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        {t('purchaseIntents.noLineItems')}
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
            <CardContent>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {t('purchaseIntents.open')}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('purchaseIntents.createFirst')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('purchaseIntents.summary')} />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('purchaseIntents.totalLines')}</dt>
                  <dd className="font-medium">{lines.filter((l) => l.description.trim()).length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('purchaseIntents.totalQuantity')}</dt>
                  <dd className="font-medium">{calculateTotalQuantity()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
