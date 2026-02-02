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
  useCurrencies,
  usePaymentModes,
  usePaymentStatuses,
  useBusinessUnits,
  useSocieties,
} from '@/hooks/useLookups'
import { useClients } from '@/hooks/useClients'
import type { Payment, PaymentCreateDto } from '@/types/payment'

// Form validation schema
const paymentSchema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  invoiceId: z.coerce.number().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  currencyId: z.coerce.number().min(1, 'Currency is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentModeId: z.coerce.number().min(1, 'Payment mode is required'),
  bankAccount: z.string().max(50).optional(),
  bankReference: z.string().max(100).optional(),
  checkNumber: z.string().max(50).optional(),
  transactionId: z.string().max(100).optional(),
  statusId: z.coerce.number().min(1, 'Status is required'),
  businessUnitId: z.coerce.number().optional(),
  societyId: z.coerce.number().min(1, 'Society is required'),
  notes: z.string().max(500).optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PaymentCreateDto) => void
  payment?: Payment | null
  isSubmitting?: boolean
}

export function PaymentForm({
  isOpen,
  onClose,
  onSubmit,
  payment,
  isSubmitting = false,
}: PaymentFormProps) {
  const { t } = useTranslation()
  const isEditing = !!payment

  // Load lookups
  const { data: currencies = [] } = useCurrencies()
  const { data: paymentModes = [] } = usePaymentModes()
  const { data: paymentStatuses = [] } = usePaymentStatuses()
  const { data: businessUnits = [] } = useBusinessUnits()
  const { data: societies = [] } = useSocieties()
  const { data: clientsData } = useClients({ pageSize: 100 })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      clientId: payment?.clientId || undefined,
      invoiceId: payment?.invoiceId || undefined,
      amount: payment?.amount || 0,
      currencyId: payment?.currencyId || 1,
      paymentDate: payment?.paymentDate || new Date().toISOString().split('T')[0],
      paymentModeId: payment?.paymentModeId || 1,
      bankAccount: payment?.bankAccount || '',
      bankReference: payment?.bankReference || '',
      checkNumber: payment?.checkNumber || '',
      transactionId: payment?.transactionId || '',
      statusId: payment?.statusId || 2, // Default to "Pending"
      businessUnitId: payment?.businessUnitId || undefined,
      societyId: payment?.societyId || 1,
      notes: payment?.notes || '',
    },
  })

  const selectedPaymentMode = watch('paymentModeId')

  const handleFormSubmit = (data: PaymentFormData) => {
    onSubmit(data as PaymentCreateDto)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Determine which payment details to show based on payment mode
  const showBankDetails = selectedPaymentMode === 1 || selectedPaymentMode === 6 // Bank Transfer, Direct Debit
  const showCheckDetails = selectedPaymentMode === 3 // Check
  const showTransactionDetails = selectedPaymentMode === 2 || selectedPaymentMode === 5 // Credit Card, PayPal

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? t('payments.editPayment') : t('payments.newPayment')}
      description={isEditing ? t('payments.updatePaymentInfo') : t('payments.recordNewPayment')}
      size="lg"
      footer={
        <FormModalFooter
          onCancel={handleClose}
          onSubmit={handleSubmit(handleFormSubmit)}
          submitText={isEditing ? t('common.saveChanges') : t('payments.createPayment')}
          isSubmitting={isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Payment Details */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('payments.paymentDetails')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t('payments.client')}
              htmlFor="clientId"
              error={errors.clientId?.message}
              required
              className="md:col-span-2"
            >
              <FormSelect
                id="clientId"
                {...register('clientId')}
                error={!!errors.clientId}
                placeholder={t('payments.selectClient')}
                options={clientsData?.data?.map((c) => ({ value: c.id, label: c.companyName })) || []}
              />
            </FormField>

            <FormField label={t('payments.amount')} htmlFor="amount" error={errors.amount?.message} required>
              <FormInput
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                {...register('amount')}
                error={!!errors.amount}
                placeholder="0.00"
              />
            </FormField>

            <FormField label={t('payments.currency')} htmlFor="currencyId" error={errors.currencyId?.message} required>
              <FormSelect
                id="currencyId"
                {...register('currencyId')}
                error={!!errors.currencyId}
                options={currencies.map((c) => ({ value: c.key, label: `${c.value} (${c.value2})` }))}
              />
            </FormField>

            <FormField label={t('payments.paymentDate')} htmlFor="paymentDate" error={errors.paymentDate?.message} required>
              <FormInput
                id="paymentDate"
                type="date"
                {...register('paymentDate')}
                error={!!errors.paymentDate}
              />
            </FormField>

            <FormField label={t('payments.paymentMode')} htmlFor="paymentModeId" error={errors.paymentModeId?.message} required>
              <FormSelect
                id="paymentModeId"
                {...register('paymentModeId')}
                error={!!errors.paymentModeId}
                options={paymentModes.map((p) => ({ value: p.key, label: p.value }))}
              />
            </FormField>

            <FormField label={t('common.status')} htmlFor="statusId" error={errors.statusId?.message} required>
              <FormSelect
                id="statusId"
                {...register('statusId')}
                error={!!errors.statusId}
                options={paymentStatuses.map((s) => ({ value: s.key, label: s.value }))}
              />
            </FormField>

            <FormField label={t('payments.invoiceReference')} htmlFor="invoiceId" error={errors.invoiceId?.message}>
              <FormInput
                id="invoiceId"
                type="number"
                {...register('invoiceId')}
                error={!!errors.invoiceId}
                placeholder={t('payments.invoiceIdOptional')}
              />
            </FormField>
          </div>
        </div>

        {/* Payment Reference Details */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('payments.paymentReference')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showBankDetails && (
              <>
                <FormField label={t('payments.bankAccount')} htmlFor="bankAccount" error={errors.bankAccount?.message}>
                  <FormInput
                    id="bankAccount"
                    {...register('bankAccount')}
                    error={!!errors.bankAccount}
                    placeholder={t('payments.ibanOrAccountNumber')}
                  />
                </FormField>

                <FormField label={t('payments.bankReference')} htmlFor="bankReference" error={errors.bankReference?.message}>
                  <FormInput
                    id="bankReference"
                    {...register('bankReference')}
                    error={!!errors.bankReference}
                    placeholder={t('payments.transferReference')}
                  />
                </FormField>
              </>
            )}

            {showCheckDetails && (
              <FormField label={t('payments.checkNumber')} htmlFor="checkNumber" error={errors.checkNumber?.message} className="md:col-span-2">
                <FormInput
                  id="checkNumber"
                  {...register('checkNumber')}
                  error={!!errors.checkNumber}
                  placeholder={t('payments.checkNumberPlaceholder')}
                />
              </FormField>
            )}

            {showTransactionDetails && (
              <FormField label={t('payments.transactionId')} htmlFor="transactionId" error={errors.transactionId?.message} className="md:col-span-2">
                <FormInput
                  id="transactionId"
                  {...register('transactionId')}
                  error={!!errors.transactionId}
                  placeholder={t('payments.transactionReference')}
                />
              </FormField>
            )}

            {!showBankDetails && !showCheckDetails && !showTransactionDetails && (
              <div className="md:col-span-2 text-sm text-muted-foreground py-2">
                {t('payments.noAdditionalFieldsRequired')}
              </div>
            )}
          </div>
        </div>

        {/* Organization */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('payments.organization')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('payments.businessUnit')} htmlFor="businessUnitId" error={errors.businessUnitId?.message}>
              <FormSelect
                id="businessUnitId"
                {...register('businessUnitId')}
                error={!!errors.businessUnitId}
                placeholder={t('clients.selectBusinessUnit')}
                options={businessUnits.map((b) => ({ value: b.key, label: b.value }))}
              />
            </FormField>

            <FormField label={t('payments.society')} htmlFor="societyId" error={errors.societyId?.message} required>
              <FormSelect
                id="societyId"
                {...register('societyId')}
                error={!!errors.societyId}
                options={societies.map((s) => ({ value: s.key, label: s.value }))}
              />
            </FormField>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            {t('common.notes')}
          </h3>
          <FormField label={t('payments.internalNotes')} htmlFor="notes" error={errors.notes?.message}>
            <FormTextarea
              id="notes"
              {...register('notes')}
              error={!!errors.notes}
              placeholder={t('payments.addInternalNotes')}
              rows={3}
            />
          </FormField>
        </div>
      </form>
    </FormModal>
  )
}
