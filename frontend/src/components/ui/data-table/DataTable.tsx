import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { DataTablePagination } from './DataTablePagination'
import { DataTableToolbar } from './DataTableToolbar'
import { LoadingSkeleton } from '../feedback/LoadingSkeleton'
import { EmptyState } from '../feedback/EmptyState'

export interface Column<T> {
  id: string
  header: string | React.ReactNode
  accessorKey?: keyof T
  accessorFn?: (row: T) => React.ReactNode
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  isLoading?: boolean
  page?: number
  pageSize?: number
  totalCount?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  actions?: React.ReactNode
  onRowClick?: (row: T) => void
  selectedRows?: T[]
  onSelectionChange?: (rows: T[]) => void
  emptyMessage?: string
  emptyDescription?: string
  className?: string
}

export function DataTable<T extends object>({
  columns,
  data,
  keyField,
  isLoading = false,
  page = 1,
  pageSize = 10,
  totalCount = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder = 'asc',
  onSortChange,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  onRowClick,
  selectedRows = [],
  onSelectionChange,
  emptyMessage = 'No data found',
  emptyDescription = 'Try adjusting your search or filters',
  className,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<{ by: string; order: 'asc' | 'desc' }>({
    by: sortBy || '',
    order: sortOrder,
  })

  const currentSortBy = sortBy ?? localSort.by
  const currentSortOrder = sortOrder ?? localSort.order

  const handleSort = (columnId: string) => {
    const newOrder = currentSortBy === columnId && currentSortOrder === 'asc' ? 'desc' : 'asc'
    if (onSortChange) {
      onSortChange(columnId, newOrder)
    } else {
      setLocalSort({ by: columnId, order: newOrder })
    }
  }

  const isSelected = (row: T) => {
    const key = row[keyField]
    return selectedRows.some((r) => r[keyField] === key)
  }

  const toggleRowSelection = (row: T) => {
    if (!onSelectionChange) return

    const key = row[keyField]
    const newSelection = isSelected(row)
      ? selectedRows.filter((r) => r[keyField] !== key)
      : [...selectedRows, row]
    onSelectionChange(newSelection)
  }

  const toggleAllSelection = () => {
    if (!onSelectionChange) return

    if (selectedRows.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange([...data])
    }
  }

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (column.cell) {
      return column.cell(row)
    }
    if (column.accessorFn) {
      return column.accessorFn(row)
    }
    if (column.accessorKey) {
      return row[column.accessorKey] as React.ReactNode
    }
    return null
  }

  // Sort data locally if no server-side sorting
  const sortedData = useMemo(() => {
    if (!currentSortBy || onSortChange) return data

    const sortColumn = columns.find((c) => c.id === currentSortBy)
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aVal = sortColumn.accessorKey ? a[sortColumn.accessorKey] : null
      const bVal = sortColumn.accessorKey ? b[sortColumn.accessorKey] : null

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return currentSortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return currentSortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })
  }, [data, currentSortBy, currentSortOrder, columns, onSortChange])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      {(onSearchChange || filters || actions) && (
        <DataTableToolbar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          actions={actions}
          selectedCount={selectedRows.length}
        />
      )}

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-refined w-full">
            <thead>
              <tr>
                {/* Selection checkbox */}
                {onSelectionChange && (
                  <th className="w-12 px-4">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selectedRows.length === data.length}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                    />
                  </th>
                )}

                {/* Column headers */}
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      column.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                      column.headerClassName
                    )}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && (
                        <span className="text-muted-foreground/50">
                          {currentSortBy === column.id ? (
                            currentSortOrder === 'asc' ? (
                              <SortAscIcon className="w-4 h-4" />
                            ) : (
                              <SortDescIcon className="w-4 h-4" />
                            )
                          ) : (
                            <SortIcon className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i}>
                    {onSelectionChange && (
                      <td className="px-4">
                        <LoadingSkeleton className="w-4 h-4" />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.id} className={column.className}>
                        <LoadingSkeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                    className="py-12"
                  >
                    <EmptyState message={emptyMessage} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                // Data rows
                sortedData.map((row) => (
                  <tr
                    key={String(row[keyField])}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      isSelected(row) && 'bg-primary/5'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {onSelectionChange && (
                      <td
                        className="px-4"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRowSelection(row)
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected(row)}
                          onChange={() => toggleRowSelection(row)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.id} className={column.className}>
                        {getCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}

// Sort icons
function SortIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  )
}

function SortAscIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  )
}

function SortDescIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
