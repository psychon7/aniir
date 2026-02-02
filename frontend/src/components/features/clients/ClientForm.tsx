import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/ui/form/FormField'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormTextarea } from '@/components/ui/form/FormTextarea'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import {
  useCountries,
  useCurrencies,
  useClientTypes,
  useClientStatuses,
  usePaymentModes,
  usePaymentTerms,
  useBusinessUnits,
  useSocieties,
  useLanguages,
} from '@/hooks/useLookups'
import type { Client, ClientCreateDto } from '@/types/client'

// Form validation schema
const clientSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  mobile: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  address2: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  countryId: z.coerce.number().optional(),
  vatNumber: z.string().max(50).optional(),
  siret: z.string().max(20).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  clientTypeId: z.coerce.number().optional(),
  statusId: z.coerce.number().min(1, 'Status is required'),
  currencyId: z.coerce.number().min(1, 'Currency is required'),
  paymentModeId: z.coerce.number().optional(),
  paymentTermId: z.coerce.number().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  businessUnitId: z.coerce.number().optional(),
  societyId: z.coerce.number().min(1, 'Society is required'),
  languageId: z.coerce.number().optional(),
  notes: z.string().max(1000).optional(),
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
  const { data: paymentModes = [] } = usePaymentModes()
  const { data: paymentTerms = [] } = usePaymentTerms()
  const { data: businessUnits = [] } = useBusinessUnits()
  const { data: societies = [] } = useSocieties()
  const { data: languages = [] } = useLanguages()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      companyName: client?.companyName || '',
      firstName: client?.firstName || '',
      lastName: client?.lastName || '',
      email: client?.email || '',
      phone: client?.phone || '',
      mobile: client?.mobile || '',
      address: client?.address || '',
      address2: client?.address2 || '',
      postalCode: client?.postalCode || '',
      city: client?.city || '',
      countryId: client?.countryId || undefined,
      vatNumber: client?.vatNumber || '',
      siret: client?.siret || '',
      website: client?.website || '',
      clientTypeId: client?.clientTypeId || undefined,
      statusId: client?.statusId || 1,
      currencyId: client?.currencyId || 1,
      paymentModeId: client?.paymentModeId || undefined,
      paymentTermId: client?.paymentTermId || undefined,
      creditLimit: client?.creditLimit || 0,
      discount: client?.discount || 0,
      businessUnitId: client?.businessUnitId || undefined,
      societyId: client?.societyId || 1,
      languageId: client?.languageId || undefined,
      notes: client?.notes || '',
    },
  })

  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit(data as ClientCreateDto)
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

            <FormField label={t('clients.mobile')} htmlFor="mobile" error={errors.mobile?.message}>
              <FormInput
                id="mobile"
                type="tel"
                {...register('mobile')}
                error={!!errors.mobile}
                placeholder="+33 6 12 34 56 78"
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

            <FormField label={t('common.status')} htmlFor="statusId" error={errors.statusId?.message} required>
              <FormSelect
                id="statusId"
                {...register('statusId')}
                error={!!errors.statusId}
                options={clientStatuses.map((c) => ({ value: c.key, label: c.value }))}
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
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('common.notes')}
          </h3>
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
      </form>
    </FormModal>
  )
}
