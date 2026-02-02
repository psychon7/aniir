import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormField } from '@/components/ui/form/FormField'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormTextarea } from '@/components/ui/form/FormTextarea'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import {
  useCurrencies,
  useBusinessUnits,
  useSocieties,
} from '@/hooks/useLookups'
import { useStatementStatuses, useStatementTypes } from '@/hooks/useStatementLookups'
import { useClients } from '@/hooks/useClients'
import type { Statement, StatementCreateDto } from '@/types/statement'

// Form validation schema
const statementSchema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  statementDate: z.string().min(1, 'Statement date is required'),
  periodStart: z.string().min(1, 'Period start date is required'),
  periodEnd: z.string().min(1, 'Period end date is required'),
  openingBalance: z.coerce.number(),
  currencyId: z.coerce.number().min(1, 'Currency is required'),
  statementTypeId: z.coerce.number().min(1, 'Statement type is required'),
  statusId: z.coerce.number().min(1, 'Status is required'),
  businessUnitId: z.coerce.number().optional(),
  societyId: z.coerce.number().min(1, 'Society is required'),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  const start = new Date(data.periodStart)
  const end = new Date(data.periodEnd)
  return end >= start
}, {
  message: 'Period end date must be after period start date',
  path: ['periodEnd'],
})

type StatementFormData = z.infer<typeof statementSchema>

interface StatementFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: StatementCreateDto) => void
  statement?: Statement | null
  isSubmitting?: boolean
}

export function StatementForm({
  isOpen,
  onClose,
  onSubmit,
  statement,
  isSubmitting = false,
}: StatementFormProps) {
  const isEditing = !!statement

  // Load lookups
  const { data: currencies = [] } = useCurrencies()
  const { data: statementStatuses = [] } = useStatementStatuses()
  const { data: statementTypes = [] } = useStatementTypes()
  const { data: businessUnits = [] } = useBusinessUnits()
  const { data: societies = [] } = useSocieties()
  const { data: clientsData } = useClients({ pageSize: 100 })

  // Get first day of current month and last day of current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StatementFormData>({
    resolver: zodResolver(statementSchema),
    defaultValues: {
      clientId: statement?.clientId || undefined,
      statementDate: statement?.statementDate || new Date().toISOString().split('T')[0],
      periodStart: statement?.periodStart || firstDayOfMonth,
      periodEnd: statement?.periodEnd || lastDayOfMonth,
      openingBalance: statement?.openingBalance || 0,
      currencyId: statement?.currencyId || 1,
      statementTypeId: statement?.statementTypeId || 1,
      statusId: statement?.statusId || 1, // Default to "Draft"
      businessUnitId: statement?.businessUnitId || undefined,
      societyId: statement?.societyId || 1,
      notes: statement?.notes || '',
    },
  })

  const handleFormSubmit = (data: StatementFormData) => {
    onSubmit(data as StatementCreateDto)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Statement' : 'New Statement'}
      description={isEditing ? 'Update statement information' : 'Create a new account statement'}
      size="lg"
      footer={
        <FormModalFooter
          onCancel={handleClose}
          onSubmit={handleSubmit(handleFormSubmit)}
          submitText={isEditing ? 'Save Changes' : 'Create Statement'}
          isSubmitting={isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Statement Details */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Statement Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Client"
              htmlFor="clientId"
              error={errors.clientId?.message}
              required
              className="md:col-span-2"
            >
              <FormSelect
                id="clientId"
                {...register('clientId')}
                error={!!errors.clientId}
                placeholder="Select client"
                options={clientsData?.data?.map((c) => ({ value: c.id, label: c.companyName })) || []}
              />
            </FormField>

            <FormField label="Statement Date" htmlFor="statementDate" error={errors.statementDate?.message} required>
              <FormInput
                id="statementDate"
                type="date"
                {...register('statementDate')}
                error={!!errors.statementDate}
              />
            </FormField>

            <FormField label="Statement Type" htmlFor="statementTypeId" error={errors.statementTypeId?.message} required>
              <FormSelect
                id="statementTypeId"
                {...register('statementTypeId')}
                error={!!errors.statementTypeId}
                options={statementTypes.map((t) => ({ value: t.key, label: t.value }))}
              />
            </FormField>

            <FormField label="Status" htmlFor="statusId" error={errors.statusId?.message} required>
              <FormSelect
                id="statusId"
                {...register('statusId')}
                error={!!errors.statusId}
                options={statementStatuses.map((s) => ({ value: s.key, label: s.value }))}
              />
            </FormField>

            <FormField label="Currency" htmlFor="currencyId" error={errors.currencyId?.message} required>
              <FormSelect
                id="currencyId"
                {...register('currencyId')}
                error={!!errors.currencyId}
                options={currencies.map((c) => ({ value: c.key, label: `${c.value} (${c.value2})` }))}
              />
            </FormField>
          </div>
        </div>

        {/* Period */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Statement Period
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Period Start" htmlFor="periodStart" error={errors.periodStart?.message} required>
              <FormInput
                id="periodStart"
                type="date"
                {...register('periodStart')}
                error={!!errors.periodStart}
              />
            </FormField>

            <FormField label="Period End" htmlFor="periodEnd" error={errors.periodEnd?.message} required>
              <FormInput
                id="periodEnd"
                type="date"
                {...register('periodEnd')}
                error={!!errors.periodEnd}
              />
            </FormField>

            <FormField label="Opening Balance" htmlFor="openingBalance" error={errors.openingBalance?.message}>
              <FormInput
                id="openingBalance"
                type="number"
                step="0.01"
                {...register('openingBalance')}
                error={!!errors.openingBalance}
                placeholder="0.00"
              />
            </FormField>
          </div>
        </div>

        {/* Organization */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Organization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Business Unit" htmlFor="businessUnitId" error={errors.businessUnitId?.message}>
              <FormSelect
                id="businessUnitId"
                {...register('businessUnitId')}
                error={!!errors.businessUnitId}
                placeholder="Select business unit"
                options={businessUnits.map((b) => ({ value: b.key, label: b.value }))}
              />
            </FormField>

            <FormField label="Society" htmlFor="societyId" error={errors.societyId?.message} required>
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
            Notes
          </h3>
          <FormField label="Internal Notes" htmlFor="notes" error={errors.notes?.message}>
            <FormTextarea
              id="notes"
              {...register('notes')}
              error={!!errors.notes}
              placeholder="Add any internal notes about this statement..."
              rows={3}
            />
          </FormField>
        </div>
      </form>
    </FormModal>
  )
}
