import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  message: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  message,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {/* Icon */}
      {icon || (
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}

      {/* Message */}
      <h3 className="text-lg font-medium text-foreground mb-1">{message}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          {description}
        </p>
      )}

      {/* Action */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// Pre-built empty states for common scenarios
export function EmptyStateNoResults({
  onClearFilters,
}: {
  onClearFilters?: () => void
}) {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      }
      message="No results found"
      description="Try adjusting your search or filter criteria"
      action={
        onClearFilters && (
          <button onClick={onClearFilters} className="btn-secondary">
            Clear filters
          </button>
        )
      }
    />
  )
}

export function EmptyStateNoData({
  entityName = 'items',
  onAdd,
}: {
  entityName?: string
  onAdd?: () => void
}) {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
      }
      message={`No ${entityName} yet`}
      description={`Get started by creating your first ${entityName.replace(/s$/, '')}`}
      action={
        onAdd && (
          <button onClick={onAdd} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add {entityName.replace(/s$/, '')}
          </button>
        )
      }
    />
  )
}

export function EmptyStateError({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      }
      message={message}
      description="Please try again or contact support if the problem persists"
      action={
        onRetry && (
          <button onClick={onRetry} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try again
          </button>
        )
      }
    />
  )
}
