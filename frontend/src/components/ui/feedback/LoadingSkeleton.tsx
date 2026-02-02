import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/50',
        className
      )}
    />
  )
}

interface LoadingSkeletonTextProps {
  lines?: number
  className?: string
}

export function LoadingSkeletonText({ lines = 3, className }: LoadingSkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && 'w-3/4' // Last line is shorter
          )}
        />
      ))}
    </div>
  )
}

interface LoadingSkeletonCardProps {
  className?: string
}

export function LoadingSkeletonCard({ className }: LoadingSkeletonCardProps) {
  return (
    <div className={cn('card-elevated p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <LoadingSkeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <LoadingSkeleton className="h-4 w-1/3" />
          <LoadingSkeleton className="h-3 w-1/4" />
        </div>
      </div>
      <LoadingSkeletonText lines={2} />
    </div>
  )
}

interface LoadingSkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function LoadingSkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: LoadingSkeletonTableProps) {
  return (
    <div className={cn('card-elevated overflow-hidden', className)}>
      <div className="divide-y divide-border">
        {/* Header */}
        <div className="flex gap-4 px-4 py-3 bg-muted/30">
          {Array.from({ length: columns }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <LoadingSkeleton
                key={colIndex}
                className={cn('h-4 flex-1', colIndex === 0 && 'w-1/4 flex-none')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
