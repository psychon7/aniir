import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { useToast } from '@/components/ui/feedback/Toast'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { useUser, useUpdateUser, useRolesLookup, useCivilitiesLookup } from '@/hooks/useUsers'
import { useSocieties } from '@/hooks/useLookups'
import type { UserUpdateDto } from '@/types/user'

export const Route = createFileRoute('/_authenticated/settings/users/$userId')({
  component: UserDetailPage,
})

function UserDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { userId } = Route.useParams()
  const { success, error: showError } = useToast()

  // Form state
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UserUpdateDto>({})
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  // Data fetching
  const { data: user, isLoading, error } = useUser(Number(userId))
  const { data: roles = [] } = useRolesLookup(false)
  const { data: civilities = [] } = useCivilitiesLookup(false)
  const { data: societies = [] } = useSocieties()

  // Mutations
  const updateMutation = useUpdateUser()

  // Initialize form when entering edit mode
  const handleStartEdit = () => {
    if (user) {
      setFormData({
        usr_login: user.login,
        usr_firstname: user.firstName,
        usr_lastname: user.lastName,
        usr_title: user.title,
        usr_email: user.email,
        usr_tel: user.telephone,
        usr_cellphone: user.cellphone,
        usr_fax: user.fax,
        usr_code_hr: user.hrCode,
        usr_address1: user.address1,
        usr_address2: user.address2,
        usr_postcode: user.postcode,
        usr_city: user.city,
        usr_county: user.county,
        rol_id: user.roleId,
        civ_id: user.civilityId,
        soc_id: user.societyId,
        usr_is_actived: user.isActive,
        usr_super_right: user.isAdmin,
      })
    }
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormData({})
    setShowPasswordChange(false)
    setNewPassword('')
  }

  const handleSave = async () => {
    try {
      const dataToSave = { ...formData }
      if (showPasswordChange && newPassword) {
        dataToSave.usr_pwd = newPassword
      }

      await updateMutation.mutateAsync({ userId: Number(userId), data: dataToSave })
      success(t('users.updateSuccess'), t('users.updateSuccessDescription'))
      setIsEditing(false)
      setShowPasswordChange(false)
      setNewPassword('')
    } catch (err) {
      showError(t('common.error'), t('users.updateError'))
    }
  }

  const handleBack = () => {
    navigate({ to: '/settings/users' })
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    )
  }

  if (error || !user) {
    return (
      <PageContainer>
        <div className="card p-6 text-center">
          <p className="text-destructive">{t('users.userNotFound')}</p>
          <button onClick={handleBack} className="btn-secondary mt-4">
            {t('common.back')}
          </button>
        </div>
      </PageContainer>
    )
  }

  // Action buttons
  const actions = isEditing ? (
    <>
      <button onClick={handleCancelEdit} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSave}
        className="btn-primary"
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? <LoadingSpinner size="sm" /> : t('common.save')}
      </button>
    </>
  ) : (
    <>
      <button onClick={handleBack} className="btn-secondary">
        <BackIcon className="w-4 h-4" />
        {t('common.back')}
      </button>
      <button onClick={handleStartEdit} className="btn-primary">
        <EditIcon className="w-4 h-4" />
        {t('common.edit')}
      </button>
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title={user.fullName || user.login}
        description={isEditing ? t('users.editingUser') : t('users.viewingUser')}
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
                value={isEditing ? formData.usr_login || '' : user.login}
                onChange={(e) => setFormData({ ...formData, usr_login: e.target.value })}
                disabled={!isEditing}
                required
              />
              <FormSelect
                label={t('users.role')}
                value={isEditing ? String(formData.rol_id || '') : String(user.roleId)}
                onChange={(e) => setFormData({ ...formData, rol_id: Number(e.target.value) })}
                options={roles.map((role) => ({ value: String(role.id), label: role.name }))}
                disabled={!isEditing}
                required
              />
              <FormSelect
                label={t('users.society')}
                value={isEditing ? String(formData.soc_id || '') : String(user.societyId)}
                onChange={(e) => setFormData({ ...formData, soc_id: Number(e.target.value) })}
                options={societies.map((s) => ({ value: s.key, label: s.value }))}
                disabled={!isEditing}
                required
              />
              <FormSelect
                label={t('users.civility')}
                value={isEditing ? String(formData.civ_id || '') : String(user.civilityId)}
                onChange={(e) => setFormData({ ...formData, civ_id: Number(e.target.value) })}
                options={civilities.map((c) => ({ value: String(c.id), label: c.designation }))}
                disabled={!isEditing}
                required
              />
            </div>

            {/* Password Section */}
            {isEditing && (
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="text-sm text-primary hover:underline"
                >
                  {showPasswordChange ? t('users.hidePasswordChange') : t('users.changePassword')}
                </button>
                {showPasswordChange && (
                  <div className="mt-3">
                    <FormInput
                      type="password"
                      label={t('users.newPassword')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('users.enterNewPassword')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('users.personalInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('users.firstName')}
                value={isEditing ? formData.usr_firstname || '' : user.firstName || ''}
                onChange={(e) => setFormData({ ...formData, usr_firstname: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('users.lastName')}
                value={isEditing ? formData.usr_lastname || '' : user.lastName || ''}
                onChange={(e) => setFormData({ ...formData, usr_lastname: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('users.jobTitle')}
                value={isEditing ? formData.usr_title || '' : user.title || ''}
                onChange={(e) => setFormData({ ...formData, usr_title: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('users.hrCode')}
                value={isEditing ? formData.usr_code_hr || '' : user.hrCode || ''}
                onChange={(e) => setFormData({ ...formData, usr_code_hr: e.target.value })}
                disabled={!isEditing}
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
                value={isEditing ? formData.usr_email || '' : user.email || ''}
                onChange={(e) => setFormData({ ...formData, usr_email: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('users.telephone')}
                value={isEditing ? formData.usr_tel || '' : user.telephone || ''}
                onChange={(e) => setFormData({ ...formData, usr_tel: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('users.cellphone')}
                value={isEditing ? formData.usr_cellphone || '' : user.cellphone || ''}
                onChange={(e) => setFormData({ ...formData, usr_cellphone: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('users.fax')}
                value={isEditing ? formData.usr_fax || '' : user.fax || ''}
                onChange={(e) => setFormData({ ...formData, usr_fax: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Address */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('users.address')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('users.address1')}
                value={isEditing ? formData.usr_address1 || '' : user.address1 || ''}
                onChange={(e) => setFormData({ ...formData, usr_address1: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
              <FormInput
                label={t('users.address2')}
                value={isEditing ? formData.usr_address2 || '' : user.address2 || ''}
                onChange={(e) => setFormData({ ...formData, usr_address2: e.target.value })}
                disabled={!isEditing}
                className="md:col-span-2"
              />
              <FormInput
                label={t('users.postcode')}
                value={isEditing ? formData.usr_postcode || '' : user.postcode || ''}
                onChange={(e) => setFormData({ ...formData, usr_postcode: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('users.city')}
                value={isEditing ? formData.usr_city || '' : user.city || ''}
                onChange={(e) => setFormData({ ...formData, usr_city: e.target.value })}
                disabled={!isEditing}
              />
              <FormInput
                label={t('users.county')}
                value={isEditing ? formData.usr_county || '' : user.county || ''}
                onChange={(e) => setFormData({ ...formData, usr_county: e.target.value })}
                disabled={!isEditing}
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
                {isEditing ? (
                  <FormSelect
                    value={formData.usr_is_actived ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, usr_is_actived: e.target.value === 'true' })}
                    options={[
                      { value: 'true', label: t('common.active') },
                      { value: 'false', label: t('common.inactive') },
                    ]}
                    className="w-32"
                  />
                ) : (
                  <span className={`px-2 py-1 text-xs font-medium rounded ${user.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                    {user.isActive ? t('common.active') : t('common.inactive')}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('users.adminRights')}</span>
                {isEditing ? (
                  <FormSelect
                    value={formData.usr_super_right ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, usr_super_right: e.target.value === 'true' })}
                    options={[
                      { value: 'true', label: t('common.yes') },
                      { value: 'false', label: t('common.no') },
                    ]}
                    className="w-32"
                  />
                ) : (
                  <span className={`px-2 py-1 text-xs font-medium rounded ${user.isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {user.isAdmin ? t('common.yes') : t('common.no')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">{t('common.details')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('common.createdAt')}</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('common.updatedAt')}</span>
                <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
              </div>
              {user.creatorName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.createdBy')}</span>
                  <span>{user.creatorName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

// Icon components
function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  )
}
