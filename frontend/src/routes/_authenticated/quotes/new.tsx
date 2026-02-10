import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCreateQuote } from '@/hooks/useQuotes'
import { useClients } from '@/hooks/useClients'
import { lookupsApi } from '@/api/lookups'
import type { QuoteCreateDto, QuoteLineCreateDto } from '@/types/quote'
import { LineType } from '@/types/quote'

export const Route = createFileRoute('/_authenticated/quotes/new')({
  component: NewQuotePage,
})

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  productId?: number
  lineTypeId: number
}

function NewQuotePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const createMutation = useCreateQuote()

  // Form state
  const [clientId, setClientId] = useState<number | ''>('')
  const [quoteName, setQuoteName] = useState('')
  const [validityDate, setValidityDate] = useState('')
  const [currencyId, setCurrencyId] = useState<number | ''>('')
  const [vatId, setVatId] = useState<number | ''>('')
  const [societyId, setSocietyId] = useState<number | ''>('')
  const [clientComment, setClientComment] = useState('')
  const [internalComment, setInternalComment] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState(0)
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
        discount: 0,
        lineTypeId: LineType.SALE,
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
    const base = line.quantity * line.unitPrice
    const discountAmount = base * (line.discount / 100)
    return base - discountAmount
  }

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discountAmt = subtotal * (discountPercentage / 100)
    return subtotal - discountAmt
  }

  const handleSubmit = async () => {
    if (!clientId) {
      showError(t('common.error'), t('quotes.client') + ' ' + t('common.required'))
      return
    }

    if (!quoteName.trim()) {
      showError(t('common.error'), t('quotes.quoteDetails') + ' - name is required')
      return
    }

    const quoteLines: QuoteLineCreateDto[] = lines
      .filter((line) => line.description.trim())
      .map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercentage: line.discount || undefined,
        productId: line.productId || undefined,
        lineTypeId: line.lineTypeId,
      }))

    const data: QuoteCreateDto = {
      name: quoteName,
      clientId: clientId as number,
      vatId: vatId ? (vatId as number) : undefined,
      validityDate: validityDate || undefined,
      headerText: clientComment || undefined,
      internalComment: internalComment || undefined,
      discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
      lines: quoteLines.length > 0 ? quoteLines : undefined,
    }

    try {
      const newQuote = await createMutation.mutateAsync(data)
      success(t('quotes.quoteCreated'), t('quotes.quoteCreated'))
      navigate({ to: '/quotes/$quoteId' as any, params: { quoteId: String(newQuote.id) } })
    } catch {
      showError(t('common.error'), t('common.error'))
    }
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/quotes' as any })} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSubmit}
        disabled={createMutation.isPending || !clientId}
        className="btn-primary"
      >
        {createMutation.isPending ? t('common.loading') : t('common.save')}
      </button>
    </div>
  )

  const selectedCurrency = currencies?.find((c) => c.key === currencyId)
  const currencyCode = selectedCurrency?.value || 'EUR'

  return (
    <PageContainer>
      <PageHeader
        title={t('quotes.newQuote')}
        description={t('quotes.manageDescription')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('quotes.quoteDetails')} />
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('quotes.client')} *
                    </label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('common.select')}...</option>
                      {clientsData?.data?.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('common.name')} *
                    </label>
                    <input
                      type="text"
                      value={quoteName}
                      onChange={(e) => setQuoteName(e.target.value)}
                      className="input w-full"
                      placeholder={t('quotes.newQuote')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('quotes.validUntil')}
                    </label>
                    <input
                      type="date"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('clients.society')} *
                    </label>
                    <select
                      value={societyId}
                      onChange={(e) => setSocietyId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('common.select')}...</option>
                      {societies?.map((society) => (
                        <option key={society.key} value={society.key}>
                          {society.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('clients.currency')} *
                    </label>
                    <select
                      value={currencyId}
                      onChange={(e) => setCurrencyId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('common.select')}...</option>
                      {currencies?.map((currency) => (
                        <option key={currency.key} value={currency.key}>
                          {currency.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('quotes.vatAmount')} *
                    </label>
                    <select
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('common.select')}...</option>
                      {vatRates?.map((vat) => (
                        <option key={vat.key} value={vat.key}>
                          {vat.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('quotes.discount')} (%)
                    </label>
                    <input
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                      className="input w-full"
                      min={0}
                      max={100}
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('quotes.notes')}
                  </label>
                  <textarea
                    value={clientComment}
                    onChange={(e) => setClientComment(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('quotes.notes')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    value={internalComment}
                    onChange={(e) => setInternalComment(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder="Internal notes (not visible to client)..."
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={t('quotes.lines')}
              action={
                <button onClick={addLine} className="btn-secondary text-sm">
                  + {t('quotes.addLine')}
                </button>
              }
            />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('products.description')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-24">{t('products.quantity')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-32">{t('products.unitPrice')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-28">{t('quotes.discount')} %</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-32">{t('quotes.total')}</th>
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
                            placeholder={t('products.description')}
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
                        {t('quotes.createFirst')}
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
            <CardHeader title={t('quotes.status')} />
            <CardContent>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {t('quotes.draft')}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                New quotes are created in draft status.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('quotes.total')} />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('quotes.subtotal')}</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(calculateSubtotal())}</dd>
                </div>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>{t('quotes.discount')} ({discountPercentage}%)</dt>
                    <dd>-{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(calculateSubtotal() * (discountPercentage / 100))}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('quotes.tax')}</dt>
                  <dd>-</dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>{t('quotes.total')}</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(calculateTotal())}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
