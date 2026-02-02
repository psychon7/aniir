import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCreateProject } from '@/hooks/useProjects'
import { useClients } from '@/hooks/useClients'
import { usePaymentTerms, usePaymentModes, useVatRates } from '@/hooks/useLookups'
import type { ProjectCreateDto } from '@/types/project'

export const Route = createFileRoute('/_authenticated/projects/new')({
  component: NewProjectPage,
})

function NewProjectPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const createMutation = useCreateProject()

  // Fetch lookup data
  const { data: clientsData } = useClients({ page: 1, pageSize: 100 })
  const { data: paymentTerms = [] } = usePaymentTerms()
  const { data: paymentModes = [] } = usePaymentModes()
  const { data: vatRates = [] } = useVatRates()

  const [formData, setFormData] = useState<Partial<ProjectCreateDto>>({
    prj_code: '',
    prj_name: '',
    cli_id: undefined,
    pco_id: undefined,
    pmo_id: undefined,
    vat_id: undefined,
    soc_id: 1, // Default society ID
  })

  const handleChange = (field: keyof ProjectCreateDto, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.prj_code || !formData.prj_name || !formData.cli_id || 
        !formData.pco_id || !formData.pmo_id || !formData.vat_id) {
      showError(t('common.error'), t('projects.fillRequiredFields'))
      return
    }

    try {
      const newProject = await createMutation.mutateAsync(formData as ProjectCreateDto)
      success(t('projects.projectCreated'), t('projects.projectCreatedDescription'))
      navigate({ to: '/projects/$projectId' as any, params: { projectId: String(newProject.id) } })
    } catch {
      showError(t('common.error'), t('projects.createError'))
    }
  }

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => navigate({ to: '/projects' as any })} className="btn-secondary">
        {t('common.cancel')}
      </button>
      <button 
        onClick={handleSubmit} 
        className="btn-primary"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? t('common.saving') : t('common.save')}
      </button>
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('projects.newProject')}
        description={t('projects.createNewProject')}
        actions={actions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('projects.projectDetails')} />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('projects.code')} *
                    </label>
                    <input 
                      type="text" 
                      className="input w-full" 
                      placeholder={t('projects.codePlaceholder')}
                      value={formData.prj_code || ''}
                      onChange={(e) => handleChange('prj_code', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('projects.name')} *
                    </label>
                    <input 
                      type="text" 
                      className="input w-full" 
                      placeholder={t('projects.namePlaceholder')}
                      value={formData.prj_name || ''}
                      onChange={(e) => handleChange('prj_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('projects.client')} *
                    </label>
                    <select 
                      className="input w-full"
                      value={formData.cli_id || ''}
                      onChange={(e) => handleChange('cli_id', Number(e.target.value))}
                      required
                    >
                      <option value="">{t('projects.selectClient')}</option>
                      {(clientsData?.data || []).map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('projects.paymentTerm')} *
                    </label>
                    <select 
                      className="input w-full"
                      value={formData.pco_id || ''}
                      onChange={(e) => handleChange('pco_id', Number(e.target.value))}
                      required
                    >
                      <option value="">{t('projects.selectPaymentTerm')}</option>
                      {paymentTerms.map((term) => (
                        <option key={term.key} value={term.key}>
                          {term.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('projects.paymentMode')} *
                    </label>
                    <select 
                      className="input w-full"
                      value={formData.pmo_id || ''}
                      onChange={(e) => handleChange('pmo_id', Number(e.target.value))}
                      required
                    >
                      <option value="">{t('projects.selectPaymentMode')}</option>
                      {paymentModes.map((mode) => (
                        <option key={mode.key} value={mode.key}>
                          {mode.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      {t('projects.vatRate')} *
                    </label>
                    <select 
                      className="input w-full"
                      value={formData.vat_id || ''}
                      onChange={(e) => handleChange('vat_id', Number(e.target.value))}
                      required
                    >
                      <option value="">{t('projects.selectVatRate')}</option>
                      {vatRates.map((rate) => (
                        <option key={rate.key} value={rate.key}>
                          {rate.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
