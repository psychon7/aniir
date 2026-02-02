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
  useCurrencies,
  usePaymentModes,
  usePaymentTerms,
  useSocieties,
} from '@/hooks/useLookups'
import { useSupplierTypes } from '@/hooks/useSuppliers'
import type { Supplier, SupplierCreateDto } from '@/types/supplier'

// Form validation schema
const supplierSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100),
  abbreviation: z.string().max(20).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  phone2: z.string().max(30).optional(),
  mobile: z.string().max(30).optional(),
  fax: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  address2: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  vatNumber: z.string().max(50).optional(),
  siren: z.string().max(20).optional(),
  siret: z.string().max(20).optional(),
  supplierTypeId: z.coerce.number().optional(),
  currencyId: z.coerce.number().min(1, 'Currency is required'),
  paymentModeId: z.coerce.number().optional(),
  paymentConditionId: z.coerce.number().optional(),
  vatId: z.coerce.number().optional(),
  societyId: z.coerce.number().min(1, 'Society is required'),
  receiveNewsletter: z.boolean().optional(),
  newsletterEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  internalComment: z.string().max(2000).optional(),
  supplierComment: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  freeOfHarbor: z.coerce.number().min(0).optional(),
})

type SupplierFormData = z.infer<typeof supplierSchema>

interface SupplierFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SupplierCreateDto) => void
  supplier?: Supplier | null
  isSubmitting?: boolean
}

export function SupplierForm({
  isOpen,
  onClose,
  onSubmit,
  supplier,
  isSubmitting = false,
}: SupplierFormProps) {
  const { t } = useTranslation()
  const isEditing = !!supplier

  // Load lookups
  const { data: currencies = [] } = useCurrencies()
  const { data: paymentModes = [] } = usePaymentModes()
  const { data: paymentTerms = [] } = usePaymentTerms()
  const { data: societies = [] } = useSocieties()
  const { data: supplierTypes = [] } = useSupplierTypes()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      companyName: supplier?.companyName || '',
      abbreviation: supplier?.abbreviation || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      phone2: supplier?.phone2 || '',
      mobile: supplier?.mobile || '',
      fax: supplier?.fax || '',
      address: supplier?.address || '',
      address2: supplier?.address2 || '',
      postalCode: supplier?.postalCode || '',
      city: supplier?.city || '',
      country: supplier?.country || '',
      vatNumber: supplier?.vatNumber || '',
      siren: supplier?.siren || '',
      siret: supplier?.siret || '',
      supplierTypeId: supplier?.supplierTypeId || undefined,
      currencyId: supplier?.currencyId || 1,
      paymentModeId: supplier?.paymentModeId || undefined,
      paymentConditionId: supplier?.paymentConditionId || undefined,
      vatId: supplier?.vatId || undefined,
      societyId: supplier?.societyId || 1,
      receiveNewsletter: supplier?.receiveNewsletter || false,
      newsletterEmail: supplier?.newsletterEmail || '',
      internalComment: supplier?.internalComment || '',
      supplierComment: supplier?.supplierComment || '',
      isActive: supplier?.isActive ?? true,
      isBlocked: supplier?.isBlocked || false,
      freeOfHarbor: supplier?.freeOfHarbor || 0,
    },
  })

  const receiveNewsletter = watch('receiveNewsletter')

  const handleFormSubmit = (data: SupplierFormData) => {
    onSubmit(data as SupplierCreateDto)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? t('suppliers.editSupplier') : t('suppliers.newSupplier')}
      description={isEditing ? t('suppliers.updateSupplierInfo') : t('suppliers.addNewSupplier')}
      size="lg"
      footer={
        <FormModalFooter
          onCancel={handleClose}
          onSubmit={handleSubmit(handleFormSubmit)}
          submitText={isEditing ? t('common.saveChanges') : t('suppliers.createSupplier')}
          isSubmitting={isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Company Information */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('suppliers.companyInformation')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t('suppliers.companyName')}
              htmlFor="companyName"
              error={errors.companyName?.message}
              required
              className="md:col-span-2"
            >
              <FormInput
                id="companyName"
                {...register('companyName')}
                error={!!errors.companyName}
                placeholder={t('suppliers.enterCompanyName')}
              />
            </FormField>

            <FormField label={t('suppliers.abbreviation')} htmlFor="abbreviation" error={errors.abbreviation?.message}>
              <FormInput
                id="abbreviation"
                {...register('abbreviation')}
                error={!!errors.abbreviation}
                placeholder={t('suppliers.shortName')}
              />
            </FormField>

            <FormField label={t('suppliers.supplierType')} htmlFor="supplierTypeId" error={errors.supplierTypeId?.message}>
              <FormSelect
                id="supplierTypeId"
                {...register('supplierTypeId')}
                error={!!errors.supplierTypeId}
                placeholder={t('suppliers.selectType')}
                options={supplierTypes.map((t) => ({ value: t.key, label: t.value }))}
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

            <FormField label={t('suppliers.phone2')} htmlFor="phone2" error={errors.phone2?.message}>
              <FormInput
                id="phone2"
                type="tel"
                {...register('phone2')}
                error={!!errors.phone2}
                placeholder="+33 1 23 45 67 90"
              />
            </FormField>

            <FormField label={t('suppliers.mobile')} htmlFor="mobile" error={errors.mobile?.message}>
              <FormInput
                id="mobile"
                type="tel"
                {...register('mobile')}
                error={!!errors.mobile}
                placeholder="+33 6 12 34 56 78"
              />
            </FormField>

            <FormField label={t('suppliers.fax')} htmlFor="fax" error={errors.fax?.message}>
              <FormInput
                id="fax"
                type="tel"
                {...register('fax')}
                error={!!errors.fax}
                placeholder="+33 1 23 45 67 99"
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
                placeholder={t('suppliers.streetAddress')}
              />
            </FormField>

            <FormField label={t('suppliers.addressLine2')} htmlFor="address2" error={errors.address2?.message} className="md:col-span-2">
              <FormInput
                id="address2"
                {...register('address2')}
                error={!!errors.address2}
                placeholder={t('suppliers.buildingFloor')}
              />
            </FormField>

            <FormField label={t('suppliers.postalCode')} htmlFor="postalCode" error={errors.postalCode?.message}>
              <FormInput
                id="postalCode"
                {...register('postalCode')}
                error={!!errors.postalCode}
                placeholder="75001"
              />
            </FormField>

            <FormField label={t('suppliers.city')} htmlFor="city" error={errors.city?.message}>
              <FormInput
                id="city"
                {...register('city')}
                error={!!errors.city}
                placeholder="Paris"
              />
            </FormField>

            <FormField label={t('suppliers.country')} htmlFor="country" error={errors.country?.message}>
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
            {t('suppliers.businessDetails')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('suppliers.vatNumber')} htmlFor="vatNumber" error={errors.vatNumber?.message}>
              <FormInput
                id="vatNumber"
                {...register('vatNumber')}
                error={!!errors.vatNumber}
                placeholder="FR12345678901"
              />
            </FormField>

            <FormField label={t('suppliers.siren')} htmlFor="siren" error={errors.siren?.message}>
              <FormInput
                id="siren"
                {...register('siren')}
                error={!!errors.siren}
                placeholder="123456789"
              />
            </FormField>

            <FormField label={t('suppliers.siret')} htmlFor="siret" error={errors.siret?.message}>
              <FormInput
                id="siret"
                {...register('siret')}
                error={!!errors.siret}
                placeholder="12345678901234"
              />
            </FormField>

            <FormField label={t('suppliers.society')} htmlFor="societyId" error={errors.societyId?.message} required>
              <FormSelect
                id="societyId"
                {...register('societyId')}
                error={!!errors.societyId}
                options={societies.map((s) => ({ value: s.key, label: s.value }))}
              />
            </FormField>
          </div>
        </div>

        {/* Payment Terms */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('suppliers.paymentTerms')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('suppliers.currency')} htmlFor="currencyId" error={errors.currencyId?.message} required>
              <FormSelect
                id="currencyId"
                {...register('currencyId')}
                error={!!errors.currencyId}
                options={currencies.map((c) => ({ value: c.key, label: `${c.value} (${c.value2})` }))}
              />
            </FormField>

            <FormField label={t('suppliers.paymentMode')} htmlFor="paymentModeId" error={errors.paymentModeId?.message}>
              <FormSelect
                id="paymentModeId"
                {...register('paymentModeId')}
                error={!!errors.paymentModeId}
                placeholder={t('suppliers.selectPaymentMode')}
                options={paymentModes.map((p) => ({ value: p.key, label: p.value }))}
              />
            </FormField>

            <FormField label={t('suppliers.paymentTermsLabel')} htmlFor="paymentConditionId" error={errors.paymentConditionId?.message}>
              <FormSelect
                id="paymentConditionId"
                {...register('paymentConditionId')}
                error={!!errors.paymentConditionId}
                placeholder={t('suppliers.selectPaymentTerms')}
                options={paymentTerms.map((p) => ({ value: p.key, label: p.value }))}
              />
            </FormField>

            <FormField label={t('suppliers.freeOfHarbor')} htmlFor="freeOfHarbor" error={errors.freeOfHarbor?.message}>
              <FormInput
                id="freeOfHarbor"
                type="number"
                min="0"
                step="100"
                {...register('freeOfHarbor')}
                error={!!errors.freeOfHarbor}
                placeholder="0"
              />
            </FormField>
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('suppliers.newsletter')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="" htmlFor="receiveNewsletter" className="md:col-span-2">
              <FormCheckbox
                id="receiveNewsletter"
                {...register('receiveNewsletter')}
                label={t('suppliers.receiveNewsletter')}
              />
            </FormField>

            {receiveNewsletter && (
              <FormField label={t('suppliers.newsletterEmail')} htmlFor="newsletterEmail" error={errors.newsletterEmail?.message}>
                <FormInput
                  id="newsletterEmail"
                  type="email"
                  {...register('newsletterEmail')}
                  error={!!errors.newsletterEmail}
                  placeholder="newsletter@company.com"
                />
              </FormField>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('common.status')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="" htmlFor="isActive">
              <FormCheckbox
                id="isActive"
                {...register('isActive')}
                label={t('suppliers.activeSupplier')}
              />
            </FormField>

            <FormField label="" htmlFor="isBlocked">
              <FormCheckbox
                id="isBlocked"
                {...register('isBlocked')}
                label={t('suppliers.blockedPreventOrders')}
              />
            </FormField>
          </div>
        </div>

        {/* Comments */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('suppliers.comments')}
          </h3>
          <div className="space-y-4">
            <FormField label={t('suppliers.internalComment')} htmlFor="internalComment" error={errors.internalComment?.message}>
              <FormTextarea
                id="internalComment"
                {...register('internalComment')}
                error={!!errors.internalComment}
                placeholder={t('suppliers.internalNotesPlaceholder')}
                rows={3}
              />
            </FormField>

            <FormField label={t('suppliers.supplierComment')} htmlFor="supplierComment" error={errors.supplierComment?.message}>
              <FormTextarea
                id="supplierComment"
                {...register('supplierComment')}
                error={!!errors.supplierComment}
                placeholder={t('suppliers.supplierCommentPlaceholder')}
                rows={3}
              />
            </FormField>
          </div>
        </div>
      </form>
    </FormModal>
  )
}
