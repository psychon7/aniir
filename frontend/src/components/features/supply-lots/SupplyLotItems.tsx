import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { cn } from '@/lib/utils'
import type { SupplyLotItem } from '@/types/landed-cost'

interface SupplyLotItemsProps {
  items: SupplyLotItem[]
  onAddItem?: () => void
  onEditItem?: (item: SupplyLotItem) => void
  onDeleteItem?: (itemId: number) => void
  isLoading?: boolean
  readonly?: boolean
  showLandedCosts?: boolean
}

// Format currency helper
const formatCurrency = (amount: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

// Format number with units
const formatNumber = (amount: number | null | undefined, unit?: string, decimals = 2) => {
  if (amount === null || amount === undefined) return '-'
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
  return unit ? `${formatted} ${unit}` : formatted
}

export function SupplyLotItems({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  isLoading,
  readonly = false,
  showLandedCosts = false,
}: SupplyLotItemsProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.sli_quantity,
      value: acc.value + item.sli_total_price,
      weight: acc.weight + (item.sli_weight_kg || 0),
      volume: acc.volume + (item.sli_volume_cbm || 0),
      allocatedCost: acc.allocatedCost + item.sli_total_allocated_cost,
      landedCost: acc.landedCost + item.sli_total_landed_cost,
    }),
    { quantity: 0, value: 0, weight: 0, volume: 0, allocatedCost: 0, landedCost: 0 }
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Lot Items" />
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title={`Lot Items (${items.length})`}
        action={
          !readonly && onAddItem && (
            <button
              onClick={onAddItem}
              className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          )
        }
      />
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="text-muted-foreground mb-4">No items added to this lot</p>
            {!readonly && onAddItem && (
              <button onClick={onAddItem} className="btn-secondary">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Items</p>
                  <p className="font-semibold">{items.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Qty</p>
                  <p className="font-semibold">{formatNumber(totals.quantity, undefined, 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="font-semibold">{formatCurrency(totals.value)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Weight</p>
                  <p className="font-semibold">{formatNumber(totals.weight, 'kg')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Volume</p>
                  <p className="font-semibold">{formatNumber(totals.volume, 'CBM', 3)}</p>
                </div>
                {showLandedCosts && (
                  <div>
                    <p className="text-xs text-muted-foreground">Landed Cost</p>
                    <p className="font-semibold text-primary">{formatCurrency(totals.landedCost)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div
                className={cn(
                  'grid gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border',
                  showLandedCosts ? 'grid-cols-12' : 'grid-cols-10'
                )}
              >
                <div className="col-span-3">Product</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                {showLandedCosts && (
                  <>
                    <div className="col-span-2 text-right">Landed Cost</div>
                    <div className="col-span-1 text-right">Unit LC</div>
                  </>
                )}
                {!showLandedCosts && <div className="col-span-2 text-right">Weight / Volume</div>}
              </div>

              {/* Item Rows */}
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {items.map((item) => (
                  <ItemRow
                    key={item.sli_id}
                    item={item}
                    isExpanded={expandedId === item.sli_id}
                    onToggle={() => setExpandedId(expandedId === item.sli_id ? null : item.sli_id)}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    readonly={readonly}
                    showLandedCosts={showLandedCosts}
                  />
                ))}
              </div>

              {/* Table Footer - Totals */}
              <div
                className={cn(
                  'grid gap-2 px-4 py-3 bg-muted/30 text-sm font-medium border-t-2 border-border',
                  showLandedCosts ? 'grid-cols-12' : 'grid-cols-10'
                )}
              >
                <div className="col-span-3">Total</div>
                <div className="col-span-1 text-right">{formatNumber(totals.quantity, undefined, 0)}</div>
                <div className="col-span-2 text-right">-</div>
                <div className="col-span-2 text-right">{formatCurrency(totals.value)}</div>
                {showLandedCosts && (
                  <>
                    <div className="col-span-2 text-right text-primary">{formatCurrency(totals.landedCost)}</div>
                    <div className="col-span-1 text-right">-</div>
                  </>
                )}
                {!showLandedCosts && (
                  <div className="col-span-2 text-right">
                    {formatNumber(totals.weight, 'kg')} / {formatNumber(totals.volume, 'CBM', 3)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Individual item row component
function ItemRow({
  item,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  readonly,
  showLandedCosts,
}: {
  item: SupplyLotItem
  isExpanded: boolean
  onToggle: () => void
  onEdit?: (item: SupplyLotItem) => void
  onDelete?: (itemId: number) => void
  readonly: boolean
  showLandedCosts: boolean
}) {
  return (
    <>
      <div
        className={cn(
          'grid gap-2 px-4 py-3 items-center hover:bg-muted/50 cursor-pointer',
          showLandedCosts ? 'grid-cols-12' : 'grid-cols-10'
        )}
        onClick={onToggle}
      >
        <div className="col-span-3">
          <div className="flex items-center gap-2">
            <svg
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform flex-shrink-0',
                isExpanded && 'rotate-90'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.sli_description || `Product #${item.sli_prd_id}`}
              </p>
              {item.sli_sku && (
                <p className="text-xs text-muted-foreground font-mono">{item.sli_sku}</p>
              )}
            </div>
          </div>
        </div>
        <div className="col-span-1 text-right text-sm">
          {formatNumber(item.sli_quantity, undefined, 0)}
        </div>
        <div className="col-span-2 text-right text-sm">
          {formatCurrency(item.sli_unit_price)}
        </div>
        <div className="col-span-2 text-right text-sm font-medium">
          {formatCurrency(item.sli_total_price)}
        </div>
        {showLandedCosts && (
          <>
            <div className="col-span-2 text-right text-sm font-medium">
              {formatCurrency(item.sli_total_landed_cost)}
            </div>
            <div className="col-span-1 text-right text-sm font-medium text-primary">
              {item.sli_landed_cost_per_unit !== null && item.sli_landed_cost_per_unit !== undefined
                ? formatCurrency(item.sli_landed_cost_per_unit)
                : '-'}
            </div>
          </>
        )}
        {!showLandedCosts && (
          <div className="col-span-2 text-right text-sm text-muted-foreground">
            {formatNumber(item.sli_weight_kg, 'kg')} / {formatNumber(item.sli_volume_cbm, 'CBM', 3)}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 py-4 bg-muted/30 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Product ID</p>
              <p className="font-medium font-mono">#{item.sli_prd_id}</p>
            </div>
            {item.sli_pit_id && (
              <div>
                <p className="text-xs text-muted-foreground">Variant ID</p>
                <p className="font-medium font-mono">#{item.sli_pit_id}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Unit Weight</p>
              <p className="font-medium">{formatNumber(item.sli_unit_weight_kg, 'kg')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unit Volume</p>
              <p className="font-medium">{formatNumber(item.sli_unit_volume_cbm, 'CBM', 4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Weight</p>
              <p className="font-medium">{formatNumber(item.sli_weight_kg, 'kg')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Volume</p>
              <p className="font-medium">{formatNumber(item.sli_volume_cbm, 'CBM', 3)}</p>
            </div>
          </div>

          {/* Allocated Costs (if showLandedCosts) */}
          {showLandedCosts && item.sli_total_allocated_cost > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Allocated Costs</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Freight</p>
                  <p className="font-medium">{formatCurrency(item.sli_allocated_freight)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customs</p>
                  <p className="font-medium">{formatCurrency(item.sli_allocated_customs)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Insurance</p>
                  <p className="font-medium">{formatCurrency(item.sli_allocated_insurance)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Local</p>
                  <p className="font-medium">{formatCurrency(item.sli_allocated_local)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Other</p>
                  <p className="font-medium">{formatCurrency(item.sli_allocated_other)}</p>
                </div>
              </div>
            </div>
          )}

          {!readonly && (
            <div className="mt-4 flex justify-end gap-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(item)
                  }}
                  className="btn-secondary text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.sli_id)
                  }}
                  className="btn-secondary text-sm text-destructive hover:bg-destructive/10"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
