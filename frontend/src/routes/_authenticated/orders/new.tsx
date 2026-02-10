import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCreateOrder } from '@/hooks/useOrders'
import { useClients } from '@/hooks/useClients'
import { lookupsApi } from '@/api/lookups'
import type { OrderCreateDto, OrderLineCreateDto } from '@/types/order'

export const Route = createFileRoute('/_authenticated/orders/new')({
  component: NewOrderPage,
})

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discountPercentage: number
  productId?: number
}

function NewOrderPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const createMutation = useCreateOrder()

  // Form state
  const [clientId, setClientId] = useState<number | ''>('')
  const [orderName, setOrderName] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [expectedDeliveryFrom, setExpectedDeliveryFrom] = useState('')
  const [currencyId, setCurrencyId] = useState<number | ''>('')
  const [vatId, setVatId] = useState<number | ''>('')
  const [societyId, setSocietyId] = useState<number | ''>('')
  const [internalComment, setInternalComment] = useState('')
  const [clientComment, setClientComment] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])

  // Lookups
  const { data: clientsData } = useClients({ pageSize: 1000 })
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
        discountPercentage: 0,
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
    const gross = line.quantity * line.unitPrice
    const discountAmt = line.discountPercentage > 0 ? gross * line.discountPercentage / 100 : 0
    return gross - discountAmt
  }

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0)
  }

  const handleSubmit = async () => {
    if (!clientId || !vatId || !societyId) {
      showError(t('common.error'), t('orders.requiredFields'))
      return
    }

    const orderLines: OrderLineCreateDto[] = lines
      .filter((line) => line.description.trim())
      .map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercentage: line.discountPercentage || undefined,
        productId: line.productId || undefined,
      }))

    const data: OrderCreateDto = {
      clientId: clientId as number,
      societyId: societyId as number,
      vatId: vatId as number,
      currencyId: currencyId ? (currencyId as number) : undefined,
      orderName: orderName || undefined,
      orderDate: orderDate || undefined,
      expectedDeliveryFrom: expectedDeliveryFrom || undefined,
      internalComment: internalComment || undefined,
      clientComment: clientComment || undefined,
      lines: orderLines,
    }

    try {
      const newOrder = await createMutation.mutateAsync(data)
      success(t('orders.createSuccess'), t('orders.createSuccessMessage'))
      navigate({ to: '/orders/$orderId' as any, params: { orderId: String(newOrder.id) } })
    } catch {
      showError(t('common.error'), t('orders.createError'))
    }
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/orders' as any })} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSubmit}
        disabled={createMutation.isPending || !clientId}
        className="btn-primary"
      >
        {createMutation.isPending ? t('common.loading') : t('orders.saveOrder')}
      </button>
    </div>
  )

  const selectedCurrency = currencies?.find((c) => c.key === currencyId)
  const currencyCode = selectedCurrency?.value || 'EUR'

  return (
    <PageContainer>
      <PageHeader
        title={t('orders.newOrder')}
        description={t('orders.newOrderDescription')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('orders.orderDetails')} />
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('orders.client')} *
                    </label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('orders.selectClient')}</option>
                      {clientsData?.data?.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.companyName || `Client #${client.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('orders.orderName')}
                    </label>
                    <input
                      type="text"
                      value={orderName}
                      onChange={(e) => setOrderName(e.target.value)}
                      className="input w-full"
                      placeholder={t('orders.orderNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('orders.orderDate')}
                    </label>
                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('orders.expectedDelivery')}
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryFrom}
                      onChange={(e) => setExpectedDeliveryFrom(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('orders.society')} *
                    </label>
                    <select
                      value={societyId}
                      onChange={(e) => setSocietyId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('orders.selectSociety')}</option>
                      {societies?.map((society) => (
                        <option key={society.key} value={society.key}>
                          {society.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('orders.currency')} *
                    </label>
                    <select
                      value={currencyId}
                      onChange={(e) => setCurrencyId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('orders.selectCurrency')}</option>
                      {currencies?.map((currency) => (
                        <option key={currency.key} value={currency.key}>
                          {currency.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('orders.vatRate')} *
                    </label>
                    <select
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('orders.selectVatRate')}</option>
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
                    {t('orders.internalComment')}
                  </label>
                  <textarea
                    value={internalComment}
                    onChange={(e) => setInternalComment(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('orders.internalCommentPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('orders.clientComment')}
                  </label>
                  <textarea
                    value={clientComment}
                    onChange={(e) => setClientComment(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('orders.clientCommentPlaceholder')}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={t('orders.lines')}
              action={
                <button onClick={addLine} className="btn-secondary text-sm">
                  + {t('orders.addLine')}
                </button>
              }
            />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('orders.description')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-24">{t('orders.quantity')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-32">{t('orders.unitPrice')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-28">{t('orders.discount')} %</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-32">{t('orders.total')}</th>
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
                            placeholder={t('orders.descriptionPlaceholder')}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="input w-full text-right"
                            min={0}
                            step="0.01"
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
                            value={line.discountPercentage}
                            onChange={(e) => updateLine(line.id, 'discountPercentage', parseFloat(e.target.value) || 0)}
                            className="input w-full text-right"
                            min={0}
                            max={100}
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
                        {t('orders.noLinesYet')}
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
            <CardHeader title={t('orders.status')} />
            <CardContent>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {t('orders.draft')}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('orders.draftDescription')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('orders.total')} />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('orders.subtotalHT')}</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(calculateSubtotal())}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('orders.vat')}</dt>
                  <dd>-</dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>{t('orders.total')}</dt>
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
