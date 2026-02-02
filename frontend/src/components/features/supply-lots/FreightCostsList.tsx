import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { FreightCost, FreightCostType } from '@/types/landed-cost'
import { FREIGHT_COST_TYPE_LABELS } from '@/types/landed-cost'

interface FreightCostsListProps {
  freightCosts: FreightCost[]
  onAddCost?: () => void
  onEditCost?: (cost: FreightCost) => void
  onDeleteCost?: (costId: number) => void
  isLoading?: boolean
  readonly?: boolean
}

// Format currency helper
const formatCurrency = (amount: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

// Format date helper
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Cost type badge color mapping
const getCostTypeColor = (type: FreightCostType): string => {
  const colors: Record<FreightCostType, string> = {
    FREIGHT: 'blue',
    CUSTOMS: 'amber',
    INSURANCE: 'green',
    LOCAL: 'purple',
    HANDLING: 'cyan',
    OTHER: 'gray',
  }
  return colors[type] || 'gray'
}

export function FreightCostsList({
  freightCosts,
  onAddCost,
  onEditCost,
  onDeleteCost,
  isLoading,
  readonly = false,
}: FreightCostsListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Group costs by type for summary
  const costsByType = freightCosts.reduce((acc, cost) => {
    const type = cost.frc_type
    if (!acc[type]) {
      acc[type] = { count: 0, total: 0 }
    }
    acc[type].count++
    acc[type].total += cost.frc_amount_converted
    return acc
  }, {} as Record<FreightCostType, { count: number; total: number }>)

  const totalCosts = freightCosts.reduce((sum, cost) => sum + cost.frc_amount_converted, 0)
  const paidCosts = freightCosts.filter((c) => c.frc_is_paid)
  const unpaidCosts = freightCosts.filter((c) => !c.frc_is_paid)

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Freight & Related Costs" />
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
        title="Freight & Related Costs"
        action={
          !readonly && onAddCost && (
            <button
              onClick={onAddCost}
              className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Cost
            </button>
          )
        }
      />
      <CardContent>
        {freightCosts.length === 0 ? (
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-muted-foreground mb-4">No freight costs added yet</p>
            {!readonly && onAddCost && (
              <button onClick={onAddCost} className="btn-secondary">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Cost
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Section */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Costs</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalCosts)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entries</p>
                  <p className="text-lg font-semibold">{freightCosts.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-lg font-semibold text-green-600">
                    {paidCosts.length} ({formatCurrency(paidCosts.reduce((s, c) => s + c.frc_amount_converted, 0))})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unpaid</p>
                  <p className="text-lg font-semibold text-amber-600">
                    {unpaidCosts.length} ({formatCurrency(unpaidCosts.reduce((s, c) => s + c.frc_amount_converted, 0))})
                  </p>
                </div>
              </div>

              {/* Cost Type Breakdown */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">By Type</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(costsByType).map(([type, data]) => (
                    <span
                      key={type}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        `bg-${getCostTypeColor(type as FreightCostType)}-100 text-${getCostTypeColor(type as FreightCostType)}-800`,
                        'dark:bg-opacity-20'
                      )}
                    >
                      {FREIGHT_COST_TYPE_LABELS[type as FreightCostType]}
                      <span className="font-normal">({data.count})</span>
                      <span className="font-semibold">{formatCurrency(data.total)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Costs List */}
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Vendor</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1"></div>
              </div>

              {/* Cost Rows */}
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {freightCosts.map((cost) => (
                  <FreightCostRow
                    key={cost.frc_id}
                    cost={cost}
                    isExpanded={expandedId === cost.frc_id}
                    onToggle={() => setExpandedId(expandedId === cost.frc_id ? null : cost.frc_id)}
                    onEdit={onEditCost}
                    onDelete={onDeleteCost}
                    readonly={readonly}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Individual cost row component
function FreightCostRow({
  cost,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  readonly,
}: {
  cost: FreightCost
  isExpanded: boolean
  onToggle: () => void
  onEdit?: (cost: FreightCost) => void
  onDelete?: (costId: number) => void
  readonly: boolean
}) {
  return (
    <>
      <div
        className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="col-span-2">
          <span
            className={cn(
              'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
              `bg-${getCostTypeColor(cost.frc_type)}-100 text-${getCostTypeColor(cost.frc_type)}-800`,
              'dark:bg-opacity-20'
            )}
          >
            {FREIGHT_COST_TYPE_LABELS[cost.frc_type]}
          </span>
        </div>
        <div className="col-span-3">
          <p className="text-sm text-foreground truncate">{cost.frc_description}</p>
          {cost.frc_invoice_ref && (
            <p className="text-xs text-muted-foreground font-mono">Inv: {cost.frc_invoice_ref}</p>
          )}
        </div>
        <div className="col-span-2 text-sm text-muted-foreground truncate">
          {cost.frc_vendor_name || '-'}
        </div>
        <div className="col-span-2 text-right">
          <p className="text-sm font-medium">{formatCurrency(cost.frc_amount_converted)}</p>
          {cost.frc_exchange_rate !== 1 && (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(cost.frc_amount)} @ {cost.frc_exchange_rate}
            </p>
          )}
        </div>
        <div className="col-span-2 flex justify-center">
          <StatusBadge status={cost.frc_is_paid ? 'Paid' : 'Unpaid'} />
        </div>
        <div className="col-span-1 flex justify-end items-center gap-1">
          <svg
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 py-4 bg-muted/30 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Invoice Date</p>
              <p className="font-medium">{formatDate(cost.frc_invoice_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid Date</p>
              <p className="font-medium">{formatDate(cost.frc_paid_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(cost.frc_created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Updated</p>
              <p className="font-medium">{formatDate(cost.frc_updated_at)}</p>
            </div>
          </div>

          {cost.frc_notes && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{cost.frc_notes}</p>
            </div>
          )}

          {!readonly && (
            <div className="mt-4 flex justify-end gap-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(cost)
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
                    onDelete(cost.frc_id)
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
