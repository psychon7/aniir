import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/ui/form/FormField'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormTextarea } from '@/components/ui/form/FormTextarea'
import { FormCheckbox } from '@/components/ui/form/FormCheckbox'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import {
  useCountries,
  useCurrencies,
  useClientTypes,
  useClientStatuses,
  useVatRates,
  usePaymentModes,
  usePaymentTerms,
  useBusinessUnits,
  useSocieties,
  useLanguages,
} from '@/hooks/useLookups'
import { useUsersLookup } from '@/hooks/useUsers'
import type { Client, ClientCreateDto } from '@/types/client'

// Form validation schema
const clientSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100),
  abbreviation: z.string().max(100).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  phone2: z.string().max(30).optional(),
  mobile: z.string().max(30).optional(),
  fax: z.string().max(30).optional(),
  accountingEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  receiveNewsletter: z.boolean().optional(),
  newsletterEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().max(200).optional(),
  address2: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  countryId: z.coerce.number().optional(),
  country: z.string().max(100).optional(),
  vatNumber: z.string().max(50).optional(),
  vatIntra: z.string().max(50).optional(),
  siren: z.string().max(30).optional(),
  siret: z.string().max(20).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  clientTypeId: z.coerce.number().optional(),
  activityId: z.coerce.number().optional(),
  statusId: z.coerce.number().min(1, 'Status is required'),
  currencyId: z.coerce.number().min(1, 'Currency is required'),
  vatId: z.coerce.number().optional(),
  paymentConditionId: z.coerce.number().optional(),
  paymentModeId: z.coerce.number().optional(),
  paymentTermId: z.coerce.number().optional(),
  commercialUser1Id: z.coerce.number().optional(),
  commercialUser2Id: z.coerce.number().optional(),
  commercialUser3Id: z.coerce.number().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  invoiceDay: z.coerce.number().min(1).max(31).optional(),
  invoiceDayIsLastDay: z.boolean().optional(),
  businessUnitId: z.coerce.number().optional(),
  societyId: z.coerce.number().min(1, 'Society is required'),
  languageId: z.coerce.number().optional(),
  commentForClient: z.string().max(2000).optional(),
  commentInternal: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional(),
  bankIban: z.string().max(50).optional(),
  bankBic: z.string().max(20).optional(),
  bankName: z.string().max(200).optional(),
  bankAccountHolder: z.string().max(200).optional(),
  bankAddress: z.string().max(400).optional(),
  isActive: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  showDetail: z.boolean().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ClientCreateDto) => void
  client?: Client | null
  isSubmitting?: boolean
}

export function ClientForm({
  isOpen,
  onClose,
  onSubmit,
  client,
  isSubmitting = false,
}: ClientFormProps) {
  const { t } = useTranslation()
  const isEditing = !!client

  // Load lookups
  const { data: countries = [] } = useCountries()
  const { data: currencies = [] } = useCurrencies()
  const { data: clientTypes = [] } = useClientTypes()
  const { data: clientStatuses = [] } = useClientStatuses()
  const { data: vatRates = [] } = useVatRates()
  const { data: paymentModes = [] } = usePaymentModes()
  const { data: paymentTerms = [] } = usePaymentTerms()
  const { data: businessUnits = [] } = useBusinessUnits()
  const { data: societies = [] } = useSocieties()
  const { data: languages = [] } = useLanguages()
  const { data: users = [] } = useUsersLookup(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      companyName: client?.companyName || '',
      abbreviation: client?.abbreviation || '',
      firstName: client?.firstName || '',
      lastName: client?.lastName || '',
      email: client?.email || '',
      phone: client?.phone || '',
      phone2: client?.phone2 || '',
      mobile: client?.mobile || '',
      fax: client?.fax || '',
      accountingEmail: client?.accountingEmail || '',
      receiveNewsletter: client?.receiveNewsletter || false,
      newsletterEmail: client?.newsletterEmail || '',
      address: client?.address || '',
      address2: client?.address2 || '',
      postalCode: client?.postalCode || '',
      city: client?.city || '',
      countryId: client?.countryId || undefined,
      country: client?.country || '',
      vatNumber: client?.vatNumber || '',
      vatIntra: client?.vatIntra || '',
      siren: client?.siren || '',
      siret: client?.siret || '',
      website: client?.website || '',
      clientTypeId: client?.clientTypeId || undefined,
      activityId: client?.activityId || undefined,
      statusId: client?.statusId || 1,
      currencyId: client?.currencyId || 1,
      vatId: client?.vatId || undefined,
      paymentConditionId: client?.paymentConditionId || undefined,
      paymentModeId: client?.paymentModeId || undefined,
      paymentTermId: client?.paymentTermId || undefined,
      commercialUser1Id: client?.commercialUser1Id || undefined,
      commercialUser2Id: client?.commercialUser2Id || undefined,
      commercialUser3Id: client?.commercialUser3Id || undefined,
      creditLimit: client?.creditLimit || 0,
      discount: client?.discount || 0,
      invoiceDay: client?.invoiceDay || undefined,
      invoiceDayIsLastDay: client?.invoiceDayIsLastDay || false,
      businessUnitId: client?.businessUnitId || undefined,
      societyId: client?.societyId || 1,
      languageId: client?.languageId || undefined,
      commentForClient: client?.commentForClient || '',
      commentInternal: client?.commentInternal || '',
      notes: client?.notes || '',
      bankIban: client?.bankIban || '',
      bankBic: client?.bankBic || '',
      bankName: client?.bankName || '',
      bankAccountHolder: client?.bankAccountHolder || '',
      bankAddress: client?.bankAddress || '',
      isActive: client?.isActive ?? true,
      isBlocked: client?.isBlocked ?? false,
      showDetail: client?.showDetail ?? false,
    },
  })

  const handleFormSubmit = (data: ClientFormData) => {
    const normalizeOptionalNumber = (value?: number) => {
      if (value == null || Number.isNaN(value) || value <= 0) return undefined
      return value
    }

    const payload: ClientCreateDto = {
      ...data,
      countryId: normalizeOptionalNumber(data.countryId),
      clientTypeId: normalizeOptionalNumber(data.clientTypeId),
      activityId: normalizeOptionalNumber(data.activityId),
      vatId: normalizeOptionalNumber(data.vatId),
      paymentConditionId: normalizeOptionalNumber(data.paymentConditionId),
      paymentModeId: normalizeOptionalNumber(data.paymentModeId),
      paymentTermId: normalizeOptionalNumber(data.paymentTermId),
      businessUnitId: normalizeOptionalNumber(data.businessUnitId),
      languageId: normalizeOptionalNumber(data.languageId),
      commercialUser1Id: normalizeOptionalNumber(data.commercialUser1Id),
      commercialUser2Id: normalizeOptionalNumber(data.commercialUser2Id),
      commercialUser3Id: normalizeOptionalNumber(data.commercialUser3Id),
      invoiceDay: normalizeOptionalNumber(data.invoiceDay),
    }

    onSubmit(payload)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? t('clients.editClient') : t('clients.newClient')}
      description={isEditing ? t('clients.updateClientInfo') : t('clients.addNewClient')}
      size="lg"
      footer={
        <FormModalFooter
          onCancel={handleClose}
          onSubmit={handleSubmit(handleFormSubmit)}
          submitText={isEditing ? t('common.saveChanges') : t('clients.createClient')}
          isSubmitting={isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Company Information */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('clients.companyInformation')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t('clients.companyName')}
              htmlFor="companyName"
              error={errors.companyName?.message}
              required
              className="md:col-span-2"
            >
              <FormInput
                id="companyName"
                {...register('companyName')}
                error={!!errors.companyName}
                placeholder={t('clients.enterCompanyName')}
              />
            </FormField>

            <FormField label={t('clients.abbreviation', 'Abbreviation')} htmlFor="abbreviation" error={errors.abbreviation?.message}>
              <FormInput
                id="abbreviation"
                {...register('abbreviation')}
                error={!!errors.abbreviation}
                placeholder="ECOLED"
              />
            </FormField>

            <FormField label={t('clients.firstName')} htmlFor="firstName" error={errors.firstName?.message}>
              <FormInput
                id="firstName"
                {...register('firstName')}
                error={!!errors.firstName}
                placeholder={t('clients.contactFirstName')}
              />
            </FormField>

            <FormField label={t('clients.lastName')} htmlFor="lastName" error={errors.lastName?.message}>
              <FormInput
                id="lastName"
                {...register('lastName')}
                error={!!errors.lastName}
                placeholder={t('clients.contactLastName')}
              />
            </FormField>

            <FormField label={t('common.email')} htmlFor="email" error={errors.email?.message}>
              <FormInput
                id="email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                placeholder="email@company.com"
              />
            </FormField>

            <FormField label={t('common.phone')} htmlFor="phone" error={errors.phone?.message}>
              <FormInput
                id="phone"
                type="tel"
                {...register('phone')}
                error={!!errors.phone}
                placeholder="+33 1 23 45 67 89"
              />
            </FormField>

            <FormField label={t('clients.phone2', 'Phone 2')} htmlFor="phone2" error={errors.phone2?.message}>
              <FormInput
                id="phone2"
                type="tel"
                {...register('phone2')}
                error={!!errors.phone2}
                placeholder="+33 1 98 76 54 32"
              />
            </FormField>

            <FormField label={t('clients.mobile')} htmlFor="mobile" error={errors.mobile?.message}>
              <FormInput
                id="mobile"
                type="tel"
                {...register('mobile')}
                error={!!errors.mobile}
                placeholder="+33 6 12 34 56 78"
              />
            </FormField>

            <FormField label={t('clients.fax', 'Fax')} htmlFor="fax" error={errors.fax?.message}>
              <FormInput
                id="fax"
                type="tel"
                {...register('fax')}
                error={!!errors.fax}
                placeholder="+33 1 11 22 33 44"
              />
            </FormField>

            <FormField label={t('clients.accountingEmail', 'Accounting Email')} htmlFor="accountingEmail" error={errors.accountingEmail?.message}>
              <FormInput
                id="accountingEmail"
                type="email"
                {...register('accountingEmail')}
                error={!!errors.accountingEmail}
                placeholder="accounting@company.com"
              />
            </FormField>

            <FormField label={t('common.website')} htmlFor="website" error={errors.website?.message}>
              <FormInput
                id="website"
                type="url"
                {...register('website')}
                error={!!errors.website}
                placeholder="https://company.com"
              />
            </FormField>

            <FormField label={t('clients.newsletterEmail', 'Newsletter Email')} htmlFor="newsletterEmail" error={errors.newsletterEmail?.message}>
              <FormInput
                id="newsletterEmail"
                type="email"
                {...register('newsletterEmail')}
                error={!!errors.newsletterEmail}
                placeholder="newsletter@company.com"
              />
            </FormField>

            <FormField className="md:col-span-2">
              <FormCheckbox
                id="receiveNewsletter"
                {...register('receiveNewsletter')}
                label={t('clients.receiveNewsletter', 'Receive Newsletter')}
              />
            </FormField>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('common.address')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('common.address')} htmlFor="address" error={errors.address?.message} className="md:col-span-2">
              <FormInput
                id="address"
                {...register('address')}
                error={!!errors.address}
                placeholder={t('clients.streetAddress')}
              />
            </FormField>

            <FormField label={t('clients.addressLine2')} htmlFor="address2" error={errors.address2?.message} className="md:col-span-2">
              <FormInput
                id="address2"
                {...register('address2')}
                error={!!errors.address2}
                placeholder={t('clients.buildingFloor')}
              />
            </FormField>

            <FormField label={t('clients.postalCode')} htmlFor="postalCode" error={errors.postalCode?.message}>
              <FormInput
                id="postalCode"
                {...register('postalCode')}
                error={!!errors.postalCode}
                placeholder="75001"
              />
            </FormField>

            <FormField label={t('clients.city')} htmlFor="city" error={errors.city?.message}>
              <FormInput
                id="city"
                {...register('city')}
                error={!!errors.city}
                placeholder="Paris"
              />
            </FormField>

            <FormField label={t('clients.country')} htmlFor="countryId" error={errors.countryId?.message}>
              <FormSelect
                id="countryId"
                {...register('countryId')}
                error={!!errors.countryId}
                placeholder={t('clients.selectCountry')}
                options={countries.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('clients.countryName', 'Country (Text)')} htmlFor="country" error={errors.country?.message}>
              <FormInput
                id="country"
                {...register('country')}
                error={!!errors.country}
                placeholder="France"
              />
            </FormField>
          </div>
        </div>

        {/* Business Details */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('clients.businessDetails')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('clients.vatNumber')} htmlFor="vatNumber" error={errors.vatNumber?.message}>
              <FormInput
                id="vatNumber"
                {...register('vatNumber')}
                error={!!errors.vatNumber}
                placeholder="FR12345678901"
              />
            </FormField>

            <FormField label={t('clients.vatIntra', 'VAT Intra')} htmlFor="vatIntra" error={errors.vatIntra?.message}>
              <FormInput
                id="vatIntra"
                {...register('vatIntra')}
                error={!!errors.vatIntra}
                placeholder="FR12345678901"
              />
            </FormField>

            <FormField label={t('clients.siren', 'SIREN')} htmlFor="siren" error={errors.siren?.message}>
              <FormInput
                id="siren"
                {...register('siren')}
                error={!!errors.siren}
                placeholder="123456789"
              />
            </FormField>

            <FormField label={t('clients.siret')} htmlFor="siret" error={errors.siret?.message}>
              <FormInput
                id="siret"
                {...register('siret')}
                error={!!errors.siret}
                placeholder="12345678901234"
              />
            </FormField>

            <FormField label={t('clients.clientType')} htmlFor="clientTypeId" error={errors.clientTypeId?.message}>
              <FormSelect
                id="clientTypeId"
                {...register('clientTypeId')}
                error={!!errors.clientTypeId}
                placeholder={t('clients.selectType')}
                options={clientTypes.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('clients.activity', 'Activity / Status')} htmlFor="activityId" error={errors.activityId?.message}>
              <FormSelect
                id="activityId"
                {...register('activityId')}
                error={!!errors.activityId}
                placeholder={t('clients.selectStatus', 'Select status')}
                options={clientStatuses.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('common.status')} htmlFor="statusId" error={errors.statusId?.message} required>
              <FormSelect
                id="statusId"
                {...register('statusId')}
                error={!!errors.statusId}
                options={clientStatuses.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('clients.vatRate', 'VAT Rate')} htmlFor="vatId" error={errors.vatId?.message}>
              <FormSelect
                id="vatId"
                {...register('vatId')}
                error={!!errors.vatId}
                placeholder={t('clients.selectVatRate', 'Select VAT rate')}
                options={vatRates.map((c) => ({ value: c.key, label: c.value2 ? `${c.value} (${c.value2})` : c.value }))}
              />
            </FormField>

            <FormField label={t('clients.businessUnit')} htmlFor="businessUnitId" error={errors.businessUnitId?.message}>
              <FormSelect
                id="businessUnitId"
                {...register('businessUnitId')}
                error={!!errors.businessUnitId}
                placeholder={t('clients.selectBusinessUnit')}
                options={businessUnits.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('clients.society')} htmlFor="societyId" error={errors.societyId?.message} required>
              <FormSelect
                id="societyId"
                {...register('societyId')}
                error={!!errors.societyId}
                options={societies.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('common.language')} htmlFor="languageId" error={errors.languageId?.message}>
              <FormSelect
                id="languageId"
                {...register('languageId')}
                error={!!errors.languageId}
                placeholder={t('clients.selectLanguage')}
                options={languages.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('clients.commercial1', 'Commercial 1')} htmlFor="commercialUser1Id" error={errors.commercialUser1Id?.message}>
              <FormSelect
                id="commercialUser1Id"
                {...register('commercialUser1Id')}
                error={!!errors.commercialUser1Id}
                placeholder={t('clients.selectCommercial', 'Select commercial')}
                options={users.map((u) => ({ value: u.id, label: u.fullName || u.login }))}
              />
            </FormField>

            <FormField label={t('clients.commercial2', 'Commercial 2')} htmlFor="commercialUser2Id" error={errors.commercialUser2Id?.message}>
              <FormSelect
                id="commercialUser2Id"
                {...register('commercialUser2Id')}
                error={!!errors.commercialUser2Id}
                placeholder={t('clients.selectCommercial', 'Select commercial')}
                options={users.map((u) => ({ value: u.id, label: u.fullName || u.login }))}
              />
            </FormField>

            <FormField label={t('clients.commercial3', 'Commercial 3')} htmlFor="commercialUser3Id" error={errors.commercialUser3Id?.message}>
              <FormSelect
                id="commercialUser3Id"
                {...register('commercialUser3Id')}
                error={!!errors.commercialUser3Id}
                placeholder={t('clients.selectCommercial', 'Select commercial')}
                options={users.map((u) => ({ value: u.id, label: u.fullName || u.login }))}
              />
            </FormField>
          </div>
        </div>

        {/* Payment Terms */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('clients.paymentTerms')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('clients.currency')} htmlFor="currencyId" error={errors.currencyId?.message} required>
              <FormSelect
                id="currencyId"
                {...register('currencyId')}
                error={!!errors.currencyId}
                options={currencies.map((c) => ({ value: c.key, label: `${c.value} (${c.value2})` }))}
              />
            </FormField>

            <FormField label={t('clients.paymentMode')} htmlFor="paymentModeId" error={errors.paymentModeId?.message}>
              <FormSelect
                id="paymentModeId"
                {...register('paymentModeId')}
                error={!!errors.paymentModeId}
                placeholder={t('clients.selectPaymentMode')}
                options={paymentModes.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('clients.paymentCondition', 'Payment Condition')} htmlFor="paymentConditionId" error={errors.paymentConditionId?.message}>
              <FormSelect
                id="paymentConditionId"
                {...register('paymentConditionId')}
                error={!!errors.paymentConditionId}
                placeholder={t('clients.selectPaymentTerms')}
                options={paymentTerms.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('clients.paymentTermsLabel')} htmlFor="paymentTermId" error={errors.paymentTermId?.message}>
              <FormSelect
                id="paymentTermId"
                {...register('paymentTermId')}
                error={!!errors.paymentTermId}
                placeholder={t('clients.selectPaymentTerms')}
                options={paymentTerms.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('clients.creditLimit')} htmlFor="creditLimit" error={errors.creditLimit?.message}>
              <FormInput
                id="creditLimit"
                type="number"
                min="0"
                step="100"
                {...register('creditLimit')}
                error={!!errors.creditLimit}
                placeholder="0"
              />
            </FormField>

            <FormField label={t('clients.discount')} htmlFor="discount" error={errors.discount?.message}>
              <FormInput
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.5"
                {...register('discount')}
                error={!!errors.discount}
                placeholder="0"
              />
            </FormField>

            <FormField label={t('clients.invoiceDay', 'Invoice Day')} htmlFor="invoiceDay" error={errors.invoiceDay?.message}>
              <FormSelect
                id="invoiceDay"
                {...register('invoiceDay')}
                error={!!errors.invoiceDay}
                placeholder={t('clients.selectInvoiceDay', 'Select day')}
                options={Array.from({ length: 31 }, (_, index) => ({ value: index + 1, label: String(index + 1) }))}
              />
            </FormField>

            <FormField className="md:col-span-2">
              <FormCheckbox
                id="invoiceDayIsLastDay"
                {...register('invoiceDayIsLastDay')}
                label={t('clients.invoiceLastDay', 'Invoice on last day of month')}
              />
            </FormField>
          </div>
        </div>

        {/* Comments */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('common.notes')}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <FormField label={t('clients.commentForClient', 'Comment For Client')} htmlFor="commentForClient" error={errors.commentForClient?.message}>
              <FormTextarea
                id="commentForClient"
                {...register('commentForClient')}
                error={!!errors.commentForClient}
                placeholder={t('clients.addCommentForClient', 'Visible note for client documents')}
                rows={3}
              />
            </FormField>

            <FormField label={t('clients.commentInternal', 'Internal Comment')} htmlFor="commentInternal" error={errors.commentInternal?.message}>
              <FormTextarea
                id="commentInternal"
                {...register('commentInternal')}
                error={!!errors.commentInternal}
                placeholder={t('clients.addInternalComment', 'Private note for internal teams')}
                rows={3}
              />
            </FormField>

          <FormField label={t('clients.internalNotes')} htmlFor="notes" error={errors.notes?.message}>
            <FormTextarea
              id="notes"
              {...register('notes')}
              error={!!errors.notes}
              placeholder={t('clients.addInternalNotes')}
              rows={4}
            />
          </FormField>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('clients.bankDetails', 'Bank Details')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="IBAN" htmlFor="bankIban" error={errors.bankIban?.message} className="md:col-span-2">
              <FormInput
                id="bankIban"
                {...register('bankIban')}
                error={!!errors.bankIban}
                placeholder="FR76 3000 6000 0112 3456 7890 189"
              />
            </FormField>

            <FormField label="BIC / SWIFT" htmlFor="bankBic" error={errors.bankBic?.message}>
              <FormInput
                id="bankBic"
                {...register('bankBic')}
                error={!!errors.bankBic}
                placeholder="BNPAFRPP"
              />
            </FormField>

            <FormField label={t('clients.bankName', 'Bank Name')} htmlFor="bankName" error={errors.bankName?.message}>
              <FormInput
                id="bankName"
                {...register('bankName')}
                error={!!errors.bankName}
                placeholder="BNP Paribas"
              />
            </FormField>

            <FormField label={t('clients.accountHolder', 'Account Holder')} htmlFor="bankAccountHolder" error={errors.bankAccountHolder?.message}>
              <FormInput
                id="bankAccountHolder"
                {...register('bankAccountHolder')}
                error={!!errors.bankAccountHolder}
                placeholder="SARL Company Name"
              />
            </FormField>

            <FormField label={t('clients.bankAddress', 'Bank Address')} htmlFor="bankAddress" error={errors.bankAddress?.message}>
              <FormInput
                id="bankAddress"
                {...register('bankAddress')}
                error={!!errors.bankAddress}
                placeholder="16 Boulevard des Italiens, 75009 Paris"
              />
            </FormField>
          </div>
        </div>

        {/* Flags */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('common.status')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField>
              <FormCheckbox
                id="isActive"
                {...register('isActive')}
                label={t('common.active', 'Active')}
              />
            </FormField>
            <FormField>
              <FormCheckbox
                id="isBlocked"
                {...register('isBlocked')}
                label={t('clients.blocked', 'Blocked')}
              />
            </FormField>
            <FormField>
              <FormCheckbox
                id="showDetail"
                {...register('showDetail')}
                label={t('clients.showDetail', 'Show Detail')}
              />
            </FormField>
          </div>
        </div>
      </form>
    </FormModal>
  )
}
