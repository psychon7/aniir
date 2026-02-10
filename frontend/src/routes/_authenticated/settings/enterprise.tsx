import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormTextarea } from '@/components/ui/form/FormTextarea'
import { useEnterpriseSettings, useUpdateEnterpriseSettings } from '@/hooks/useSettings'
import {
  useCurrencyList,
  useExchangeRateList,
  useCreateExchangeRate,
  useDeleteExchangeRate,
} from '@/hooks/useCurrencies'
import type { ExchangeRateCreateRequest } from '@/api/currencies'
import type { EnterpriseSettingsUpdateDto } from '@/api/settings'

export const Route = createFileRoute('/_authenticated/settings/enterprise')({
  component: EnterpriseSettingsPage,
})

function EnterpriseSettingsPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  // Form state
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<EnterpriseSettingsUpdateDto>({})
  const [exchangeRateForm, setExchangeRateForm] = useState<ExchangeRateCreateRequest>({
    cur_id: 0,
    cur_id2: 0,
    mcu_rate_in: 1,
    mcu_rate_out: 1,
    mcu_rate_date: new Date().toISOString().slice(0, 10),
    lng_id: 1,
  })

  // Data fetching
  const { data: enterprise, isLoading, error } = useEnterpriseSettings()
  const { data: currencies = [] } = useCurrencyList()
  const { data: exchangeRates = [], isLoading: isExchangeRatesLoading } = useExchangeRateList()

  // Mutations
  const updateMutation = useUpdateEnterpriseSettings()
  const createExchangeRateMutation = useCreateExchangeRate()
  const deleteExchangeRateMutation = useDeleteExchangeRate()

  // Initialize form when entering edit mode
  const handleStartEdit = () => {
    if (enterprise) {
      setFormData({
        soc_society_name: enterprise.companyName,
        soc_short_label: enterprise.shortLabel || '',
        soc_address1: enterprise.address1 || '',
        soc_address2: enterprise.address2 || '',
        soc_postcode: enterprise.postcode || '',
        soc_city: enterprise.city || '',
        soc_county: enterprise.county || '',
        soc_tel: enterprise.phone || '',
        soc_fax: enterprise.fax || '',
        soc_cellphone: enterprise.cellphone || '',
        soc_email: enterprise.email || '',
        soc_site: enterprise.website || '',
        soc_siret: enterprise.siret || '',
        soc_rcs: enterprise.rcs || '',
        soc_tva_intra: enterprise.vatIntra || '',
        soc_capital: enterprise.capital || '',
        soc_rib_name: enterprise.ribName || '',
        soc_rib_address: enterprise.ribAddress || '',
        soc_rib_code_iban: enterprise.ribIban || '',
        soc_rib_code_bic: enterprise.ribBic || '',
        soc_rib_bank_code: enterprise.ribBankCode || '',
        soc_rib_agence_code: enterprise.ribAgencyCode || '',
        soc_rib_account_number: enterprise.ribAccountNumber || '',
        soc_rib_key: enterprise.ribKey || '',
        soc_rib_domiciliation_agency: enterprise.ribDomiciliationAgency || '',
        soc_rib_abbre: enterprise.ribAbbreviation || '',
        soc_rib_name_2: enterprise.ribName2 || '',
        soc_rib_address_2: enterprise.ribAddress2 || '',
        soc_rib_code_iban_2: enterprise.ribIban2 || '',
        soc_rib_code_bic_2: enterprise.ribBic2 || '',
        soc_rib_bank_code_2: enterprise.ribBankCode2 || '',
        soc_rib_agence_code_2: enterprise.ribAgencyCode2 || '',
        soc_rib_account_number_2: enterprise.ribAccountNumber2 || '',
        soc_rib_key_2: enterprise.ribKey2 || '',
        soc_rib_domiciliation_agency_2: enterprise.ribDomiciliationAgency2 || '',
        soc_rib_abbre_2: enterprise.ribAbbreviation2 || '',
        soc_quote_header_text: enterprise.quoteHeaderText || '',
        soc_quote_footer_text: enterprise.quoteFooterText || '',
        soc_delivery_conditions_text: enterprise.deliveryConditionsText || '',
        soc_invoice_penalty_text: enterprise.invoicePenaltyText || '',
        soc_invoice_early_payment_discount_text: enterprise.invoiceEarlyPaymentDiscountText || '',
        soc_invoice_email_body: enterprise.invoiceEmailBody || '',
        soc_pricing_coefficient_sod_cin: enterprise.pricingCoefficientSodCin ?? 1,
      })
    }
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormData({})
  }

  const handleSave = async () => {
    if (!enterprise) return

    try {
      await updateMutation.mutateAsync({ id: enterprise.id, data: formData })
      success(t('settings.changesSaved'), t('settings.changesSaved'))
      setIsEditing(false)
      setFormData({})
    } catch (err) {
      showError(t('common.error'), t('settings.enterprise.updateError'))
    }
  }

  const handleCreateExchangeRate = async () => {
    try {
      if (!exchangeRateForm.cur_id || !exchangeRateForm.cur_id2) {
        showError(t('common.error'), 'Please choose both currencies.')
        return
      }
      if (exchangeRateForm.cur_id === exchangeRateForm.cur_id2) {
        showError(t('common.error'), 'Base and target currencies must be different.')
        return
      }

      await createExchangeRateMutation.mutateAsync(exchangeRateForm)
      success(t('common.success'), 'Exchange rate added.')
      setExchangeRateForm((prev) => ({
        ...prev,
        mcu_rate_in: 1,
        mcu_rate_out: 1,
        mcu_rate_date: new Date().toISOString().slice(0, 10),
      }))
    } catch {
      showError(t('common.error'), 'Unable to add exchange rate.')
    }
  }

  const handleDeleteExchangeRate = async (rateId: number) => {
    try {
      await deleteExchangeRateMutation.mutateAsync(rateId)
      success(t('common.success'), 'Exchange rate deleted.')
    } catch {
      showError(t('common.error'), 'Unable to delete exchange rate.')
    }
  }

  const getCurrencyLabel = (currencyId: number) => {
    const match = currencies.find((item) => item.cur_id === currencyId)
    return match ? `${match.cur_designation} (${match.cur_symbol})` : String(currencyId)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    )
  }

  if (error || !enterprise) {
    return (
      <PageContainer>
        <div className="card p-6 text-center">
          <p className="text-destructive">{t('settings.enterprise.notFound')}</p>
        </div>
      </PageContainer>
    )
  }

  // Action buttons
  const actions = isEditing ? (
    <>
      <button onClick={handleCancelEdit} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSave}
        className="btn-primary"
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? <LoadingSpinner size="sm" /> : t('settings.saveChanges')}
      </button>
    </>
  ) : (
    <button onClick={handleStartEdit} className="btn-primary">
      <EditIcon className="w-4 h-4" />
      {t('common.edit')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('settings.enterprise.title')}
        description={t('settings.enterprise.description')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('settings.companyInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('settings.companyName')}
                value={isEditing ? formData.soc_society_name || '' : enterprise.companyName}
                onChange={(e) => setFormData({ ...formData, soc_society_name: e.target.value })}
                disabled={!isEditing}
                required
                className="md:col-span-2"
              />
              <FormInput
                label={t('settings.enterprise.shortLabel')}
                value={isEditing ? formData.soc_short_label || '' : enterprise.shortLabel || ''}
                onChange={(e) => setFormData({ ...formData, soc_short_label: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.capital')}
                value={isEditing ? formData.soc_capital || '' : enterprise.capital || ''}
                onChange={(e) => setFormData({ ...formData, soc_capital: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Address */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('settings.address')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('settings.enterprise.address1')}
                value={isEditing ? formData.soc_address1 || '' : enterprise.address1 || ''}
                onChange={(e) => setFormData({ ...formData, soc_address1: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
              <FormInput
                label={t('settings.enterprise.address2')}
                value={isEditing ? formData.soc_address2 || '' : enterprise.address2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_address2: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
              <FormInput
                label={t('settings.enterprise.postcode')}
                value={isEditing ? formData.soc_postcode || '' : enterprise.postcode || ''}
                onChange={(e) => setFormData({ ...formData, soc_postcode: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.city')}
                value={isEditing ? formData.soc_city || '' : enterprise.city || ''}
                onChange={(e) => setFormData({ ...formData, soc_city: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.county')}
                value={isEditing ? formData.soc_county || '' : enterprise.county || ''}
                onChange={(e) => setFormData({ ...formData, soc_county: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('settings.enterprise.contactInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                type="email"
                label={t('settings.email')}
                value={isEditing ? formData.soc_email || '' : enterprise.email || ''}
                onChange={(e) => setFormData({ ...formData, soc_email: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.phone')}
                value={isEditing ? formData.soc_tel || '' : enterprise.phone || ''}
                onChange={(e) => setFormData({ ...formData, soc_tel: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.cellphone')}
                value={isEditing ? formData.soc_cellphone || '' : enterprise.cellphone || ''}
                onChange={(e) => setFormData({ ...formData, soc_cellphone: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.fax')}
                value={isEditing ? formData.soc_fax || '' : enterprise.fax || ''}
                onChange={(e) => setFormData({ ...formData, soc_fax: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.website')}
                value={isEditing ? formData.soc_site || '' : enterprise.website || ''}
                onChange={(e) => setFormData({ ...formData, soc_site: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
            </div>
          </div>

          {/* Tax & Legal Information */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('settings.enterprise.taxLegalInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('settings.enterprise.siret')}
                value={isEditing ? formData.soc_siret || '' : enterprise.siret || ''}
                onChange={(e) => setFormData({ ...formData, soc_siret: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.rcs')}
                value={isEditing ? formData.soc_rcs || '' : enterprise.rcs || ''}
                onChange={(e) => setFormData({ ...formData, soc_rcs: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.vatIntra')}
                value={isEditing ? formData.soc_tva_intra || '' : enterprise.vatIntra || ''}
                onChange={(e) => setFormData({ ...formData, soc_tva_intra: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
            </div>
          </div>

          {/* Primary Bank (RIB) */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('settings.enterprise.primaryBank', 'Primary Bank (RIB)')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('settings.enterprise.bankName', 'Bank Name')}
                value={isEditing ? formData.soc_rib_name || '' : enterprise.ribName || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_name: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.bankAbbreviation', 'Bank Abbreviation')}
                value={isEditing ? formData.soc_rib_abbre || '' : enterprise.ribAbbreviation || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_abbre: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.bankAddress', 'Bank Address')}
                value={isEditing ? formData.soc_rib_address || '' : enterprise.ribAddress || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_address: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
              <FormInput
                label={t('settings.enterprise.iban', 'IBAN')}
                value={isEditing ? formData.soc_rib_code_iban || '' : enterprise.ribIban || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_code_iban: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.bic', 'BIC / SWIFT')}
                value={isEditing ? formData.soc_rib_code_bic || '' : enterprise.ribBic || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_code_bic: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.bankCode', 'Bank Code')}
                value={isEditing ? formData.soc_rib_bank_code || '' : enterprise.ribBankCode || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_bank_code: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.agencyCode', 'Agency Code')}
                value={isEditing ? formData.soc_rib_agence_code || '' : enterprise.ribAgencyCode || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_agence_code: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.accountNumber', 'Account Number')}
                value={isEditing ? formData.soc_rib_account_number || '' : enterprise.ribAccountNumber || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_account_number: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.ribKey', 'RIB Key')}
                value={isEditing ? formData.soc_rib_key || '' : enterprise.ribKey || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_key: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.domiciliationAgency', 'Domiciliation Agency')}
                value={isEditing ? formData.soc_rib_domiciliation_agency || '' : enterprise.ribDomiciliationAgency || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_domiciliation_agency: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
            </div>
          </div>

          {/* Secondary Bank (RIB) */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('settings.enterprise.secondaryBank', 'Secondary Bank (RIB)')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('settings.enterprise.bankName', 'Bank Name')}
                value={isEditing ? formData.soc_rib_name_2 || '' : enterprise.ribName2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_name_2: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.bankAbbreviation', 'Bank Abbreviation')}
                value={isEditing ? formData.soc_rib_abbre_2 || '' : enterprise.ribAbbreviation2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_abbre_2: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.bankAddress', 'Bank Address')}
                value={isEditing ? formData.soc_rib_address_2 || '' : enterprise.ribAddress2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_address_2: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
              <FormInput
                label={t('settings.enterprise.iban', 'IBAN')}
                value={isEditing ? formData.soc_rib_code_iban_2 || '' : enterprise.ribIban2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_code_iban_2: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.bic', 'BIC / SWIFT')}
                value={isEditing ? formData.soc_rib_code_bic_2 || '' : enterprise.ribBic2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_code_bic_2: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.bankCode', 'Bank Code')}
                value={isEditing ? formData.soc_rib_bank_code_2 || '' : enterprise.ribBankCode2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_bank_code_2: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.agencyCode', 'Agency Code')}
                value={isEditing ? formData.soc_rib_agence_code_2 || '' : enterprise.ribAgencyCode2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_agence_code_2: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.accountNumber', 'Account Number')}
                value={isEditing ? formData.soc_rib_account_number_2 || '' : enterprise.ribAccountNumber2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_account_number_2: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.ribKey', 'RIB Key')}
                value={isEditing ? formData.soc_rib_key_2 || '' : enterprise.ribKey2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_key_2: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('settings.enterprise.domiciliationAgency', 'Domiciliation Agency')}
                value={isEditing ? formData.soc_rib_domiciliation_agency_2 || '' : enterprise.ribDomiciliationAgency2 || ''}
                onChange={(e) => setFormData({ ...formData, soc_rib_domiciliation_agency_2: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
            </div>
          </div>

          {/* Document Templates */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">Document Templates</h3>
            <div className="space-y-4">
              <FormTextarea
                label="Quote Header Text"
                value={isEditing ? formData.soc_quote_header_text || '' : enterprise.quoteHeaderText || ''}
                onChange={(e) => setFormData({ ...formData, soc_quote_header_text: e.target.value })}
                disabled={!isEditing}
                rows={3}
              />
              <FormTextarea
                label="Quote Footer Text"
                value={isEditing ? formData.soc_quote_footer_text || '' : enterprise.quoteFooterText || ''}
                onChange={(e) => setFormData({ ...formData, soc_quote_footer_text: e.target.value })}
                disabled={!isEditing}
                rows={3}
              />
              <FormTextarea
                label="Delivery Conditions Text"
                value={isEditing ? formData.soc_delivery_conditions_text || '' : enterprise.deliveryConditionsText || ''}
                onChange={(e) => setFormData({ ...formData, soc_delivery_conditions_text: e.target.value })}
                disabled={!isEditing}
                rows={3}
              />
              <FormTextarea
                label="Invoice Penalty Text"
                value={isEditing ? formData.soc_invoice_penalty_text || '' : enterprise.invoicePenaltyText || ''}
                onChange={(e) => setFormData({ ...formData, soc_invoice_penalty_text: e.target.value })}
                disabled={!isEditing}
                rows={3}
              />
              <FormTextarea
                label="Invoice Early Payment Discount Text"
                value={isEditing ? formData.soc_invoice_early_payment_discount_text || '' : enterprise.invoiceEarlyPaymentDiscountText || ''}
                onChange={(e) => setFormData({ ...formData, soc_invoice_early_payment_discount_text: e.target.value })}
                disabled={!isEditing}
                rows={3}
              />
              <FormTextarea
                label="Invoice Email Body"
                value={isEditing ? formData.soc_invoice_email_body || '' : enterprise.invoiceEmailBody || ''}
                onChange={(e) => setFormData({ ...formData, soc_invoice_email_body: e.target.value })}
                disabled={!isEditing}
                rows={4}
              />
            </div>
          </div>

          {/* Pricing Configuration */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">Pricing Configuration</h3>
            <FormInput
              type="number"
              step="0.0001"
              label="Supplier Order to Invoice Coefficient"
              value={
                isEditing
                  ? String(formData.soc_pricing_coefficient_sod_cin ?? '')
                  : String(enterprise.pricingCoefficientSodCin ?? '')
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  soc_pricing_coefficient_sod_cin:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              disabled={!isEditing}
            />
          </div>

          {/* Exchange Rates */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">Currency Exchange Rates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <label className="form-control">
                <span className="label-text mb-1 text-sm">Base Currency</span>
                <select
                  className="input"
                  value={exchangeRateForm.cur_id || ''}
                  onChange={(e) =>
                    setExchangeRateForm({ ...exchangeRateForm, cur_id: Number(e.target.value) })
                  }
                >
                  <option value="">Select currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.cur_id} value={currency.cur_id}>
                      {currency.cur_designation} ({currency.cur_symbol})
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text mb-1 text-sm">Target Currency</span>
                <select
                  className="input"
                  value={exchangeRateForm.cur_id2 || ''}
                  onChange={(e) =>
                    setExchangeRateForm({ ...exchangeRateForm, cur_id2: Number(e.target.value) })
                  }
                >
                  <option value="">Select currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.cur_id} value={currency.cur_id}>
                      {currency.cur_designation} ({currency.cur_symbol})
                    </option>
                  ))}
                </select>
              </label>

              <FormInput
                type="number"
                step="0.000001"
                label="Inbound Rate"
                value={String(exchangeRateForm.mcu_rate_in)}
                onChange={(e) =>
                  setExchangeRateForm({
                    ...exchangeRateForm,
                    mcu_rate_in: Number(e.target.value || 0),
                  })
                }
              />
              <FormInput
                type="number"
                step="0.000001"
                label="Outbound Rate"
                value={String(exchangeRateForm.mcu_rate_out)}
                onChange={(e) =>
                  setExchangeRateForm({
                    ...exchangeRateForm,
                    mcu_rate_out: Number(e.target.value || 0),
                  })
                }
              />
              <FormInput
                type="date"
                label="Rate Date"
                value={exchangeRateForm.mcu_rate_date}
                onChange={(e) =>
                  setExchangeRateForm({
                    ...exchangeRateForm,
                    mcu_rate_date: e.target.value,
                  })
                }
              />
              <FormInput
                type="number"
                label="Language ID"
                value={String(exchangeRateForm.lng_id)}
                onChange={(e) =>
                  setExchangeRateForm({
                    ...exchangeRateForm,
                    lng_id: Number(e.target.value || 1),
                  })
                }
              />
            </div>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCreateExchangeRate}
                disabled={createExchangeRateMutation.isPending}
              >
                {createExchangeRateMutation.isPending ? 'Adding...' : 'Add Exchange Rate'}
              </button>
            </div>
            {isExchangeRatesLoading ? (
              <p className="text-sm text-muted-foreground">Loading exchange rates...</p>
            ) : exchangeRates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exchange rates configured yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Pair</th>
                      <th className="text-right py-2">In</th>
                      <th className="text-right py-2">Out</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangeRates.map((rate) => (
                      <tr key={rate.mcu_id} className="border-b">
                        <td className="py-2">
                          {getCurrencyLabel(rate.cur_id)} {'->'} {getCurrencyLabel(rate.cur_id2)}
                        </td>
                        <td className="text-right py-2">{rate.mcu_rate_in}</td>
                        <td className="text-right py-2">{rate.mcu_rate_out}</td>
                        <td className="py-2">{rate.mcu_rate_date}</td>
                        <td className="text-right py-2">
                          <button
                            type="button"
                            className="text-sm text-destructive hover:underline"
                            onClick={() => handleDeleteExchangeRate(rate.mcu_id)}
                            disabled={deleteExchangeRateMutation.isPending}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('common.status')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('common.status')}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${enterprise.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                  {enterprise.isActive ? t('common.active') : t('common.inactive')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID</span>
                <span className="text-sm">{enterprise.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('settings.enterprise.quickInfo')}</h3>
            <div className="space-y-3 text-sm">
              {enterprise.fullAddress && (
                <div>
                  <span className="text-muted-foreground block mb-1">{t('settings.address')}</span>
                  <span>{enterprise.fullAddress}</span>
                </div>
              )}
              {enterprise.email && (
                <div>
                  <span className="text-muted-foreground block mb-1">{t('settings.email')}</span>
                  <span>{enterprise.email}</span>
                </div>
              )}
              {enterprise.phone && (
                <div>
                  <span className="text-muted-foreground block mb-1">{t('settings.phone')}</span>
                  <span>{enterprise.phone}</span>
                </div>
              )}
              {enterprise.website && (
                <div>
                  <span className="text-muted-foreground block mb-1">{t('settings.website')}</span>
                  <a href={enterprise.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {enterprise.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

// Icon component
function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  )
}
