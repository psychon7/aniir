import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/layout/Card'
import type { AgingBucket } from '@/types/aging'

interface AgingBucketsDisplayProps {
  buckets: AgingBucket[]
  totalOutstanding?: number
  className?: string
  onBucketClick?: (bucket: AgingBucket) => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function AgingBucketsDisplay({
  buckets,
  className,
  onBucketClick,
}: AgingBucketsDisplayProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {buckets.map((bucket) => (
        <div
          key={bucket.label}
          onClick={() => onBucketClick?.(bucket)}
          className={cn(onBucketClick && 'cursor-pointer')}
          role={onBucketClick ? 'button' : undefined}
          tabIndex={onBucketClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onBucketClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onBucketClick(bucket)
            }
          }}
        >
          <Card
            variant="elevated"
            padding="md"
            className={cn(
              'relative overflow-hidden transition-all duration-200',
              onBucketClick && 'hover:shadow-lg hover:scale-[1.02]'
            )}
          >
            {/* Color accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: bucket.color }}
            />

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: bucket.color }}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {bucket.label}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-2xl font-semibold text-foreground">
                  {formatCurrency(bucket.amount)}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{bucket.percentage.toFixed(1)}%</span>
                  <span>{bucket.invoiceCount} invoice{bucket.invoiceCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Progress bar showing percentage of total */}
              <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${bucket.percentage}%`,
                    backgroundColor: bucket.color,
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}

interface AgingSummaryStatsProps {
  totalOutstanding: number
  invoiceCount: number
  clientCount: number
  className?: string
}

export function AgingSummaryStats({
  totalOutstanding,
  invoiceCount,
  clientCount,
  className,
}: AgingSummaryStatsProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      <Card variant="elevated" padding="md">
        <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
        <p className="text-2xl font-semibold text-foreground mt-1">
          {formatCurrency(totalOutstanding)}
        </p>
      </Card>
      <Card variant="elevated" padding="md">
        <p className="text-sm font-medium text-muted-foreground">Open Invoices</p>
        <p className="text-2xl font-semibold text-foreground mt-1">{invoiceCount}</p>
      </Card>
      <Card variant="elevated" padding="md">
        <p className="text-sm font-medium text-muted-foreground">Clients with Outstanding</p>
        <p className="text-2xl font-semibold text-foreground mt-1">{clientCount}</p>
      </Card>
    </div>
  )
}
