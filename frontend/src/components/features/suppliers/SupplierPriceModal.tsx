import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import type { SupplierProductPriceCreateDto } from '@/types/pricing'

interface SupplierPriceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SupplierProductPriceCreateDto) => void
  supplierId: number
  isSubmitting?: boolean
}

export function SupplierPriceModal({
  isOpen,
  onClose,
  onSubmit,
  supplierId,
  isSubmitting = false,
}: SupplierPriceModalProps) {
  const { t } = useTranslation()

  const [form, setForm] = useState({
    productId: '',
    unitCost: '',
    supplierRef: '',
    supplierProductName: '',
    discountPercent: '',
    minOrderQty: '',
    leadTimeDays: '',
    priority: '1',
    isPreferred: false,
    notes: '',
  })

  // Product search state
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductName, setSelectedProductName] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)

  // Debounced product search
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Array<{ id: number; name: string; reference: string }>>([])
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  // Search products when debounced search changes
  useEffect(() => {
    if (!debouncedProductSearch || debouncedProductSearch.length < 2) {
      setProductResults([])
      return
    }

    const searchProducts = async () => {
      setIsSearchingProducts(true)
      try {
        // Use the API client to search products
        const { default: apiClient } = await import('@/api/client')
        const { data } = await apiClient.get('/products', {
          params: { search: debouncedProductSearch, pageSize: 10, page: 1 },
        })
        const products = data?.data || data?.items || []
        setProductResults(
          products.map((p: any) => ({
            id: p.prd_id ?? p.id,
            name: p.productName ?? p.prd_name ?? p.name ?? `Product #${p.prd_id ?? p.id}`,
            reference: p.productReference ?? p.prd_ref ?? p.reference ?? '',
          }))
        )
      } catch {
        setProductResults([])
      } finally {
        setIsSearchingProducts(false)
      }
    }

    searchProducts()
  }, [debouncedProductSearch])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setForm({
        productId: '',
        unitCost: '',
        supplierRef: '',
        supplierProductName: '',
        discountPercent: '',
        minOrderQty: '',
        leadTimeDays: '',
        priority: '1',
        isPreferred: false,
        notes: '',
      })
      setProductSearch('')
      setSelectedProductName('')
      setIsProductDropdownOpen(false)
      setProductResults([])
    }
  }, [isOpen])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSelectProduct = (productId: number, productName: string) => {
    setForm((prev) => ({ ...prev, productId: String(productId) }))
    setSelectedProductName(productName)
    setProductSearch(productName)
    setIsProductDropdownOpen(false)
  }

  const handleProductSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductSearch(e.target.value)
    setForm((prev) => ({ ...prev, productId: '' }))
    setSelectedProductName('')
    setIsProductDropdownOpen(true)
  }

  const handleSubmit = () => {
    if (!form.productId || !form.unitCost) return
    const payload: SupplierProductPriceCreateDto = {
      spp_sup_id: supplierId,
      spp_prd_id: Number(form.productId),
      spp_unit_cost: Number(form.unitCost),
      spp_supplier_ref: form.supplierRef || undefined,
      spp_supplier_name: form.supplierProductName || undefined,
      spp_discount_percent: form.discountPercent ? Number(form.discountPercent) : undefined,
      spp_min_order_qty: form.minOrderQty ? Number(form.minOrderQty) : undefined,
      spp_lead_time_days: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
      spp_priority: form.priority ? Number(form.priority) : undefined,
      spp_is_preferred: form.isPreferred,
      spp_notes: form.notes || undefined,
      spp_is_active: true,
    }
    onSubmit(payload)
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pricing.addPrice', 'Add Price')}
      description={t('pricing.addPriceDescription', 'Add a product price for this supplier')}
      size="lg"
      footer={
        <FormModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={t('common.create', 'Create')}
          isSubmitting={isSubmitting}
          submitDisabled={!form.productId || !form.unitCost}
        />
      }
    >
      <div className="space-y-4">
        {/* Product Search */}
        <div className="relative">
          <FormInput
            label={t('pricing.product', 'Product')}
            value={productSearch}
            onChange={handleProductSearchChange}
            onFocus={() => setIsProductDropdownOpen(true)}
            placeholder={t('pricing.searchProductPlaceholder', 'Search by product name or reference...')}
            required
          />

          {/* Selected indicator */}
          {form.productId && selectedProductName && (
            <div className="mt-1 flex items-center gap-2 text-xs text-green-600">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t('pricing.selectedProduct', 'Selected')}: {selectedProductName}
            </div>
          )}

          {/* Product Dropdown */}
          {isProductDropdownOpen && productSearch && !form.productId && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isSearchingProducts ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t('common.searching', 'Searching...')}
                </div>
              ) : productResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {productSearch.length < 2
                    ? t('common.typeToSearch', 'Type at least 2 characters to search...')
                    : t('common.noResults', 'No results found')}
                </div>
              ) : (
                productResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                    onClick={() => handleSelectProduct(product.id, product.name)}
                  >
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    {product.reference && (
                      <p className="text-xs text-muted-foreground font-mono">{product.reference}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            type="number"
            label={t('pricing.unitCost', 'Unit Cost')}
            value={form.unitCost}
            onChange={set('unitCost')}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
          <FormInput
            label={t('pricing.supplierRef', 'Supplier Reference')}
            value={form.supplierRef}
            onChange={set('supplierRef')}
            placeholder={t('pricing.supplierRefPlaceholder', 'Supplier product code')}
          />
          <FormInput
            label={t('pricing.supplierProductName', 'Supplier Product Name')}
            value={form.supplierProductName}
            onChange={set('supplierProductName')}
            placeholder={t('pricing.supplierNamePlaceholder', 'Name used by supplier')}
          />
          <FormInput
            type="number"
            label={t('pricing.discountPercent', 'Discount %')}
            value={form.discountPercent}
            onChange={set('discountPercent')}
            placeholder="0"
            min="0"
            max="100"
            step="0.1"
          />
          <FormInput
            type="number"
            label={t('pricing.minQuantity', 'Min Order Quantity')}
            value={form.minOrderQty}
            onChange={set('minOrderQty')}
            placeholder="1"
            min="0"
          />
          <FormInput
            type="number"
            label={t('pricing.leadTime', 'Lead Time (Days)')}
            value={form.leadTimeDays}
            onChange={set('leadTimeDays')}
            placeholder="0"
            min="0"
          />
          <FormInput
            type="number"
            label={t('pricing.priority', 'Priority')}
            value={form.priority}
            onChange={set('priority')}
            placeholder="1"
            min="1"
          />
        </div>

        {/* Preferred checkbox */}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="supplier-price-preferred"
            checked={form.isPreferred}
            onChange={(e) => setForm((prev) => ({ ...prev, isPreferred: e.target.checked }))}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <label htmlFor="supplier-price-preferred" className="text-sm font-medium text-foreground">
            {t('pricing.preferred', 'Preferred Supplier')}
          </label>
        </div>
      </div>
    </FormModal>
  )
}
