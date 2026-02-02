import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { FormField } from '@/components/ui/form/FormField'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormTextarea } from '@/components/ui/form/FormTextarea'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import type { Brand, BrandCreateDto } from '@/types/brand'

// Form validation schema
const brandSchema = z.object({
  braCode: z.string().min(1, 'Brand code is required').max(50),
  braName: z.string().min(1, 'Brand name is required').max(100),
  braDescription: z.string().max(500).optional(),
  braIsActived: z.boolean().default(true),
})

type BrandFormData = z.infer<typeof brandSchema>

interface BrandFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BrandCreateDto) => void
  brand?: Brand | null
  isSubmitting?: boolean
}

export function BrandForm({
  isOpen,
  onClose,
  onSubmit,
  brand,
  isSubmitting = false,
}: BrandFormProps) {
  const isEditing = !!brand

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      braCode: '',
      braName: '',
      braDescription: '',
      braIsActived: true,
    },
  })

  // Reset form when brand changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        braCode: brand?.braCode || '',
        braName: brand?.braName || '',
        braDescription: brand?.braDescription || '',
        braIsActived: brand?.braIsActived ?? true,
      })
    }
  }, [isOpen, brand, reset])

  const handleFormSubmit = (data: BrandFormData) => {
    onSubmit(data as BrandCreateDto)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Brand' : 'New Brand'}
      description={isEditing ? 'Update brand information' : 'Add a new brand to your system'}
      size="md"
      footer={
        <FormModalFooter
          onCancel={handleClose}
          onSubmit={handleSubmit(handleFormSubmit)}
          submitText={isEditing ? 'Save Changes' : 'Create Brand'}
          isSubmitting={isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          label="Brand Code"
          htmlFor="braCode"
          error={errors.braCode?.message}
          required
        >
          <FormInput
            id="braCode"
            {...register('braCode')}
            error={!!errors.braCode}
            placeholder="Enter brand code (e.g., BRD001)"
          />
        </FormField>

        <FormField
          label="Brand Name"
          htmlFor="braName"
          error={errors.braName?.message}
          required
        >
          <FormInput
            id="braName"
            {...register('braName')}
            error={!!errors.braName}
            placeholder="Enter brand name"
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor="braDescription"
          error={errors.braDescription?.message}
        >
          <FormTextarea
            id="braDescription"
            {...register('braDescription')}
            error={!!errors.braDescription}
            placeholder="Enter brand description (optional)"
            rows={3}
          />
        </FormField>

        <FormField
          label="Status"
          htmlFor="braIsActived"
          error={errors.braIsActived?.message}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="braIsActived"
              {...register('braIsActived')}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
            />
            <label htmlFor="braIsActived" className="text-sm font-medium text-foreground cursor-pointer">
              Active
            </label>
          </div>
        </FormField>
      </form>
    </FormModal>
  )
}
