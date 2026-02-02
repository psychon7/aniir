import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/api/payments'
import type { PaymentCreateDto, PaymentUpdateDto, PaymentSearchParams } from '@/types/payment'

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params: PaymentSearchParams) => [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: number) => [...paymentKeys.details(), id] as const,
}

/**
 * Hook to fetch paginated list of payments
 */
export function usePayments(params: PaymentSearchParams = {}) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsApi.getAll(params),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  })
}

/**
 * Hook to fetch a single payment by ID
 */
export function usePayment(id: number) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new payment
 */
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PaymentCreateDto) => paymentsApi.create(data),
    onSuccess: () => {
      // Invalidate payment list queries to refetch
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing payment
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PaymentUpdateDto) => paymentsApi.update(data),
    onSuccess: (updatedPayment) => {
      // Update the specific payment in cache
      queryClient.setQueryData(paymentKeys.detail(updatedPayment.id), updatedPayment)
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
    },
  })
}

/**
 * Hook to delete a payment
 */
export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => paymentsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove the payment from cache
      queryClient.removeQueries({ queryKey: paymentKeys.detail(deletedId) })
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
    },
  })
}

/**
 * Hook to export payments to CSV
 */
export function useExportPayments() {
  return useMutation({
    mutationFn: (params: PaymentSearchParams = {}) => paymentsApi.exportCSV(params),
    onSuccess: (csvData) => {
      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `payments-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}
