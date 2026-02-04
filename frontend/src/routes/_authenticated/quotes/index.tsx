import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { DataTable, Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/Badge'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useToast } from '@/components/ui/feedback/Toast'
import { useQuotes, useDeleteQuote } from '@/hooks/useQuotes'
import type { QuoteListItem, QuoteSearchParams } from '@/types/quote'

export const Route = createFileRoute('/_authenticated/quotes/')({
  component: QuotesPage,
})

function QuotesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [searchParams, setSearchParams] = useState<QuoteSearchParams>({
    page: 1,
    pageSize: 10,
  })

  const [deletingQuote, setDeletingQuote] = useState<QuoteListItem | null>(null)

  // Data fetching with hooks
  const { data: quotesData, isLoading } = useQuotes(searchParams)
  const deleteMutation = useDeleteQuote()

  const handleSearch = (search: string) => {
    setSearchParams((prev) => ({ ...prev, search, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, pageSize, page: 1 }))
  }

  const handleSortChange = (_sortBy: string, _sortOrder: 'asc' | 'desc') => {
    // Quote API doesn't support sorting in params, ignore for now
  }

  const handleRowClick = (quote: QuoteListItem) => {
    navigate({ to: '/quotes/$quoteId' as any, params: { quoteId: String(quote.id) } })
  }

  const handleConfirmDelete = async () => {
    if (!deletingQuote) return
    try {
      await deleteMutation.mutateAsync(deletingQuote.id)
      success(t('quotes.deleteSuccess'), t('quotes.deleteSuccessMessage'))
      setDeletingQuote(null)
    } catch {
      showError(t('common.error'), t('quotes.deleteError'))
    }
  }

  const columns = useMemo<Column<QuoteListItem>[]>(
    () => [
      {
        id: 'reference',
        header: t('quotes.reference'),
        accessorKey: 'reference',
        sortable: false,
        cell: (row) => (
          <span className="font-mono text-sm text-muted-foreground">{row.reference}</span>
        ),
      },
      {
        id: 'clientName',
        header: t('quotes.client'),
        accessorKey: 'clientName',
        sortable: false,
        cell: (row) => <span className="font-medium">{row.clientName}</span>,
      },
      {
        id: 'quoteDate',
        header: t('quotes.date'),
        accessorKey: 'quoteDate',
        sortable: false,
        cell: (row) => new Date(row.quoteDate).toLocaleDateString(),
      },
      {
        id: 'validUntil',
        header: t('quotes.validUntil'),
        accessorKey: 'validUntil',
        sortable: false,
        cell: (row) => {
          if (!row.validUntil) return '-'
          const date = new Date(row.validUntil)
          const isExpired = date < new Date()
          return (
            <span className={isExpired ? 'text-destructive' : ''}>
              {date.toLocaleDateString()}
            </span>
          )
        },
      },
      {
        id: 'totalAmount',
        header: t('quotes.amount'),
        accessorKey: 'totalAmount',
        sortable: false,
        cell: (row) => (
          <span className="font-medium">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(row.totalAmount || 0)}
          </span>
        ),
      },
      {
        id: 'statusName',
        header: t('quotes.status'),
        accessorKey: 'statusName',
        sortable: false,
        cell: (row) => <StatusBadge status={row.statusName || 'Draft'} />,
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: '/quotes/$quoteId' as any, params: { quoteId: String(row.cplId) } })
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('common.view')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeletingQuote(row)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('common.delete')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ),
        className: 'w-24',
      },
    ],
    [navigate, t]
  )

  const actions = (
    <button
      onClick={() => navigate({ to: '/quotes/new' as any })}
      className="btn-primary"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
      {t('quotes.newQuote')}
    </button>
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('quotes.title')}
        description={t('quotes.manageDescription')}
        actions={actions}
      />

      <DataTable
        columns={columns}
        data={quotesData?.data || []}
        keyField="cplId"
        isLoading={isLoading}
        page={searchParams.page || 1}
        pageSize={searchParams.pageSize || 10}
        totalCount={quotesData?.totalCount || 0}
        totalPages={quotesData?.totalPages || 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        searchValue={searchParams.search}
        onSearchChange={handleSearch}
        searchPlaceholder={t('quotes.searchPlaceholder')}
        onRowClick={handleRowClick}
        emptyMessage={t('quotes.noQuotesFound')}
        emptyDescription={t('quotes.createFirst')}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingQuote}
        onClose={() => setDeletingQuote(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingQuote?.reference || 'this quote'}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
