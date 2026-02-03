import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCreateSupplierInvoice, useAddSupplierInvoiceLine } from '@/hooks/useSupplierInvoices'
import { useSuppliers } from '@/hooks/useSuppliers'
import { lookupsApi } from '@/api/lookups'
import type { SupplierInvoiceCreateDto, SupplierInvoiceLineCreateDto } from '@/types/supplierInvoice'

export const Route = createFileRoute('/_authenticated/supplier-invoices/new')({
  component: NewSupplierInvoicePage,
})

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discountAmount: number
}

function NewSupplierInvoicePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  // Form state
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [invoiceCode, setInvoiceCode] = useState('')
  const [invoiceName, setInvoiceName] = useState('')
  const [currencyId, setCurrencyId] = useState<number | ''>(1) // Default EUR
  const [vatId, setVatId] = useState<number | ''>(1) // Default VAT rate
  const [internalComment, setInternalComment] = useState('')
  const [supplierComment, setSupplierComment] = useState('')
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [lines, setLines] = useState<LineItem[]>([])

  // Line item form state
  const [newLineDescription, setNewLineDescription] = useState('')
  const [newLineQuantity, setNewLineQuantity] = useState<number>(1)
  const [newLineUnitPrice, setNewLineUnitPrice] = useState<number>(0)
  const [newLineDiscount, setNewLineDiscount] = useState<number>(0)

  // Fetch data
  const { data: suppliersData } = useSuppliers({ pageSize: 1000 })
  const { data: currencies } = useQuery({
    queryKey: ['lookups', 'currencies'],
    queryFn: lookupsApi.getCurrencies,
  })
  const { data: vatRates } = useQuery({
    queryKey: ['lookups', 'vatRates'],
    queryFn: lookupsApi.getVatRates,
  })

  const createInvoiceMutation = useCreateSupplierInvoice()
  const addLineMutation = useAddSupplierInvoiceLine()

  const suppliers = suppliersData?.data || []

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      return sum + line.quantity * line.unitPrice - line.discountAmount
    }, 0)

    const vatRate = vatRates?.find((v) => v.key === vatId)?.dcValue || 0
    const vatAmount = subtotal * (vatRate / 100)
    const total = subtotal + vatAmount - discountAmount

    return {
      subtotal,
      vatAmount,
      total,
      vatRate,
    }
  }, [lines, vatId, vatRates, discountAmount])

  const handleAddLine = () => {
    if (!newLineDescription.trim()) {
      showError(t('common.error'), t('common.required'))
      return
    }
    if (newLineQuantity <= 0) {
      showError(t('common.error'), t('common.invalidQuantity', 'Invalid quantity'))
      return
    }

    const newLine: LineItem = {
      id: Date.now().toString(),
      description: newLineDescription.trim(),
      quantity: newLineQuantity,
      unitPrice: newLineUnitPrice,
      discountAmount: newLineDiscount,
    }

    setLines([...lines, newLine])
    setNewLineDescription('')
    setNewLineQuantity(1)
    setNewLineUnitPrice(0)
    setNewLineDiscount(0)
  }

  const handleRemoveLine = (lineId: string) => {
    setLines(lines.filter((line) => line.id !== lineId))
  }

  const handleSave = async () => {
    // Validation
    if (!supplierId) {
      showError(t('common.error'), t('common.selectSupplier', 'Please select a supplier'))
      return
    }
    if (!currencyId) {
      showError(t('common.error'), t('common.selectCurrency', 'Please select a currency'))
      return
    }
    if (!vatId) {
      showError(t('common.error'), t('common.selectVat', 'Please select a VAT rate'))
      return
    }

    // Build the DTO
    const invoiceData: SupplierInvoiceCreateDto = {
      sup_id: Number(supplierId),
      soc_id: 1, // Default society ID - should be from user context
      cur_id: Number(currencyId),
      vat_id: Number(vatId),
      sin_code: invoiceCode || undefined,
      sin_name: invoiceName || undefined,
      sin_inter_comment: internalComment || undefined,
      sin_supplier_comment: supplierComment || undefined,
      sin_discount_amount: discountAmount || undefined,
      usr_creator_id: 1, // Should be from auth context
      lines: lines.map((line): SupplierInvoiceLineCreateDto => ({
        sil_description: line.description,
        sil_quantity: line.quantity,
        sil_unit_price: line.unitPrice,
        sil_discount_amount: line.discountAmount || undefined,
      })),
    }

    createInvoiceMutation.mutate(invoiceData, {
      onSuccess: (createdInvoice) => {
        success(
          t('supplierInvoices.messages.createSuccess'),
          t('supplierInvoices.messages.createSuccess')
        )
        navigate({ to: '/supplier-invoices/$invoiceId' as any, params: { invoiceId: String(createdInvoice.id) } })
      },
      onError: (error) => {
        console.error('Error creating invoice:', error)
        showError(t('common.error'), t('common.errorOccurred'))
      },
    })
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/supplier-invoices' as any })} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSave}
        className="btn-primary"
        disabled={createInvoiceMutation.isPending}
      >
        {createInvoiceMutation.isPending ? t('common.loading') : t('common.save')}
      </button>
    </div>
  )

  const getCurrencySymbol = () => {
    const currency = currencies?.find((c) => c.key === currencyId)
    return currency?.value2 || currency?.value || 'EUR'
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('supplierInvoices.newInvoice')}
        description={t('common.createNew', 'Create a new supplier invoice')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details Card */}
          <Card>
            <CardHeader title={t('common.details')} />
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('supplierInvoices.columns.reference')} ({t('common.optional')})
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={invoiceCode}
                      onChange={(e) => setInvoiceCode(e.target.value)}
                      placeholder={t('common.autoGenerated', 'Auto-generated if empty')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('supplierInvoices.columns.supplier')} *
                    </label>
                    <select
                      className="input w-full"
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                      required
                    >
                      <option value="">{t('common.selectOption')}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.companyName || `Supplier #${supplier.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('common.currency', 'Currency')} *
                    </label>
                    <select
                      className="input w-full"
                      value={currencyId}
                      onChange={(e) => setCurrencyId(e.target.value ? Number(e.target.value) : '')}
                      required
                    >
                      <option value="">{t('common.selectOption')}</option>
                      {currencies?.map((currency) => (
                        <option key={currency.key} value={currency.key}>
                          {currency.value} {currency.value2 && `(${currency.value2})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('products.vatRate', 'VAT Rate')} *
                    </label>
                    <select
                      className="input w-full"
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value ? Number(e.target.value) : '')}
                      required
                    >
                      <option value="">{t('common.selectOption')}</option>
                      {vatRates?.map((vat) => (
                        <option key={vat.key} value={vat.key}>
                          {vat.value} {vat.dcValue !== undefined && `(${vat.dcValue}%)`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('common.name', 'Name/Description')} ({t('common.optional')})
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={invoiceName}
                      onChange={(e) => setInvoiceName(e.target.value)}
                      placeholder={t('common.enterDescription', 'Enter invoice description...')}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('clients.internalNotes', 'Internal Notes')} ({t('common.optional')})
                  </label>
                  <textarea
                    className="input w-full"
                    rows={2}
                    value={internalComment}
                    onChange={(e) => setInternalComment(e.target.value)}
                    placeholder={t('common.enterNotes', 'Internal notes...')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('common.supplierNotes', 'Supplier Notes')} ({t('common.optional')})
                  </label>
                  <textarea
                    className="input w-full"
                    rows={2}
                    value={supplierComment}
                    onChange={(e) => setSupplierComment(e.target.value)}
                    placeholder={t('common.enterNotes', 'Notes for supplier...')}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardHeader
              title={t('invoices.lines', 'Line Items')}
              action={
                <span className="text-sm text-muted-foreground">
                  {lines.length} {t('common.items', 'items')}
                </span>
              }
            />
            <CardContent>
              {/* Add Line Form */}
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t('common.description', 'Description')} *
                    </label>
                    <input
                      type="text"
                      className="input w-full text-sm"
                      value={newLineDescription}
                      onChange={(e) => setNewLineDescription(e.target.value)}
                      placeholder={t('common.enterDescription', 'Enter description...')}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t('products.quantity', 'Qty')}
                    </label>
                    <input
                      type="number"
                      className="input w-full text-sm"
                      value={newLineQuantity}
                      onChange={(e) => setNewLineQuantity(Number(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t('products.unitPrice', 'Unit Price')}
                    </label>
                    <input
                      type="number"
                      className="input w-full text-sm"
                      value={newLineUnitPrice}
                      onChange={(e) => setNewLineUnitPrice(Number(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {t('invoices.discount', 'Discount')}
                    </label>
                    <input
                      type="number"
                      className="input w-full text-sm"
                      value={newLineDiscount}
                      onChange={(e) => setNewLineDiscount(Number(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="btn-primary w-full text-sm px-2"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-muted-foreground">
                      {t('common.description', 'Description')}
                    </th>
                    <th className="text-right py-2 text-sm text-muted-foreground">
                      {t('products.quantity', 'Qty')}
                    </th>
                    <th className="text-right py-2 text-sm text-muted-foreground">
                      {t('products.unitPrice', 'Unit Price')}
                    </th>
                    <th className="text-right py-2 text-sm text-muted-foreground">
                      {t('invoices.discount', 'Discount')}
                    </th>
                    <th className="text-right py-2 text-sm text-muted-foreground">
                      {t('invoices.total', 'Total')}
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('common.noData', 'No line items yet. Add items above.')}
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => {
                      const lineTotal = line.quantity * line.unitPrice - line.discountAmount
                      return (
                        <tr key={line.id} className="border-b">
                          <td className="py-3">{line.description}</td>
                          <td className="text-right py-3">{line.quantity}</td>
                          <td className="text-right py-3">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: getCurrencySymbol(),
                            }).format(line.unitPrice)}
                          </td>
                          <td className="text-right py-3 text-muted-foreground">
                            {line.discountAmount > 0
                              ? new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: getCurrencySymbol(),
                                }).format(line.discountAmount)
                              : '-'}
                          </td>
                          <td className="text-right py-3 font-medium">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: getCurrencySymbol(),
                            }).format(lineTotal)}
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(line.id)}
                              className="p-1 text-muted-foreground hover:text-destructive"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Invoice Discount Card */}
          <Card>
            <CardHeader title={t('invoices.discount')} />
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {t('invoices.discount', 'Discount Amount')}
                </label>
                <input
                  type="number"
                  className="input w-full"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>

          {/* Totals Card */}
          <Card>
            <CardHeader title={t('invoices.total', 'Totals')} />
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('invoices.subtotal', 'Subtotal')}</dt>
                  <dd>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: getCurrencySymbol(),
                    }).format(totals.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {t('invoices.tax', 'VAT')} ({totals.vatRate}%)
                  </dt>
                  <dd>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: getCurrencySymbol(),
                    }).format(totals.vatAmount)}
                  </dd>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <dt>{t('invoices.discount')}</dt>
                    <dd>
                      -{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: getCurrencySymbol(),
                      }).format(discountAmount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <dt>{t('invoices.total', 'Total')}</dt>
                  <dd>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: getCurrencySymbol(),
                    }).format(totals.total)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader title={t('common.help', 'Quick Tips')} />
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>- {t('common.tip1', 'Select a supplier to start')}</li>
                <li>- {t('common.tip2', 'Add line items for the invoice')}</li>
                <li>- {t('common.tip3', 'Review totals before saving')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
