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
import { useCivilities, useSocieties } from '@/hooks/useLookups'
import type { Consignee, ConsigneeCreateDto } from '@/types/consignee'

const consigneeSchema = z.object({
  con_company_name: z.string().max(200).optional(),
  con_firstname: z.string().max(200).optional(),
  con_lastname: z.string().max(200).optional(),
  civ_id: z.coerce.number().optional(),
  con_adresse_title: z.string().max(200).optional(),
  con_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  con_tel1: z.string().max(100).optional(),
  con_tel2: z.string().max(100).optional(),
  con_cellphone: z.string().max(100).optional(),
  con_fax: z.string().max(100).optional(),
  con_address1: z.string().max(200).optional(),
  con_address2: z.string().max(200).optional(),
  con_address3: z.string().max(200).optional(),
  con_postcode: z.string().max(50).optional(),
  con_city: z.string().max(200).optional(),
  con_country: z.string().max(200).optional(),
  con_comment: z.string().max(2000).optional(),
  con_recieve_newsletter: z.boolean().optional(),
  con_newsletter_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  con_is_delivery_adr: z.boolean().optional(),
  con_is_invoicing_adr: z.boolean().optional(),
  soc_id: z.coerce.number().optional(),
})

type ConsigneeFormData = z.infer<typeof consigneeSchema>

interface ConsigneeFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ConsigneeCreateDto) => void
  consignee?: Consignee | null
  isSubmitting?: boolean
}

export function ConsigneeForm({
  isOpen,
  onClose,
  onSubmit,
  consignee,
  isSubmitting = false,
}: ConsigneeFormProps) {
  const { t } = useTranslation()
  const isEditing = !!consignee

  const { data: civilities = [] } = useCivilities()
  const { data: societies = [] } = useSocieties()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ConsigneeFormData>({
    resolver: zodResolver(consigneeSchema),
    defaultValues: {
      con_company_name: consignee?.con_company_name || '',
      con_firstname: consignee?.con_firstname || '',
      con_lastname: consignee?.con_lastname || '',
      civ_id: consignee?.civ_id || undefined,
      con_adresse_title: consignee?.con_adresse_title || '',
      con_email: consignee?.con_email || '',
      con_tel1: consignee?.con_tel1 || '',
      con_tel2: consignee?.con_tel2 || '',
      con_cellphone: consignee?.con_cellphone || '',
      con_fax: consignee?.con_fax || '',
      con_address1: consignee?.con_address1 || '',
      con_address2: consignee?.con_address2 || '',
      con_address3: consignee?.con_address3 || '',
      con_postcode: consignee?.con_postcode || '',
      con_city: consignee?.con_city || '',
      con_country: consignee?.con_country || '',
      con_comment: consignee?.con_comment || '',
      con_recieve_newsletter: consignee?.con_recieve_newsletter || false,
      con_newsletter_email: consignee?.con_newsletter_email || '',
      con_is_delivery_adr: consignee?.con_is_delivery_adr ?? true,
      con_is_invoicing_adr: consignee?.con_is_invoicing_adr ?? true,
      soc_id: consignee?.soc_id || 1,
    },
  })

  const receiveNewsletter = watch('con_recieve_newsletter')

  const handleFormSubmit = (data: ConsigneeFormData) => {
    onSubmit(data as ConsigneeCreateDto)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? t('consignees.editConsignee') : t('consignees.newConsignee')}
      description={isEditing ? t('consignees.updateConsignee') : t('consignees.createConsignee')}
      size="lg"
      footer={
        <FormModalFooter
          onCancel={handleClose}
          onSubmit={handleSubmit(handleFormSubmit)}
          submitText={isEditing ? t('common.saveChanges') : t('consignees.createConsigneeAction')}
          isSubmitting={isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('consignees.identity')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('consignees.companyName')} htmlFor="con_company_name" error={errors.con_company_name?.message}>
              <FormInput id="con_company_name" {...register('con_company_name')} error={!!errors.con_company_name} />
            </FormField>

            <FormField label={t('consignees.civility')} htmlFor="civ_id" error={errors.civ_id?.message}>
              <FormSelect
                id="civ_id"
                {...register('civ_id')}
                error={!!errors.civ_id}
                placeholder={t('consignees.selectCivility')}
                options={civilities.map((c) => ({ value: c.key, label: c.value }))}
              />
            </FormField>

            <FormField label={t('consignees.firstName')} htmlFor="con_firstname" error={errors.con_firstname?.message}>
              <FormInput id="con_firstname" {...register('con_firstname')} error={!!errors.con_firstname} />
            </FormField>

            <FormField label={t('consignees.lastName')} htmlFor="con_lastname" error={errors.con_lastname?.message}>
              <FormInput id="con_lastname" {...register('con_lastname')} error={!!errors.con_lastname} />
            </FormField>

            <FormField label={t('consignees.addressTitle')} htmlFor="con_adresse_title" error={errors.con_adresse_title?.message}>
              <FormInput id="con_adresse_title" {...register('con_adresse_title')} error={!!errors.con_adresse_title} />
            </FormField>

            <FormField label={t('consignees.society')} htmlFor="soc_id" error={errors.soc_id?.message}>
              <FormSelect
                id="soc_id"
                {...register('soc_id')}
                error={!!errors.soc_id}
                placeholder={t('common.selectOption')}
                options={societies.map((s) => ({ value: s.key, label: s.value }))}
              />
            </FormField>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('consignees.contact')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('common.email')} htmlFor="con_email" error={errors.con_email?.message}>
              <FormInput id="con_email" type="email" {...register('con_email')} error={!!errors.con_email} />
            </FormField>

            <FormField label={t('common.phone')} htmlFor="con_tel1" error={errors.con_tel1?.message}>
              <FormInput id="con_tel1" {...register('con_tel1')} error={!!errors.con_tel1} />
            </FormField>

            <FormField label={t('consignees.phone2')} htmlFor="con_tel2" error={errors.con_tel2?.message}>
              <FormInput id="con_tel2" {...register('con_tel2')} error={!!errors.con_tel2} />
            </FormField>

            <FormField label={t('consignees.mobile')} htmlFor="con_cellphone" error={errors.con_cellphone?.message}>
              <FormInput id="con_cellphone" {...register('con_cellphone')} error={!!errors.con_cellphone} />
            </FormField>

            <FormField label={t('consignees.fax')} htmlFor="con_fax" error={errors.con_fax?.message}>
              <FormInput id="con_fax" {...register('con_fax')} error={!!errors.con_fax} />
            </FormField>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('consignees.address')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('consignees.address1')} htmlFor="con_address1" error={errors.con_address1?.message}>
              <FormInput id="con_address1" {...register('con_address1')} error={!!errors.con_address1} />
            </FormField>

            <FormField label={t('consignees.address2')} htmlFor="con_address2" error={errors.con_address2?.message}>
              <FormInput id="con_address2" {...register('con_address2')} error={!!errors.con_address2} />
            </FormField>

            <FormField label={t('consignees.address3')} htmlFor="con_address3" error={errors.con_address3?.message}>
              <FormInput id="con_address3" {...register('con_address3')} error={!!errors.con_address3} />
            </FormField>

            <FormField label={t('consignees.postcode')} htmlFor="con_postcode" error={errors.con_postcode?.message}>
              <FormInput id="con_postcode" {...register('con_postcode')} error={!!errors.con_postcode} />
            </FormField>

            <FormField label={t('consignees.city')} htmlFor="con_city" error={errors.con_city?.message}>
              <FormInput id="con_city" {...register('con_city')} error={!!errors.con_city} />
            </FormField>

            <FormField label={t('consignees.country')} htmlFor="con_country" error={errors.con_country?.message}>
              <FormInput id="con_country" {...register('con_country')} error={!!errors.con_country} />
            </FormField>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={t('consignees.deliveryAddress')} htmlFor="con_is_delivery_adr">
            <FormCheckbox id="con_is_delivery_adr" {...register('con_is_delivery_adr')} />
          </FormField>
          <FormField label={t('consignees.invoicingAddress')} htmlFor="con_is_invoicing_adr">
            <FormCheckbox id="con_is_invoicing_adr" {...register('con_is_invoicing_adr')} />
          </FormField>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('consignees.marketing')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('consignees.receiveNewsletter')} htmlFor="con_recieve_newsletter">
              <FormCheckbox id="con_recieve_newsletter" {...register('con_recieve_newsletter')} />
            </FormField>
            <FormField label={t('consignees.newsletterEmail')} htmlFor="con_newsletter_email" error={errors.con_newsletter_email?.message}>
              <FormInput
                id="con_newsletter_email"
                type="email"
                {...register('con_newsletter_email')}
                error={!!errors.con_newsletter_email}
                disabled={!receiveNewsletter}
              />
            </FormField>
          </div>
        </div>

        <div>
          <FormField label={t('common.notes')} htmlFor="con_comment" error={errors.con_comment?.message}>
            <FormTextarea id="con_comment" {...register('con_comment')} error={!!errors.con_comment} rows={3} />
          </FormField>
        </div>
      </form>
    </FormModal>
  )
}
