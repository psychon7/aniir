import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'
  | 'led' | 'domotics' | 'hvac' | 'waveconcept' | 'accessories'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    error: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    outline: 'border border-border text-muted-foreground bg-transparent',
    // Business Unit Colors
    led: 'bg-led/10 text-led dark:bg-led/20 dark:text-blue-400',
    domotics: 'bg-domotics/10 text-domotics dark:bg-domotics/20 dark:text-pink-400',
    hvac: 'bg-hvac/10 text-hvac dark:bg-hvac/20 dark:text-emerald-400',
    waveconcept: 'bg-waveconcept/10 text-waveconcept dark:bg-waveconcept/20 dark:text-orange-400',
    accessories: 'bg-accessories/10 text-accessories dark:bg-accessories/20 dark:text-purple-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// Status badge helper that maps status names to variants
const statusVariantMap: Record<string, BadgeVariant> = {
  active: 'success',
  inactive: 'error',
  prospect: 'info',
  suspended: 'error',
  draft: 'outline',
  confirmed: 'info',
  processing: 'warning',
  ready: 'success',
  partial: 'warning',
  delivered: 'success',
  invoiced: 'success',
  sent: 'info',
  paid: 'success',
  overdue: 'error',
  cancelled: 'error',
  // Shopify statuses
  error: 'error',
  pending: 'warning',
  disconnected: 'error',
  // Sync statuses
  started: 'warning',
  completed: 'success',
  failed: 'error',
  success: 'success',
  // Email statuses (delivered already above)
  bounced: 'error',
  queued: 'info',
  // Generic
  enabled: 'success',
  disabled: 'default',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Handle undefined/null status gracefully
  if (!status) {
    return (
      <Badge variant="default" className={className}>
        -
      </Badge>
    )
  }

  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '')
  const variant = statusVariantMap[normalizedStatus] || 'default'

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  )
}

// Business Unit badge helper that maps unit names to color variants
const businessUnitVariantMap: Record<string, BadgeVariant> = {
  'led': 'led',
  'led division': 'led',
  'domotics': 'domotics',
  'hvac': 'hvac',
  'wave concept': 'waveconcept',
  'waveconcept': 'waveconcept',
  'accessories': 'accessories',
}

interface BusinessUnitBadgeProps {
  unit: string
  className?: string
}

export function BusinessUnitBadge({ unit, className }: BusinessUnitBadgeProps) {
  const normalizedUnit = unit.toLowerCase().trim()
  const variant = businessUnitVariantMap[normalizedUnit] || 'default'

  return (
    <Badge variant={variant} className={className}>
      {unit}
    </Badge>
  )
}
