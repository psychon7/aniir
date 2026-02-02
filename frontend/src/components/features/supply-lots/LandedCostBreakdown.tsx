import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { cn } from '@/lib/utils'
import type {
  LandedCostBreakdown as LandedCostBreakdownType,
  LandedCostBreakdownItem,
  AllocationStrategy,
} from '@/types/landed-cost'
import { useCalculateLandedCost } from '@/hooks/useLandedCost'
import { useToast } from '@/components/ui/feedback/Toast'

interface LandedCostBreakdownProps {
  breakdown: LandedCostBreakdownType | null
  lotId: number
  isLoading?: boolean
  onCalculateSuccess?: () => void
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

// Format percentage helper
const formatPercent = (value: number, decimals = 1) => {
  return `${value.toFixed(decimals)}%`
}

export function LandedCostBreakdown({
  breakdown,
  lotId,
  isLoading,
  onCalculateSuccess,
}: LandedCostBreakdownProps) {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const [selectedStrategy, setSelectedStrategy] = useState<AllocationStrategy>('MIXED')
  const [showStrategyInfo, setShowStrategyInfo] = useState(false)
  const [chartView, setChartView] = useState<'bar' | 'pie'>('bar')

  const calculateMutation = useCalculateLandedCost()

  // Strategy labels and descriptions using i18n
  const strategyLabels: Record<AllocationStrategy, string> = {
    WEIGHT: t('landedCost.strategy.WEIGHT'),
    VOLUME: t('landedCost.strategy.VOLUME'),
    VALUE: t('landedCost.strategy.VALUE'),
    MIXED: t('landedCost.strategy.MIXED'),
  }

  const strategyDescriptions: Record<AllocationStrategy, string> = {
    WEIGHT: t('landedCost.strategy.weightDesc'),
    VOLUME: t('landedCost.strategy.volumeDesc'),
    VALUE: t('landedCost.strategy.valueDesc'),
    MIXED: t('landedCost.strategy.mixedDesc'),
  }

  const handleCalculate = async (recalculate = false) => {
    try {
      await calculateMutation.mutateAsync({
        lotId,
        request: {
          strategy: selectedStrategy,
          recalculate,
        },
      })
      success(
        t('landedCost.breakdown.calculationComplete'),
        t('landedCost.breakdown.calculationCompleteDesc', {
          action: recalculate ? 'recalculated' : 'calculated',
          strategy: strategyLabels[selectedStrategy],
        })
      )
      onCalculateSuccess?.()
    } catch (err) {
      showError(
        t('landedCost.breakdown.calculationFailed'),
        t('landedCost.breakdown.calculationFailedDesc')
      )
    }
  }

  // Export breakdown to CSV
  const handleExportCSV = () => {
    if (!breakdown) return

    try {
      const headers = [
        t('landedCost.breakdown.item'),
        'SKU',
        t('landedCost.breakdown.qty'),
        t('landedCost.breakdown.unitPrice'),
        t('landedCost.breakdown.productValue'),
        t('landedCost.freight'),
        t('landedCost.customs'),
        t('landedCost.insurance'),
        t('landedCost.local'),
        t('landedCost.other'),
        t('landedCost.breakdown.allocatedCosts'),
        t('landedCost.breakdown.totalLanded'),
        t('landedCost.breakdown.unitLandedCost'),
        t('landedCost.breakdown.allocationPercent'),
      ]

      const totalAllocated = breakdown.items.reduce((sum, i) => sum + i.total_allocated_cost, 0)

      const rows = breakdown.items.map((item) => [
        item.description || item.sku || `Product #${item.product_id}`,
        item.sku || '',
        item.quantity,
        formatCurrency(item.unit_price),
        formatCurrency(item.total_price),
        formatCurrency(item.allocated_freight),
        formatCurrency(item.allocated_customs),
        formatCurrency(item.allocated_insurance),
        formatCurrency(item.allocated_local),
        formatCurrency(item.allocated_other),
        formatCurrency(item.total_allocated_cost),
        formatCurrency(item.total_landed_cost),
        item.landed_cost_per_unit ? formatCurrency(item.landed_cost_per_unit) : '-',
        totalAllocated > 0
          ? formatPercent((item.total_allocated_cost / totalAllocated) * 100)
          : '0%',
      ])

      // Add totals row
      const totalCosts =
        breakdown.total_freight_cost +
        breakdown.total_customs_cost +
        breakdown.total_insurance_cost +
        breakdown.total_local_cost +
        breakdown.total_other_cost

      rows.push([
        t('common.total'),
        '',
        breakdown.items.reduce((sum, i) => sum + i.quantity, 0).toString(),
        '-',
        formatCurrency(breakdown.total_product_value),
        formatCurrency(breakdown.total_freight_cost),
        formatCurrency(breakdown.total_customs_cost),
        formatCurrency(breakdown.total_insurance_cost),
        formatCurrency(breakdown.total_local_cost),
        formatCurrency(breakdown.total_other_cost),
        formatCurrency(totalCosts),
        formatCurrency(breakdown.total_landed_cost),
        '-',
        '100%',
      ])

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `landed-cost-breakdown-${breakdown.lot_reference}-${new Date().toISOString().split('T')[0]}.csv`
      )
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      success(t('common.export'), t('landedCost.breakdown.exportSuccess'))
    } catch (err) {
      showError(t('errors.exportError'), t('landedCost.breakdown.exportFailed'))
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title={t('landedCost.breakdown.title')} />
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render empty state with calculate option
  if (!breakdown || !breakdown.allocation_completed) {
    return (
      <Card>
        <CardHeader title={t('landedCost.breakdown.title')} />
        <CardContent>
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t('landedCost.breakdown.notCalculated')}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('landedCost.breakdown.notCalculatedDesc')}
            </p>

            {/* Strategy Selection */}
            <div className="max-w-sm mx-auto mb-6">
              <label className="block text-sm font-medium text-foreground mb-2 text-left">
                {t('landedCost.breakdown.allocationStrategy')}
              </label>
              <div className="relative">
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value as AllocationStrategy)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(Object.keys(strategyLabels) as AllocationStrategy[]).map((value) => (
                    <option key={value} value={value}>
                      {strategyLabels[value]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowStrategyInfo(!showStrategyInfo)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
              {showStrategyInfo && (
                <p className="mt-2 text-xs text-muted-foreground text-left">
                  {strategyDescriptions[selectedStrategy]}
                </p>
              )}
            </div>

            <button
              onClick={() => handleCalculate(false)}
              disabled={calculateMutation.isPending}
              className={cn(
                'btn-primary',
                calculateMutation.isPending && 'opacity-50 cursor-not-allowed'
              )}
            >
              {calculateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('landedCost.breakdown.calculating')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  {t('landedCost.breakdown.calculate')}
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate percentages for the cost breakdown chart
  const totalCosts =
    breakdown.total_freight_cost +
    breakdown.total_customs_cost +
    breakdown.total_insurance_cost +
    breakdown.total_local_cost +
    breakdown.total_other_cost

  const costCategories = [
    {
      key: 'freight',
      label: t('landedCost.freight'),
      amount: breakdown.total_freight_cost,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      percentage: totalCosts > 0 ? (breakdown.total_freight_cost / totalCosts) * 100 : 0,
    },
    {
      key: 'customs',
      label: t('landedCost.customs'),
      amount: breakdown.total_customs_cost,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      percentage: totalCosts > 0 ? (breakdown.total_customs_cost / totalCosts) * 100 : 0,
    },
    {
      key: 'insurance',
      label: t('landedCost.insurance'),
      amount: breakdown.total_insurance_cost,
      color: 'bg-green-500',
      textColor: 'text-green-500',
      percentage: totalCosts > 0 ? (breakdown.total_insurance_cost / totalCosts) * 100 : 0,
    },
    {
      key: 'local',
      label: t('landedCost.local'),
      amount: breakdown.total_local_cost,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      percentage: totalCosts > 0 ? (breakdown.total_local_cost / totalCosts) * 100 : 0,
    },
    {
      key: 'other',
      label: t('landedCost.other'),
      amount: breakdown.total_other_cost,
      color: 'bg-gray-500',
      textColor: 'text-gray-500',
      percentage: totalCosts > 0 ? (breakdown.total_other_cost / totalCosts) * 100 : 0,
    },
  ].filter((cat) => cat.amount > 0)

  // Calculate allocation percentage for each item
  const totalAllocatedCost = breakdown.items.reduce((sum, i) => sum + i.total_allocated_cost, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label={t('landedCost.breakdown.productValue')}
          value={formatCurrency(breakdown.total_product_value)}
          sublabel={t('landedCost.breakdown.productValueDesc')}
        />
        <SummaryCard
          label={t('landedCost.breakdown.totalCosts')}
          value={formatCurrency(totalCosts)}
          sublabel={t('landedCost.breakdown.totalCostsDesc')}
          variant="info"
        />
        <SummaryCard
          label={t('landedCost.breakdown.landedCost')}
          value={formatCurrency(breakdown.total_landed_cost)}
          sublabel={t('landedCost.breakdown.landedCostDesc')}
          variant="success"
        />
        <SummaryCard
          label={t('landedCost.breakdown.costMarkup')}
          value={`${
            breakdown.total_product_value > 0
              ? ((totalCosts / breakdown.total_product_value) * 100).toFixed(1)
              : '0'
          }%`}
          sublabel={t('landedCost.breakdown.costMarkupDesc')}
          variant="warning"
        />
      </div>

      {/* Cost Breakdown Visual */}
      <Card>
        <CardHeader
          title={t('landedCost.breakdown.costDistribution')}
          action={
            <div className="flex items-center gap-3">
              {/* Chart View Toggle */}
              <div className="flex items-center bg-muted rounded-md p-1">
                <button
                  onClick={() => setChartView('bar')}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    chartView === 'bar'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setChartView('pie')}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    chartView === 'pie'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                    />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => handleCalculate(true)}
                disabled={calculateMutation.isPending}
                className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t('landedCost.breakdown.recalculate')}
              </button>
            </div>
          }
        />
        <CardContent>
          {/* Strategy Info */}
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('landedCost.breakdown.strategy')}:</span>
            <span className="font-medium text-foreground">
              {breakdown.allocation_strategy
                ? strategyLabels[breakdown.allocation_strategy as AllocationStrategy]
                : 'Unknown'}
            </span>
            {breakdown.allocation_date && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span>
                  {t('landedCost.breakdown.calculatedAt')}:{' '}
                  {new Date(breakdown.allocation_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </>
            )}
          </div>

          {costCategories.length > 0 ? (
            <div className="space-y-4">
              {/* Chart visualization */}
              {chartView === 'bar' ? (
                /* Stacked Bar */
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {costCategories.map((cat) => (
                    <div
                      key={cat.key}
                      className={cn(cat.color, 'h-full transition-all relative group')}
                      style={{ width: `${cat.percentage}%` }}
                      title={`${cat.label}: ${formatCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)`}
                    >
                      {cat.percentage > 10 && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                          {cat.percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Pie Chart (CSS-based donut) */
                <div className="flex items-center justify-center gap-8">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {(() => {
                        let cumulativePercent = 0
                        return costCategories.map((cat) => {
                          const startPercent = cumulativePercent
                          cumulativePercent += cat.percentage
                          const strokeDasharray = `${cat.percentage} ${100 - cat.percentage}`
                          const strokeDashoffset = -startPercent
                          return (
                            <circle
                              key={cat.key}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="currentColor"
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className={cat.textColor}
                              pathLength="100"
                            />
                          )
                        })
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{formatCurrency(totalCosts)}</span>
                      <span className="text-xs text-muted-foreground">
                        {t('landedCost.breakdown.totalCosts')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {costCategories.map((cat) => (
                  <div key={cat.key} className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', cat.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                      <p className="text-sm font-medium">
                        {formatCurrency(cat.amount)}{' '}
                        <span className="text-xs text-muted-foreground">
                          ({formatPercent(cat.percentage)})
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {t('landedCost.breakdown.noCostsToDisplay')}
            </p>
          )}

          {/* Physical Metrics */}
          <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {t('landedCost.breakdown.totalWeight')}
              </p>
              <p className="text-sm font-medium">{formatNumber(breakdown.total_weight_kg, 'kg')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t('landedCost.breakdown.totalVolume')}
              </p>
              <p className="text-sm font-medium">
                {formatNumber(breakdown.total_volume_cbm, 'CBM', 3)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t('landedCost.breakdown.avgCostPerKg')}
              </p>
              <p className="text-sm font-medium">
                {breakdown.avg_cost_per_kg !== null && breakdown.avg_cost_per_kg !== undefined
                  ? formatCurrency(breakdown.avg_cost_per_kg)
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t('landedCost.breakdown.avgCostPerCbm')}
              </p>
              <p className="text-sm font-medium">
                {breakdown.avg_cost_per_cbm !== null && breakdown.avg_cost_per_cbm !== undefined
                  ? formatCurrency(breakdown.avg_cost_per_cbm)
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item-Level Breakdown Table */}
      <Card>
        <CardHeader
          title={t('landedCost.breakdown.itemBreakdown')}
          action={
            <button
              onClick={handleExportCSV}
              className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {t('landedCost.breakdown.exportBreakdown')}
            </button>
          }
        />
        <CardContent>
          {breakdown.items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('landedCost.breakdown.noItemsInLot')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      {t('landedCost.breakdown.item')}
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      {t('landedCost.breakdown.qty')}
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      {t('landedCost.breakdown.unitPrice')}
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      {t('landedCost.breakdown.productValue')}
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      {t('landedCost.breakdown.allocatedCosts')}
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      {t('landedCost.breakdown.allocationPercent')}
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      {t('landedCost.breakdown.totalLanded')}
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      {t('landedCost.breakdown.unitLandedCost')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.items.map((item) => (
                    <ItemRow
                      key={item.sli_id}
                      item={item}
                      totalAllocatedCost={totalAllocatedCost}
                    />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border font-medium">
                    <td className="py-3 px-2">{t('common.total')}</td>
                    <td className="text-right py-3 px-2">
                      {breakdown.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </td>
                    <td className="text-right py-3 px-2">-</td>
                    <td className="text-right py-3 px-2">
                      {formatCurrency(breakdown.total_product_value)}
                    </td>
                    <td className="text-right py-3 px-2">{formatCurrency(totalCosts)}</td>
                    <td className="text-right py-3 px-2">100%</td>
                    <td className="text-right py-3 px-2">
                      {formatCurrency(breakdown.total_landed_cost)}
                    </td>
                    <td className="text-right py-3 px-2">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Summary Card Component
function SummaryCard({
  label,
  value,
  sublabel,
  variant = 'default',
}: {
  label: string
  value: string
  sublabel?: string
  variant?: 'default' | 'info' | 'success' | 'warning'
}) {
  const variantStyles = {
    default: 'bg-card border-border',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  }

  const valueStyles = {
    default: 'text-foreground',
    info: 'text-blue-700 dark:text-blue-300',
    success: 'text-green-700 dark:text-green-300',
    warning: 'text-amber-700 dark:text-amber-300',
  }

  return (
    <div className={cn('rounded-lg border p-4', variantStyles[variant])}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-xl font-semibold', valueStyles[variant])}>{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
    </div>
  )
}

// Item Row Component with percentage column
function ItemRow({
  item,
  totalAllocatedCost,
}: {
  item: LandedCostBreakdownItem
  totalAllocatedCost: number
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const allocationPercent =
    totalAllocatedCost > 0 ? (item.total_allocated_cost / totalAllocatedCost) * 100 : 0

  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-2">
          <div className="flex items-center gap-2">
            <svg
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                expanded && 'rotate-90'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div>
              <p className="font-medium text-foreground">
                {item.description || item.sku || `Product #${item.product_id}`}
              </p>
              {item.sku && item.description && (
                <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
              )}
            </div>
          </div>
        </td>
        <td className="text-right py-3 px-2">{formatNumber(item.quantity, undefined, 0)}</td>
        <td className="text-right py-3 px-2">{formatCurrency(item.unit_price)}</td>
        <td className="text-right py-3 px-2">{formatCurrency(item.total_price)}</td>
        <td className="text-right py-3 px-2">{formatCurrency(item.total_allocated_cost)}</td>
        <td className="text-right py-3 px-2">
          <span className="inline-flex items-center">
            <span
              className="inline-block w-12 h-1.5 rounded-full bg-muted mr-2 overflow-hidden"
              title={`${allocationPercent.toFixed(1)}%`}
            >
              <span
                className="block h-full bg-primary rounded-full"
                style={{ width: `${Math.min(allocationPercent, 100)}%` }}
              />
            </span>
            {formatPercent(allocationPercent)}
          </span>
        </td>
        <td className="text-right py-3 px-2 font-medium">
          {formatCurrency(item.total_landed_cost)}
        </td>
        <td className="text-right py-3 px-2 font-medium text-primary">
          {item.landed_cost_per_unit !== null && item.landed_cost_per_unit !== undefined
            ? formatCurrency(item.landed_cost_per_unit)
            : '-'}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/30">
          <td colSpan={8} className="py-4 px-6">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('landedCost.freight')}</p>
                <p className="font-medium">{formatCurrency(item.allocated_freight)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('landedCost.customs')}</p>
                <p className="font-medium">{formatCurrency(item.allocated_customs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('landedCost.insurance')}</p>
                <p className="font-medium">{formatCurrency(item.allocated_insurance)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('landedCost.local')}</p>
                <p className="font-medium">{formatCurrency(item.allocated_local)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('landedCost.other')}</p>
                <p className="font-medium">{formatCurrency(item.allocated_other)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('landedCost.breakdown.weightVolume')}
                </p>
                <p className="font-medium">
                  {formatNumber(item.weight_kg, 'kg')} / {formatNumber(item.volume_cbm, 'CBM', 3)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('landedCost.breakdown.costMarkup')}
                </p>
                <p className="font-medium">
                  {item.total_price > 0
                    ? formatPercent((item.total_allocated_cost / item.total_price) * 100)
                    : '-'}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
