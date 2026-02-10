import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormCheckbox } from '@/components/ui/form/FormCheckbox'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { useToast } from '@/components/ui/feedback/Toast'
import { useClientPrices, useCreateClientPrice, useDeleteClientPrice } from '@/hooks/usePricing'
import apiClient from '@/api/client'

interface PricingTabProps {
  clientId: number
}

export function PricingTab({ clientId }: PricingTabProps) {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const [page, setPage] = useState(1)
  const { data: pricesData, isLoading } = useClientPrices(clientId, { page, pageSize: 20, activeOnly: false })
  const prices = pricesData?.data || []
  const totalCount = pricesData?.totalCount || 0

  const createMutation = useCreateClientPrice(clientId)
  const deleteMutation = useDeleteClientPrice(clientId)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletePriceId, setDeletePriceId] = useState<number | null>(null)

  const [form, setForm] = useState({
    productId: '',
    unitPrice: '',
    discountPercent: '',
    minQuantity: '',
    maxQuantity: '',
    notes: '',
    isActive: true,
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', 'lookup-for-pricing'],
    queryFn: async () => {
      const response = await apiClient.get('/products', { params: { page: 1, pageSize: 200 } })
      return response.data
    },
  })
  const productOptions = productsData?.data || []

  const handleCreate = async () => {
    if (!form.productId || !form.unitPrice) {
      showError(t('common.error'), t('pricing.productAndPriceRequired', 'Product and unit price are required.'))
      return
    }
    try {
      await createMutation.mutateAsync({
        cpp_cli_id: clientId,
        cpp_prd_id: Number(form.productId),
        cpp_unit_price: Number(form.unitPrice),
        cpp_discount_percent: form.discountPercent ? Number(form.discountPercent) : undefined,
        cpp_min_quantity: form.minQuantity ? Number(form.minQuantity) : undefined,
        cpp_max_quantity: form.maxQuantity ? Number(form.maxQuantity) : undefined,
        cpp_notes: form.notes || undefined,
        cpp_is_active: form.isActive,
      })
      success(t('pricing.priceCreated'), t('pricing.priceCreatedDesc', 'Client price has been created.'))
      setIsFormOpen(false)
      setForm({ productId: '', unitPrice: '', discountPercent: '', minQuantity: '', maxQuantity: '', notes: '', isActive: true })
    } catch {
      showError(t('common.error'), t('pricing.priceCreateError', 'Unable to add client price.'))
    }
  }

  const handleDelete = async () => {
    if (deletePriceId === null) return
    try {
      await deleteMutation.mutateAsync(deletePriceId)
      success(t('pricing.priceDeleted'), t('pricing.priceDeletedDesc', 'Client price has been removed.'))
      setDeletePriceId(null)
    } catch {
      showError(t('common.error'), t('pricing.priceDeleteError', 'Unable to remove client price.'))
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <>
      <Card>
        <CardHeader
          title={`${t('pricing.productPrices')} (${totalCount})`}
          action={
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              + {t('pricing.addPrice')}
            </button>
          }
        />
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : prices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('pricing.noPricesFound')}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">{t('products.name')}</th>
                      <th className="py-2 pr-4 font-medium">{t('pricing.unitPrice')}</th>
                      <th className="py-2 pr-4 font-medium">{t('pricing.discount')}</th>
                      <th className="py-2 pr-4 font-medium">{t('pricing.quantityRange', 'Qty Range')}</th>
                      <th className="py-2 pr-4 font-medium">{t('common.status')}</th>
                      <th className="py-2 font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((price) => (
                      <tr key={price.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4 font-medium text-foreground">
                          {price.productName || `Product #${price.productId}`}
                        </td>
                        <td className="py-3 pr-4 font-mono">
                          {price.currencyCode || '€'}{price.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 pr-4">
                          {price.discountPercent && price.discountPercent > 0
                            ? <span className="text-green-600">-{price.discountPercent}%</span>
                            : '-'
                          }
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {price.minQuantity || price.maxQuantity
                            ? `${price.minQuantity || 0} - ${price.maxQuantity || '∞'}`
                            : t('pricing.noMinimum')
                          }
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            price.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {price.isActive ? t('common.active') : t('common.inactive')}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => setDeletePriceId(price.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            {t('common.delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalCount > 20 && (
                <div className="flex justify-center gap-2 pt-4 mt-2 border-t border-border">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="text-xs px-3 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.previous')}
                  </button>
                  <span className="text-xs text-muted-foreground py-1">
                    {t('common.page')} {page}
                  </span>
                  <button
                    disabled={prices.length < 20}
                    onClick={() => setPage((p) => p + 1)}
                    className="text-xs px-3 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t('pricing.addPrice')}
        description={t('pricing.addPriceDescription', 'Create a client-specific product price override.')}
        footer={
          <FormModalFooter
            onCancel={() => setIsFormOpen(false)}
            onSubmit={handleCreate}
            submitText={t('common.create')}
            isSubmitting={createMutation.isPending}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            label={t('products.product', 'Product')}
            value={form.productId}
            onChange={set('productId')}
            options={[
              { value: '', label: t('common.selectOption') },
              ...productOptions.map((p: any) => ({
                value: String(p.id),
                label: `${p.reference} - ${p.name}`,
              })),
            ]}
          />
          <FormInput
            type="number"
            label={t('pricing.unitPrice')}
            value={form.unitPrice}
            onChange={set('unitPrice')}
          />
          <FormInput
            type="number"
            label={t('pricing.discountPercent', 'Discount %')}
            value={form.discountPercent}
            onChange={set('discountPercent')}
          />
          <FormInput
            type="number"
            label={t('pricing.minQuantity')}
            value={form.minQuantity}
            onChange={set('minQuantity')}
          />
          <FormInput
            type="number"
            label={t('pricing.maxQuantity')}
            value={form.maxQuantity}
            onChange={set('maxQuantity')}
          />
          <FormInput
            label={t('common.notes')}
            value={form.notes}
            onChange={set('notes')}
          />
          <FormCheckbox
            id="price-active"
            label={t('common.active')}
            checked={form.isActive}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
        </div>
      </FormModal>

      <DeleteConfirmDialog
        isOpen={deletePriceId !== null}
        onClose={() => setDeletePriceId(null)}
        onConfirm={handleDelete}
        itemName={t('pricing.productPrices', 'price')}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
