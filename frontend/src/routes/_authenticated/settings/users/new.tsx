import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { useCreateUser, useRolesLookup, useCivilitiesLookup } from '@/hooks/useUsers'
import { useSocieties } from '@/hooks/useLookups'
import type { UserCreateDto } from '@/types/user'

export const Route = createFileRoute('/_authenticated/settings/users/new')({
  component: NewUserPage,
})

function NewUserPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  // Form state
  const [formData, setFormData] = useState<UserCreateDto>({
    usr_login: '',
    usr_pwd: '',
    rol_id: 0,
    civ_id: 0,
    soc_id: 0,
    usr_is_actived: true,
    usr_super_right: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Data fetching
  const { data: roles = [] } = useRolesLookup(true)
  const { data: civilities = [] } = useCivilitiesLookup(true)
  const { data: societies = [] } = useSocieties()

  // Mutations
  const createMutation = useCreateUser()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.usr_login?.trim()) {
      newErrors.usr_login = t('users.loginRequired')
    }
    if (!formData.usr_pwd || formData.usr_pwd.length < 6) {
      newErrors.usr_pwd = t('users.passwordMinLength')
    }
    if (!formData.rol_id) {
      newErrors.rol_id = t('users.roleRequired')
    }
    if (!formData.civ_id) {
      newErrors.civ_id = t('users.civilityRequired')
    }
    if (!formData.soc_id) {
      newErrors.soc_id = t('users.societyRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      const result = await createMutation.mutateAsync(formData)
      success(t('users.createSuccess'), t('users.createSuccessDescription'))
      navigate({ to: '/settings/users/$userId', params: { userId: String(result.id) } })
    } catch (err) {
      showError(t('common.error'), t('users.createError'))
    }
  }

  const handleBack = () => {
    navigate({ to: '/settings/users' })
  }

  // Action buttons
  const actions = (
    <>
      <button onClick={handleBack} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSave}
        className="btn-primary"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? <LoadingSpinner size="sm" /> : t('common.create')}
      </button>
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('users.newUser')}
        description={t('users.createNewUserDescription')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('users.accountInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('users.login')}
                value={formData.usr_login}
                onChange={(e) => setFormData({ ...formData, usr_login: e.target.value })}
                error={!!errors.usr_login}
                required
              />
              <FormInput
                type="password"
                label={t('users.password')}
                value={formData.usr_pwd}
                onChange={(e) => setFormData({ ...formData, usr_pwd: e.target.value })}
                error={!!errors.usr_pwd}
                placeholder={t('users.passwordPlaceholder')}
                required
              />
              <FormSelect
                label={t('users.role')}
                value={String(formData.rol_id || '')}
                onChange={(e) => setFormData({ ...formData, rol_id: Number(e.target.value) })}
                options={[
                  { value: '', label: t('users.selectRole') },
                  ...roles.map((role) => ({ value: String(role.id), label: role.name })),
                ]}
                error={!!errors.rol_id}
                required
              />
              <FormSelect
                label={t('users.society')}
                value={String(formData.soc_id || '')}
                onChange={(e) => setFormData({ ...formData, soc_id: Number(e.target.value) })}
                options={[
                  { value: '', label: t('users.selectSociety') },
                  ...societies.map((s) => ({ value: s.key, label: s.value })),
                ]}
                error={!!errors.soc_id}
                required
              />
              <FormSelect
                label={t('users.civility')}
                value={String(formData.civ_id || '')}
                onChange={(e) => setFormData({ ...formData, civ_id: Number(e.target.value) })}
                options={[
                  { value: '', label: t('users.selectCivility') },
                  ...civilities.map((c) => ({ value: String(c.id), label: c.designation })),
                ]}
                error={!!errors.civ_id}
                required
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('users.personalInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('users.firstName')}
                value={formData.usr_firstname || ''}
                onChange={(e) => setFormData({ ...formData, usr_firstname: e.target.value })}
              />
              <FormInput
                label={t('users.lastName')}
                value={formData.usr_lastname || ''}
                onChange={(e) => setFormData({ ...formData, usr_lastname: e.target.value })}
              />
              <FormInput
                label={t('users.jobTitle')}
                value={formData.usr_title || ''}
                onChange={(e) => setFormData({ ...formData, usr_title: e.target.value })}
              />
              <FormInput
                label={t('users.hrCode')}
                value={formData.usr_code_hr || ''}
                onChange={(e) => setFormData({ ...formData, usr_code_hr: e.target.value })}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('users.contactInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                type="email"
                label={t('users.email')}
                value={formData.usr_email || ''}
                onChange={(e) => setFormData({ ...formData, usr_email: e.target.value })}
              />
              <FormInput
                label={t('users.telephone')}
                value={formData.usr_tel || ''}
                onChange={(e) => setFormData({ ...formData, usr_tel: e.target.value })}
              />
              <FormInput
                label={t('users.cellphone')}
                value={formData.usr_cellphone || ''}
                onChange={(e) => setFormData({ ...formData, usr_cellphone: e.target.value })}
              />
              <FormInput
                label={t('users.fax')}
                value={formData.usr_fax || ''}
                onChange={(e) => setFormData({ ...formData, usr_fax: e.target.value })}
              />
            </div>
          </div>

          {/* Address */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('users.address')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('users.address1')}
                value={formData.usr_address1 || ''}
                onChange={(e) => setFormData({ ...formData, usr_address1: e.target.value })}
                className="md:col-span-2"
              />
              <FormInput
                label={t('users.address2')}
                value={formData.usr_address2 || ''}
                onChange={(e) => setFormData({ ...formData, usr_address2: e.target.value })}
                className="md:col-span-2"
              />
              <FormInput
                label={t('users.postcode')}
                value={formData.usr_postcode || ''}
                onChange={(e) => setFormData({ ...formData, usr_postcode: e.target.value })}
              />
              <FormInput
                label={t('users.city')}
                value={formData.usr_city || ''}
                onChange={(e) => setFormData({ ...formData, usr_city: e.target.value })}
              />
              <FormInput
                label={t('users.county')}
                value={formData.usr_county || ''}
                onChange={(e) => setFormData({ ...formData, usr_county: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('users.statusAndPermissions')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('common.status')}</span>
                <FormSelect
                  value={formData.usr_is_actived ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, usr_is_actived: e.target.value === 'true' })}
                  options={[
                    { value: 'true', label: t('common.active') },
                    { value: 'false', label: t('common.inactive') },
                  ]}
                  className="w-32"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('users.adminRights')}</span>
                <FormSelect
                  value={formData.usr_super_right ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, usr_super_right: e.target.value === 'true' })}
                  options={[
                    { value: 'false', label: t('common.no') },
                    { value: 'true', label: t('common.yes') },
                  ]}
                  className="w-32"
                />
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="card p-6 bg-muted/50">
            <h3 className="text-sm font-medium mb-2">{t('users.helpTitle')}</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {t('users.helpLogin')}</li>
              <li>• {t('users.helpPassword')}</li>
              <li>• {t('users.helpRole')}</li>
              <li>• {t('users.helpAdmin')}</li>
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
