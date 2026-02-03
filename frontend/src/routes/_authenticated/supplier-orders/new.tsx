import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCreateSupplierOrder } from '@/hooks/useSupplierOrders'
import { useSuppliers } from '@/hooks/useSuppliers'
import { lookupsApi } from '@/api/lookups'
import type { SupplierOrderCreateDto, SupplierOrderLineCreateDto } from '@/types/supplierOrder'

export const Route = createFileRoute('/_authenticated/supplier-orders/new')({
  component: NewSupplierOrderPage,
})

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  productId?: number
}

function NewSupplierOrderPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const createMutation = useCreateSupplierOrder()

  // Form state
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [orderName, setOrderName] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [currencyId, setCurrencyId] = useState<number | ''>('')
  const [vatId, setVatId] = useState<number | ''>('')
  const [societyId, setSocietyId] = useState<number | ''>('')
  const [internalComment, setInternalComment] = useState('')
  const [supplierComment, setSupplierComment] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])

  // Lookups
  const { data: suppliersData } = useSuppliers({ pageSize: 1000 })
  const { data: currencies } = useQuery({
    queryKey: ['lookups', 'currencies'],
    queryFn: lookupsApi.getCurrencies,
    staleTime: 10 * 60 * 1000,
  })
  const { data: vatRates } = useQuery({
    queryKey: ['lookups', 'vatRates'],
    queryFn: lookupsApi.getVatRates,
    staleTime: 10 * 60 * 1000,
  })
  const { data: societies } = useQuery({
    queryKey: ['lookups', 'societies'],
    queryFn: lookupsApi.getSocieties,
    staleTime: 10 * 60 * 1000,
  })

  // Set default values when lookups are loaded
  useEffect(() => {
    if (currencies && currencies.length > 0 && currencyId === '') {
      setCurrencyId(currencies[0].key)
    }
  }, [currencies, currencyId])

  useEffect(() => {
    if (vatRates && vatRates.length > 0 && vatId === '') {
      setVatId(vatRates[0].key)
    }
  }, [vatRates, vatId])

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
        unitPrice: 0,
        discount: 0,
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

  const calculateLineTotal = (line: LineItem) => {
    return line.quantity * line.unitPrice - line.discount
  }

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0)
  }

  const handleSubmit = async () => {
    if (!supplierId || !currencyId || !vatId || !societyId) {
      showError(t('common.error'), t('supplierOrders.requiredFields'))
      return
    }

    const orderLines: SupplierOrderLineCreateDto[] = lines
      .filter((line) => line.description.trim())
      .map((line, index) => ({
        sol_order: index + 1,
        sol_description: line.description,
        sol_quantity: line.quantity,
        sol_unit_price: line.unitPrice,
        sol_discount_amount: line.discount || undefined,
        prd_id: line.productId || undefined,
      }))

    const data: SupplierOrderCreateDto = {
      sup_id: supplierId as number,
      cur_id: currencyId as number,
      vat_id: vatId as number,
      soc_id: societyId as number,
      usr_creator_id: 1, // TODO: Get from auth context
      sod_name: orderName || undefined,
      sod_d_exp_delivery: expectedDeliveryDate || undefined,
      sod_inter_comment: internalComment || undefined,
      sod_supplier_comment: supplierComment || undefined,
      lines: orderLines,
    }

    try {
      const newOrder = await createMutation.mutateAsync(data)
      success(t('supplierOrders.createSuccess'), t('supplierOrders.createSuccessMessage'))
      navigate({ to: '/supplier-orders/$orderId' as any, params: { orderId: String(newOrder.id) } })
    } catch {
      showError(t('common.error'), t('supplierOrders.createError'))
    }
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/supplier-orders' as any })} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSubmit}
        disabled={createMutation.isPending || !supplierId}
        className="btn-primary"
      >
        {createMutation.isPending ? t('common.loading') : t('supplierOrders.saveOrder')}
      </button>
    </div>
  )

  const selectedCurrency = currencies?.find((c) => c.key === currencyId)
  const currencyCode = selectedCurrency?.value || 'EUR'

  return (
    <PageContainer>
      <PageHeader
        title={t('supplierOrders.newOrder')}
        description={t('supplierOrders.newOrderDescription')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('supplierOrders.orderDetails')} />
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('supplierOrders.supplier')} *
                    </label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('supplierOrders.selectSupplier')}</option>
                      {suppliersData?.data?.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('supplierOrders.orderName')}
                    </label>
                    <input
                      type="text"
                      value={orderName}
                      onChange={(e) => setOrderName(e.target.value)}
                      className="input w-full"
                      placeholder={t('supplierOrders.orderNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('supplierOrders.expectedDelivery')}
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="input w-full"
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
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('supplierOrders.currency')} *
                    </label>
                    <select
                      value={currencyId}
                      onChange={(e) => setCurrencyId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('supplierOrders.selectCurrency')}</option>
                      {currencies?.map((currency) => (
                        <option key={currency.key} value={currency.key}>
                          {currency.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('supplierOrders.vatRate')} *
                    </label>
                    <select
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('supplierOrders.selectVatRate')}</option>
                      {vatRates?.map((vat) => (
                        <option key={vat.key} value={vat.key}>
                          {vat.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('supplierOrders.internalComment')}
                  </label>
                  <textarea
                    value={internalComment}
                    onChange={(e) => setInternalComment(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('supplierOrders.internalCommentPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('supplierOrders.supplierComment')}
                  </label>
                  <textarea
                    value={supplierComment}
                    onChange={(e) => setSupplierComment(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('supplierOrders.supplierCommentPlaceholder')}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={t('supplierOrders.lines')}
              action={
                <button onClick={addLine} className="btn-secondary text-sm">
                  + {t('supplierOrders.addLine')}
                </button>
              }
            />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('supplierOrders.description')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-24">{t('supplierOrders.quantity')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-32">{t('supplierOrders.unitPrice')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-28">{t('supplierOrders.discount')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-32">{t('supplierOrders.total')}</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length > 0 ? (
                    lines.map((line) => (
                      <tr key={line.id} className="border-b">
                        <td className="py-2">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                            className="input w-full"
                            placeholder={t('supplierOrders.descriptionPlaceholder')}
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
                          <input
                            type="number"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="input w-full text-right"
                            min={0}
                            step="0.01"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={line.discount}
                            onChange={(e) => updateLine(line.id, 'discount', parseFloat(e.target.value) || 0)}
                            className="input w-full text-right"
                            min={0}
                            step="0.01"
                          />
                        </td>
                        <td className="py-2 text-right font-medium">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(calculateLineTotal(line))}
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
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('supplierOrders.noLinesYet')}
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
            <CardHeader title={t('supplierOrders.status')} />
            <CardContent>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {t('supplierOrders.draft')}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('supplierOrders.draftDescription')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('supplierOrders.totals')} />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('supplierOrders.subtotalHT')}</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(calculateSubtotal())}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('supplierOrders.vat')}</dt>
                  <dd>-</dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>{t('supplierOrders.total')}</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(calculateSubtotal())}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
