import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface DataTablePaginationProps {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function DataTablePagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: DataTablePaginationProps) {
  const { t } = useTranslation()
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalCount)

  const canGoPrevious = page > 1
  const canGoNext = page < totalPages

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const delta = 1 // Number of pages to show on each side of current page

    // Always show first page
    pages.push(1)

    // Calculate range around current page
    const rangeStart = Math.max(2, page - delta)
    const rangeEnd = Math.min(totalPages - 1, page + delta)

    // Add ellipsis before range if needed
    if (rangeStart > 2) {
      pages.push('ellipsis')
    }

    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i)
    }

    // Add ellipsis after range if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('ellipsis')
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-2 py-3',
        className
      )}
    >
      {/* Info */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {t('table.showing')} <span className="font-medium text-foreground">{startItem}</span> {t('common.to')}{' '}
          <span className="font-medium text-foreground">{endItem}</span> {t('table.of')}{' '}
          <span className="font-medium text-foreground">{totalCount}</span> {t('table.results')}
        </p>

        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('table.rowsPerPage')}:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 px-2 py-1 text-sm bg-secondary border-0 rounded-md text-foreground focus:ring-2 focus:ring-primary/20"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange?.(1)}
          disabled={!canGoPrevious}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={t('table.firstPage')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange?.(page - 1)}
          disabled={!canGoPrevious}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={t('table.previousPage')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((pageNum, idx) =>
            pageNum === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange?.(pageNum)}
                className={cn(
                  'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                  pageNum === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange?.(page + 1)}
          disabled={!canGoNext}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={t('table.nextPage')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange?.(totalPages)}
          disabled={!canGoNext}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={t('table.lastPage')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
