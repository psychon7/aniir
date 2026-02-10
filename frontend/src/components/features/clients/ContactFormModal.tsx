import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormCheckbox } from '@/components/ui/form/FormCheckbox'
import { FormTextarea } from '@/components/ui/form/FormTextarea'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import type { ClientContact } from '@/types/client'

const ROLE_OPTIONS = [
  { value: '', label: 'Select role' },
  { value: 'Owner', label: 'Owner' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Accounts', label: 'Accounts' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'Technical', label: 'Technical' },
  { value: 'General', label: 'General' },
]

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<ClientContact, 'id' | 'clientId'>) => void
  contact?: ClientContact | null
  isSubmitting?: boolean
}

export function ContactFormModal({
  isOpen,
  onClose,
  onSubmit,
  contact,
  isSubmitting = false,
}: ContactFormModalProps) {
  const { t } = useTranslation()
  const isEditing = !!contact

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phone2: '',
    mobile: '',
    fax: '',
    position: '',
    role: '',
    address1: '',
    address2: '',
    postcode: '',
    city: '',
    country: '',
    isPrimary: false,
    isInvoicingAddress: false,
    isDeliveryAddress: false,
    receiveNewsletter: false,
    newsletterEmail: '',
    comment: '',
  })

  useEffect(() => {
    if (contact) {
      setForm({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        phone2: contact.phone2 || '',
        mobile: contact.mobile || '',
        fax: contact.fax || '',
        position: contact.position || '',
        role: contact.role || '',
        address1: contact.address1 || '',
        address2: contact.address2 || '',
        postcode: contact.postcode || '',
        city: contact.city || '',
        country: contact.country || '',
        isPrimary: contact.isPrimary || false,
        isInvoicingAddress: contact.isInvoicingAddress || false,
        isDeliveryAddress: contact.isDeliveryAddress || false,
        receiveNewsletter: contact.receiveNewsletter || false,
        newsletterEmail: contact.newsletterEmail || '',
        comment: contact.comment || '',
      })
    } else {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        phone2: '',
        mobile: '',
        fax: '',
        position: '',
        role: '',
        address1: '',
        address2: '',
        postcode: '',
        city: '',
        country: '',
        isPrimary: false,
        isInvoicingAddress: false,
        isDeliveryAddress: false,
        receiveNewsletter: false,
        newsletterEmail: '',
        comment: '',
      })
    }
  }, [contact, isOpen])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const setChecked = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.checked }))

  const handleSubmit = () => {
    onSubmit(form as Omit<ClientContact, 'id' | 'clientId'>)
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('clients.editContact', 'Edit Contact') : t('clients.addContact')}
      description={isEditing ? t('clients.updateContactInfo', 'Update contact information') : t('clients.addContactDescription', 'Add a new contact for this client')}
      footer={
        <FormModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={isEditing ? t('common.saveChanges') : t('common.create')}
          isSubmitting={isSubmitting}
        />
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t('clients.firstName')}
            value={form.firstName}
            onChange={set('firstName')}
            placeholder="John"
          />
          <FormInput
            label={t('clients.lastName')}
            value={form.lastName}
            onChange={set('lastName')}
            placeholder="Doe"
          />
          <FormInput
            type="email"
            label={t('common.email')}
            value={form.email}
            onChange={set('email')}
            placeholder="contact@company.com"
          />
          <FormInput
            label={t('common.phone')}
            value={form.phone}
            onChange={set('phone')}
            placeholder="+33 1 23 45 67 89"
          />
          <FormInput
            label={t('clients.mobile')}
            value={form.mobile}
            onChange={set('mobile')}
            placeholder="+33 6 12 34 56 78"
          />
          <FormInput
            label={t('clients.position', 'Position')}
            value={form.position}
            onChange={set('position')}
            placeholder="Sales Manager"
          />
          <FormSelect
            label={t('clients.contactRole', 'Role')}
            value={form.role}
            onChange={set('role')}
            options={ROLE_OPTIONS}
          />
          <FormInput
            label={t('clients.fax', 'Fax')}
            value={form.fax}
            onChange={set('fax')}
          />
        </div>

        <h4 className="text-sm font-semibold text-foreground mt-4 mb-2 pb-1 border-b border-border">
          {t('common.address')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t('clients.address')}
            value={form.address1}
            onChange={set('address1')}
            className="md:col-span-2"
          />
          <FormInput
            label={t('clients.addressLine2')}
            value={form.address2}
            onChange={set('address2')}
            className="md:col-span-2"
          />
          <FormInput
            label={t('clients.postalCode')}
            value={form.postcode}
            onChange={set('postcode')}
          />
          <FormInput
            label={t('clients.city')}
            value={form.city}
            onChange={set('city')}
          />
          <FormInput
            label={t('clients.country')}
            value={form.country}
            onChange={set('country')}
          />
        </div>

        <h4 className="text-sm font-semibold text-foreground mt-4 mb-2 pb-1 border-b border-border">
          {t('clients.flags', 'Options')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormCheckbox
            id="contact-primary"
            label={t('common.primary', 'Primary Contact')}
            checked={form.isPrimary}
            onChange={setChecked('isPrimary')}
          />
          <FormCheckbox
            id="contact-invoice"
            label={t('clients.invoiceAddress', 'Invoice Address')}
            checked={form.isInvoicingAddress}
            onChange={setChecked('isInvoicingAddress')}
          />
          <FormCheckbox
            id="contact-delivery"
            label={t('clients.deliveryAddress', 'Delivery Address')}
            checked={form.isDeliveryAddress}
            onChange={setChecked('isDeliveryAddress')}
          />
          <FormCheckbox
            id="contact-newsletter"
            label={t('clients.receiveNewsletter', 'Receive Newsletter')}
            checked={form.receiveNewsletter}
            onChange={setChecked('receiveNewsletter')}
          />
        </div>

        <FormTextarea
          label={t('common.notes')}
          value={form.comment}
          onChange={set('comment')}
          rows={3}
          placeholder={t('clients.contactNotes', 'Additional notes...')}
        />
      </div>
    </FormModal>
  )
}
