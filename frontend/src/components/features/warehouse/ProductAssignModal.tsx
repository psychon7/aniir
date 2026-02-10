/**
 * ProductAssignModal
 * Modal for searching and assigning a product to a warehouse pallet slot
 */

import { useState, useMemo, useCallback } from 'react'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { useProductSearch } from '@/hooks/useProductLookup'
import { Search, Package, X, Check } from 'lucide-react'

interface ProductAssignModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (productId: number, productRef: string, productName: string) => void
  binId: string
  currentProduct?: { ref: string; name: string } | null
}

export function ProductAssignModal({
  isOpen,
  onClose,
  onAssign,
  binId,
  currentProduct
}: ProductAssignModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number
    reference: string
    name: string
  } | null>(null)

  const { data, isLoading } = useProductSearch(
    { search: searchTerm || undefined, pageSize: 20 },
    isOpen
  )

  const products = useMemo(() => data?.data || [], [data])

  const handleAssign = useCallback(() => {
    if (selectedProduct) {
      onAssign(selectedProduct.id, selectedProduct.reference, selectedProduct.name)
      setSelectedProduct(null)
      setSearchTerm('')
    }
  }, [selectedProduct, onAssign])

  const handleClose = useCallback(() => {
    setSelectedProduct(null)
    setSearchTerm('')
    onClose()
  }, [onClose])

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentProduct ? 'Change Product' : 'Assign Product'}
      description={`Bin Location: ${binId}`}
      size="lg"
      footer={
        <FormModalFooter
          onCancel={handleClose}
          onSubmit={handleAssign}
          submitText={currentProduct ? 'Change' : 'Assign'}
          submitDisabled={!selectedProduct}
        />
      }
    >
      <div className="space-y-4">
        {/* Current product */}
        {currentProduct && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Current Product</div>
            <div className="font-medium text-sm">{currentProduct.ref}</div>
            <div className="text-xs text-muted-foreground">{currentProduct.name}</div>
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name or reference..."
            className="w-full pl-10 pr-10 py-2.5 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Product list */}
        <div className="border rounded-lg max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
              <span className="text-xs">Searching...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <div className="text-xs">
                {searchTerm && searchTerm.length >= 2
                  ? 'No products found'
                  : 'Type at least 2 characters to search'}
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {products.map((product) => {
                const isSelected = selectedProduct?.id === product.id
                return (
                  <button
                    key={product.id}
                    onClick={() =>
                      setSelectedProduct({
                        id: product.id,
                        reference: product.reference,
                        name: product.name
                      })
                    }
                    className={`w-full p-3 text-left hover:bg-accent/50 transition-colors ${
                      isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{product.reference}</div>
                        <div className="text-xs text-muted-foreground truncate">{product.name}</div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          {product.categoryName && <span>{product.categoryName}</span>}
                          {product.stockQuantity !== null && product.stockQuantity !== undefined && (
                            <>
                              <span>·</span>
                              <span>Stock: {product.stockQuantity}</span>
                            </>
                          )}
                          {product.unitPrice !== null && product.unitPrice !== undefined && (
                            <>
                              <span>·</span>
                              <span>${Number(product.unitPrice).toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </FormModal>
  )
}
