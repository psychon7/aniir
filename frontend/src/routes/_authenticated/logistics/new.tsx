import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { useCreateShipment, useCarriers } from '@/hooks/useLogistics'
import type { ShipmentCreateDto } from '@/types/logistics'

export const Route = createFileRoute('/_authenticated/logistics/new')({
  component: NewShipmentPage,
})

function NewShipmentPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createShipment = useCreateShipment()
  const { data: carriers } = useCarriers(true)

  const [formData, setFormData] = useState<ShipmentCreateDto>({
    shp_car_id: 0,
    shp_sta_id: 1, // Pending
    shp_tracking_number: '',
    // Origin
    shp_origin_address: '',
    shp_origin_city: '',
    // Destination
    shp_destination_address: '',
    shp_destination_city: '',
    // Package info
    shp_weight: undefined,
    shp_packages: undefined,
    // Cost
    shp_cost: undefined,
    // Notes
    shp_notes: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.shp_car_id) {
      alert(t('logistics.selectCarrier'))
      return
    }
    try {
      const result = await createShipment.mutateAsync(formData)
      navigate({ to: '/logistics/$shipmentId', params: { shipmentId: String(result.shp_id) } })
    } catch (error) {
      console.error('Failed to create shipment:', error)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('logistics.newShipment')}
        description={t('logistics.manageDescription')}
        actions={
          <Link to="/logistics" className="btn-secondary">
            {t('common.cancel')}
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader title={t('logistics.shipmentDetails')} />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">{t('logistics.carrier')} *</label>
                <select
                  name="shp_car_id"
                  value={formData.shp_car_id || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">{t('common.select')}...</option>
                  {carriers?.map((carrier) => (
                    <option key={carrier.car_id} value={carrier.car_id}>
                      {carrier.car_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('logistics.tracking')}</label>
                <input
                  type="text"
                  name="shp_tracking_number"
                  value={formData.shp_tracking_number || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="1Z999AA10123456784"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('logistics.estDelivery')}</label>
                <input
                  type="datetime-local"
                  name="shp_estimated_delivery"
                  value={formData.shp_estimated_delivery || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('logistics.packages')}</label>
                <input
                  type="number"
                  name="shp_packages"
                  value={formData.shp_packages || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  min={1}
                  placeholder="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('logistics.weight')} (kg)</label>
                <input
                  type="number"
                  name="shp_weight"
                  value={formData.shp_weight || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('logistics.cost')}</label>
                <input
                  type="number"
                  name="shp_cost"
                  value={formData.shp_cost || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader title={t('logistics.originAddress')} />
            <CardContent>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">{t('common.address')}</label>
                  <input
                    type="text"
                    name="shp_origin_address"
                    value={formData.shp_origin_address || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={t('common.address')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('common.city')}</label>
                  <input
                    type="text"
                    name="shp_origin_city"
                    value={formData.shp_origin_city || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={t('common.city')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('logistics.destinationAddress')} />
            <CardContent>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">{t('common.address')}</label>
                  <input
                    type="text"
                    name="shp_destination_address"
                    value={formData.shp_destination_address || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={t('common.address')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('common.city')}</label>
                  <input
                    type="text"
                    name="shp_destination_city"
                    value={formData.shp_destination_city || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={t('common.city')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader title={t('common.notes')} />
          <CardContent>
            <textarea
              name="shp_notes"
              value={formData.shp_notes || ''}
              onChange={handleInputChange}
              className="form-input"
              rows={3}
              placeholder={t('logistics.notesPlaceholder')}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link to="/logistics" className="btn-secondary">
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={createShipment.isPending || !formData.shp_car_id}
            className="btn-primary"
          >
            {createShipment.isPending ? '...' : t('logistics.createShipment')}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}
