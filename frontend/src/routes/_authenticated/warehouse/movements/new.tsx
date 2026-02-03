import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useCreateStockMovement, useWarehouseLookup } from '@/hooks/useWarehouse'
import type { StockMovementCreateDto, StockMovementLineCreateDto, MovementType } from '@/types/warehouse'

export const Route = createFileRoute('/_authenticated/warehouse/movements/new')({
  component: NewMovementPage,
})

const MOVEMENT_TYPES: MovementType[] = [
  'RECEIPT',
  'SHIPMENT',
  'TRANSFER',
  'ADJUSTMENT',
  'RETURN_IN',
  'RETURN_OUT',
  'DAMAGE',
  'DESTROY',
  'LOAN_OUT',
  'LOAN_IN',
]

function NewMovementPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMovement = useCreateStockMovement()
  const { data: warehouses } = useWarehouseLookup()

  const [formData, setFormData] = useState<StockMovementCreateDto>({
    stm_type: 'RECEIPT',
    stm_date: new Date().toISOString().split('T')[0],
    stm_description: '',
    stm_whs_id: undefined,
    stm_whs_destination_id: undefined,
    stm_notes: '',
    lines: [],
  })

  const [currentLine, setCurrentLine] = useState<StockMovementLineCreateDto>({
    sml_prd_ref: '',
    sml_prd_name: '',
    sml_quantity: 1,
    sml_location: '',
    sml_batch_number: '',
  })

  const getTypeLabel = (type: MovementType): string => {
    const typeMap: Record<MovementType, string> = {
      RECEIPT: t('warehouse.receipt'),
      SHIPMENT: t('warehouse.shipment'),
      TRANSFER: t('warehouse.transfer'),
      ADJUSTMENT: t('warehouse.adjustment'),
      RETURN_IN: t('warehouse.return') + ' (In)',
      RETURN_OUT: t('warehouse.return') + ' (Out)',
      DAMAGE: t('warehouse.damage'),
      DESTROY: t('warehouse.destroy'),
      LOAN_OUT: t('warehouse.loan') + ' (Out)',
      LOAN_IN: t('warehouse.loan') + ' (In)',
    }
    return typeMap[type] || type
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }))
  }

  const handleLineInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setCurrentLine((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const addLine = () => {
    if (currentLine.sml_prd_name && currentLine.sml_quantity > 0) {
      setFormData((prev) => ({
        ...prev,
        lines: [...(prev.lines || []), currentLine],
      }))
      setCurrentLine({
        sml_prd_ref: '',
        sml_prd_name: '',
        sml_quantity: 1,
        sml_location: '',
        sml_batch_number: '',
      })
    }
  }

  const removeLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createStockMovement.mutateAsync(formData)
      navigate({ to: '/warehouse/movements/$movementId', params: { movementId: String(result.stm_id) } })
    } catch (error) {
      console.error('Failed to create movement:', error)
    }
  }

  const isTransfer = formData.stm_type === 'TRANSFER'

  return (
    <PageContainer>
      <PageHeader
        title={t('warehouse.createMovement')}
        description={t('warehouse.manageDescription')}
        actions={
          <Link to="/warehouse/movements" className="btn-secondary">
            {t('common.cancel')}
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader title={t('warehouse.movementDetails')} />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">{t('warehouse.movementType')} *</label>
                <select
                  name="stm_type"
                  value={formData.stm_type}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  {MOVEMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('warehouse.movementDate')} *</label>
                <input
                  type="date"
                  name="stm_date"
                  value={formData.stm_date}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('warehouse.sourceWarehouse')}</label>
                <select
                  name="stm_whs_id"
                  value={formData.stm_whs_id || ''}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">{t('common.select')}...</option>
                  {warehouses?.items?.map((wh) => (
                    <option key={wh.wh_id} value={wh.wh_id}>
                      {wh.label || `${wh.wh_code} - ${wh.wh_name}`}
                    </option>
                  ))}
                </select>
              </div>

              {isTransfer && (
                <div className="form-group">
                  <label className="form-label">{t('warehouse.destinationWarehouse')}</label>
                  <select
                    name="stm_whs_destination_id"
                    value={formData.stm_whs_destination_id || ''}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">{t('common.select')}...</option>
                    {warehouses?.items?.map((wh) => (
                      <option key={wh.wh_id} value={wh.wh_id}>
                        {wh.label || `${wh.wh_code} - ${wh.wh_name}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group md:col-span-2">
                <label className="form-label">{t('common.description')}</label>
                <textarea
                  name="stm_description"
                  value={formData.stm_description || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={2}
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">{t('common.notes')}</label>
                <textarea
                  name="stm_notes"
                  value={formData.stm_notes || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={t('common.lines')} />
          <CardContent>
            <div className="space-y-4">
              {/* Add line form */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="form-group">
                  <label className="form-label">{t('warehouse.reference')}</label>
                  <input
                    type="text"
                    name="sml_prd_ref"
                    value={currentLine.sml_prd_ref || ''}
                    onChange={handleLineInputChange}
                    className="form-input"
                    placeholder="REF001"
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="form-label">{t('warehouse.product')} *</label>
                  <input
                    type="text"
                    name="sml_prd_name"
                    value={currentLine.sml_prd_name || ''}
                    onChange={handleLineInputChange}
                    className="form-input"
                    placeholder={t('warehouse.product')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('warehouse.quantity')} *</label>
                  <input
                    type="number"
                    name="sml_quantity"
                    value={currentLine.sml_quantity}
                    onChange={handleLineInputChange}
                    className="form-input"
                    min={1}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('warehouse.location')}</label>
                  <input
                    type="text"
                    name="sml_location"
                    value={currentLine.sml_location || ''}
                    onChange={handleLineInputChange}
                    className="form-input"
                    placeholder="A1-01"
                  />
                </div>
                <div className="form-group flex items-end">
                  <button
                    type="button"
                    onClick={addLine}
                    className="btn-secondary w-full"
                    disabled={!currentLine.sml_prd_name || currentLine.sml_quantity <= 0}
                  >
                    {t('warehouse.addLine')}
                  </button>
                </div>
              </div>

              {/* Lines table */}
              {formData.lines && formData.lines.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">{t('warehouse.reference')}</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">{t('warehouse.product')}</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">{t('warehouse.quantity')}</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">{t('warehouse.location')}</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lines.map((line, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2 font-mono text-sm">{line.sml_prd_ref || '-'}</td>
                          <td className="px-4 py-2">{line.sml_prd_name}</td>
                          <td className="px-4 py-2 font-medium">{line.sml_quantity}</td>
                          <td className="px-4 py-2">{line.sml_location || '-'}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              {t('common.remove')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(!formData.lines || formData.lines.length === 0) && (
                <p className="text-muted-foreground text-center py-8">
                  {t('common.noItemsFound')}. {t('warehouse.addLine')}.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link to="/warehouse/movements" className="btn-secondary">
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={createStockMovement.isPending || !formData.lines?.length}
            className="btn-primary"
          >
            {createStockMovement.isPending ? '...' : t('warehouse.createMovement')}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}
