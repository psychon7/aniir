import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCreateInvoice } from '@/hooks/useInvoices'
import { useClients } from '@/hooks/useClients'
import { lookupsApi } from '@/api/lookups'
import type { InvoiceCreateDto, InvoiceLineCreateDto } from '@/types/invoice'

export const Route = createFileRoute('/_authenticated/invoices/new')({
  component: NewInvoicePage,
})

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  productId?: number
}

function NewInvoicePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  const createMutation = useCreateInvoice()

  // Form state
  const [clientId, setClientId] = useState<number | ''>('')
  const [currencyId, setCurrencyId] = useState<number | ''>('')
  const [vatId, setVatId] = useState<number | ''>('')
  const [societyId, setSocietyId] = useState<number | ''>('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [headerText, setHeaderText] = useState('')
  const [footerText, setFooterText] = useState('')
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
    const discountAmount = gross * (line.discount / 100)
    return gross - discountAmount
  }

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0)
  }

  const handleSubmit = async () => {
    if (!clientId || !currencyId || !societyId) {
      showError(t('common.error'), t('invoices.requiredFields', 'Please fill in all required fields.'))
      return
    }

    const invoiceLines: InvoiceLineCreateDto[] = lines
      .filter((line) => line.description.trim())
      .map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercentage: line.discount || undefined,
        productId: line.productId || undefined,
      }))

    const data: InvoiceCreateDto = {
      clientId: clientId as number,
      currencyId: currencyId as number,
      vatId: vatId as number || undefined,
      orderId: undefined,
      invoiceDate: invoiceDate || undefined,
      termDate: dueDate || undefined,
      headerText: headerText || undefined,
      footerText: footerText || undefined,
      clientComment: notes || undefined,
      internalComment: internalNotes || undefined,
      isInvoice: true,
      lines: invoiceLines,
    }

    try {
      const newInvoice = await createMutation.mutateAsync(data)
      success(t('invoices.invoiceCreated'), t('invoices.invoiceCreated'))
      navigate({ to: '/invoices/$invoiceId' as any, params: { invoiceId: String(newInvoice.id) } })
    } catch {
      showError(t('common.error'), t('invoices.createError', 'An error occurred while creating the invoice.'))
    }
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/invoices' as any })} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSubmit}
        disabled={createMutation.isPending || !clientId}
        className="btn-primary"
      >
        {createMutation.isPending ? t('common.loading') : t('invoices.saveInvoice', 'Save Invoice')}
      </button>
    </div>
  )

  const selectedCurrency = currencies?.find((c) => c.key === currencyId)
  const currencyCode = selectedCurrency?.value || 'EUR'

  return (
    <PageContainer>
      <PageHeader
        title={t('invoices.newInvoice')}
        description={t('invoices.newInvoiceDescription', 'Create a new client invoice')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('invoices.invoiceDetails')} />
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('invoices.client')} *
                    </label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('invoices.selectClient', 'Select a client...')}</option>
                      {clientsData?.data?.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('invoices.society', 'Society')} *
                    </label>
                    <select
                      value={societyId}
                      onChange={(e) => setSocietyId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('invoices.selectSociety', 'Select a society...')}</option>
                      {societies?.map((society) => (
                        <option key={society.key} value={society.key}>
                          {society.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('invoices.invoiceDate')} *
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('invoices.dueDate')}
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('invoices.currency', 'Currency')} *
                    </label>
                    <select
                      value={currencyId}
                      onChange={(e) => setCurrencyId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('invoices.selectCurrency', 'Select a currency...')}</option>
                      {currencies?.map((currency) => (
                        <option key={currency.key} value={currency.key}>
                          {currency.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('invoices.vatRate', 'VAT Rate')}
                    </label>
                    <select
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="input w-full"
                    >
                      <option value="">{t('invoices.selectVatRate', 'Select a VAT rate...')}</option>
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
                    {t('invoices.headerText', 'Header Text')}
                  </label>
                  <textarea
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('invoices.headerTextPlaceholder', 'Invoice header text...')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('invoices.notes')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('invoices.notesPlaceholder', 'Client-facing notes...')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('invoices.internalNotes', 'Internal Notes')}
                  </label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('invoices.internalNotesPlaceholder', 'Internal notes (not visible to client)...')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('invoices.footerText', 'Footer Text')}
                  </label>
                  <textarea
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder={t('invoices.footerTextPlaceholder', 'Invoice footer text...')}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={t('invoices.lines')}
              action={
                <button onClick={addLine} className="btn-secondary text-sm">
                  + {t('invoices.addLine')}
                </button>
              }
            />
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">{t('invoices.description', 'Description')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-24">{t('invoices.quantity', 'Qty')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-32">{t('invoices.unitPrice', 'Unit Price')}</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-28">{t('invoices.discount')} %</th>
                    <th className="text-right py-2 text-sm text-muted-foreground w-32">{t('invoices.total')}</th>
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
                            placeholder={t('invoices.descriptionPlaceholder', 'Line description...')}
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
                        {t('invoices.noLinesYet', 'No line items yet. Click "Add Line" to add items.')}
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
            <CardHeader title={t('invoices.status')} />
            <CardContent>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {t('invoices.draft')}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('invoices.draftDescription', 'This invoice will be created as a draft.')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('invoices.totals', 'Totals')} />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('invoices.subtotal')}</dt>
                  <dd>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(calculateSubtotal())}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('invoices.tax')}</dt>
                  <dd>-</dd>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>{t('invoices.total')}</dt>
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
