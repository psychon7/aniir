import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface DataTableToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  actions?: React.ReactNode
  selectedCount?: number
  className?: string
}

export function DataTableToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
  selectedCount = 0,
  className,
}: DataTableToolbarProps) {
  const { t } = useTranslation()
  const placeholder = searchPlaceholder || t('common.search')

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {/* Left side: Search and Filters */}
      <div className="flex items-center gap-3 flex-1">
        {/* Search input */}
        {onSearchChange && (
          <div className="relative max-w-xs flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 border-0 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-secondary transition-all"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Filters */}
        {filters && <div className="flex items-center gap-2">{filters}</div>}

        {/* Selection indicator */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {selectedCount} {t('common.selected')}
          </div>
        )}
      </div>

      {/* Right side: Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
