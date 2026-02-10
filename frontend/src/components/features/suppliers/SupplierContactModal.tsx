import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import type { SupplierContact } from '@/types/supplier'

interface SupplierContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<SupplierContact, 'id' | 'supplierId'>) => void
  isSubmitting?: boolean
}

export function SupplierContactModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: SupplierContactModalProps) {
  const { t } = useTranslation()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phone2: '',
    mobile: '',
    fax: '',
    addressTitle: '',
    address: '',
    address2: '',
    postalCode: '',
    city: '',
    country: '',
    receiveNewsletter: false,
    newsletterEmail: '',
    isActive: true,
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        phone2: '',
        mobile: '',
        fax: '',
        addressTitle: '',
        address: '',
        address2: '',
        postalCode: '',
        city: '',
        country: '',
        receiveNewsletter: false,
        newsletterEmail: '',
        isActive: true,
      })
    }
  }, [isOpen])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return
    onSubmit(form as Omit<SupplierContact, 'id' | 'supplierId'>)
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('suppliers.addContact', 'Add Contact')}
      description={t('suppliers.addContactDescription', 'Add a new contact for this supplier')}
      footer={
        <FormModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={t('common.create', 'Create')}
          isSubmitting={isSubmitting}
          submitDisabled={!form.firstName.trim() || !form.lastName.trim()}
        />
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t('clients.firstName', 'First Name')}
            value={form.firstName}
            onChange={set('firstName')}
            placeholder="John"
            required
          />
          <FormInput
            label={t('clients.lastName', 'Last Name')}
            value={form.lastName}
            onChange={set('lastName')}
            placeholder="Doe"
            required
          />
          <FormInput
            type="email"
            label={t('common.email', 'Email')}
            value={form.email}
            onChange={set('email')}
            placeholder="contact@company.com"
          />
          <FormInput
            label={t('common.phone', 'Phone')}
            value={form.phone}
            onChange={set('phone')}
            placeholder="+33 1 23 45 67 89"
          />
          <FormInput
            label={t('clients.mobile', 'Mobile')}
            value={form.mobile}
            onChange={set('mobile')}
            placeholder="+33 6 12 34 56 78"
          />
          <FormInput
            label={t('clients.position', 'Position / Title')}
            value={form.addressTitle}
            onChange={set('addressTitle')}
            placeholder="Sales Manager"
          />
          <FormInput
            label={t('clients.fax', 'Fax')}
            value={form.fax}
            onChange={set('fax')}
          />
        </div>

        <h4 className="text-sm font-semibold text-foreground mt-4 mb-2 pb-1 border-b border-border">
          {t('common.address', 'Address')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t('clients.address', 'Address')}
            value={form.address}
            onChange={set('address')}
            className="md:col-span-2"
          />
          <FormInput
            label={t('clients.addressLine2', 'Address Line 2')}
            value={form.address2}
            onChange={set('address2')}
            className="md:col-span-2"
          />
          <FormInput
            label={t('clients.postalCode', 'Postal Code')}
            value={form.postalCode}
            onChange={set('postalCode')}
          />
          <FormInput
            label={t('clients.city', 'City')}
            value={form.city}
            onChange={set('city')}
          />
          <FormInput
            label={t('clients.country', 'Country')}
            value={form.country}
            onChange={set('country')}
          />
        </div>
      </div>
    </FormModal>
  )
}
