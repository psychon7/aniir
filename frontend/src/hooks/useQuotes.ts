import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quotesApi } from '@/api/quotes'
import type {
  QuoteSearchParams,
  QuoteCreateDto,
  QuoteUpdateDto,
  QuoteLineCreateDto,
  QuoteLineUpdateDto,
  QuoteStatusChangeRequest,
  QuoteDiscountRequest,
  QuoteCommercialRequest,
  QuoteDuplicateRequest,
  QuoteConvertRequest,
} from '@/types/quote'

// Query keys factory
export const quoteKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteKeys.all, 'list'] as const,
  list: (params: QuoteSearchParams) => [...quoteKeys.lists(), params] as const,
  details: () => [...quoteKeys.all, 'detail'] as const,
  detail: (id: number) => [...quoteKeys.details(), id] as const,
  lines: (quoteId: number) => [...quoteKeys.detail(quoteId), 'lines'] as const,
  summary: (id: number) => [...quoteKeys.detail(id), 'summary'] as const,
  byProject: (projectId: number) => [...quoteKeys.all, 'by-project', projectId] as const,
  inProgress: () => [...quoteKeys.all, 'in-progress'] as const,
  recentInProgress: () => [...quoteKeys.all, 'recent-in-progress'] as const,
}

// Common options for entity list queries (moderate caching to reduce API calls)
const listQueryOptions = {
  staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  refetchOnWindowFocus: false, // Don't refetch when switching browser tabs
}

/**
 * Hook to fetch paginated list of quotes
 */
export function useQuotes(params: QuoteSearchParams = {}) {
  return useQuery({
    queryKey: quoteKeys.list(params),
    queryFn: () => quotesApi.getAll(params),
    ...listQueryOptions,
  })
}

/**
 * Hook to fetch a single quote by ID
 */
export function useQuote(id: number) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: () => quotesApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch quote lines
 */
export function useQuoteLines(quoteId: number) {
  return useQuery({
    queryKey: quoteKeys.lines(quoteId),
    queryFn: () => quotesApi.getLines(quoteId),
    enabled: !!quoteId,
  })
}

/**
 * Hook to fetch quote summary
 */
export function useQuoteSummary(id: number) {
  return useQuery({
    queryKey: quoteKeys.summary(id),
    queryFn: () => quotesApi.getSummary(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch quotes by project
 */
export function useQuotesByProject(projectId: number) {
  return useQuery({
    queryKey: quoteKeys.byProject(projectId),
    queryFn: () => quotesApi.getByProject(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook to fetch quotes in progress
 */
export function useQuotesInProgress() {
  return useQuery({
    queryKey: quoteKeys.inProgress(),
    queryFn: () => quotesApi.getInProgress(),
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to fetch recent quotes in progress
 */
export function useRecentQuotesInProgress() {
  return useQuery({
    queryKey: quoteKeys.recentInProgress(),
    queryFn: () => quotesApi.getRecentInProgress(),
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to create a new quote
 */
export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: QuoteCreateDto) => quotesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: quoteKeys.inProgress() })
    },
  })
}

/**
 * Hook to update an existing quote
 */
export function useUpdateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuoteUpdateDto }) =>
      quotesApi.update(id, data),
    onSuccess: (updatedQuote) => {
      queryClient.setQueryData(quoteKeys.detail(updatedQuote.id), updatedQuote)
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
    },
  })
}

/**
 * Hook to delete a quote
 */
export function useDeleteQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => quotesApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: quoteKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
    },
  })
}

/**
 * Hook to duplicate a quote
 */
export function useDuplicateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request?: QuoteDuplicateRequest }) =>
      quotesApi.duplicate(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
    },
  })
}

/**
 * Hook to convert quote to order
 */
export function useConvertQuoteToOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request?: QuoteConvertRequest }) =>
      quotesApi.convertToOrder(id, request),
    onSuccess: (_, variables) => {
      const quoteId = variables.id
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(quoteId) })
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/**
 * Hook to change status of quotes
 */
export function useChangeQuoteStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: QuoteStatusChangeRequest) => quotesApi.changeStatus(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: quoteKeys.inProgress() })
    },
  })
}

/**
 * Hook to update quote discount
 */
export function useUpdateQuoteDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: QuoteDiscountRequest }) =>
      quotesApi.updateDiscount(id, request),
    onSuccess: (updatedQuote) => {
      queryClient.setQueryData(quoteKeys.detail(updatedQuote.id), updatedQuote)
      queryClient.invalidateQueries({ queryKey: quoteKeys.summary(updatedQuote.id) })
    },
  })
}

// ==================== Quote Lines Mutations ====================

/**
 * Hook to add a line to a quote
 */
export function useAddQuoteLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, data }: { quoteId: number; data: QuoteLineCreateDto }) =>
      quotesApi.addLine(quoteId, data),
    onSuccess: (_, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lines(quoteId) })
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(quoteId) })
      queryClient.invalidateQueries({ queryKey: quoteKeys.summary(quoteId) })
    },
  })
}

/**
 * Hook to update a quote line
 */
export function useUpdateQuoteLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      quoteId,
      lineId,
      data,
    }: {
      quoteId: number
      lineId: number
      data: QuoteLineUpdateDto
    }) => quotesApi.updateLine(quoteId, lineId, data),
    onSuccess: (_, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lines(quoteId) })
      queryClient.invalidateQueries({ queryKey: quoteKeys.summary(quoteId) })
    },
  })
}

/**
 * Hook to delete a quote line
 */
export function useDeleteQuoteLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, lineId }: { quoteId: number; lineId: number }) =>
      quotesApi.deleteLine(quoteId, lineId),
    onSuccess: (_, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lines(quoteId) })
      queryClient.invalidateQueries({ queryKey: quoteKeys.summary(quoteId) })
    },
  })
}

// ==================== PDF & Send Hooks ====================

/**
 * Hook to download quote PDF
 */
export function useDownloadQuotePdf() {
  return useMutation({
    mutationFn: (id: number) => quotesApi.downloadPdf(id),
    onSuccess: (blob, quoteId) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `quote-${quoteId}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}

/**
 * Hook to send quote via email
 */
export function useSendQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      toEmail,
      subject,
      body,
      cc,
    }: {
      id: number
      toEmail: string
      subject?: string
      body?: string
      cc?: string
    }) => quotesApi.send(id, toEmail, subject, body, cc),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
    },
  })
}

/**
 * Hook to duplicate a quote line
 */
export function useDuplicateQuoteLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, lineId }: { quoteId: number; lineId: number }) =>
      quotesApi.duplicateLine(quoteId, lineId),
    onSuccess: (_, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lines(quoteId) })
      queryClient.invalidateQueries({ queryKey: quoteKeys.summary(quoteId) })
    },
  })
}
