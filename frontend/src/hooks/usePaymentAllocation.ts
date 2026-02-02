import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountingApi } from '@/api/accounting'
import { paymentKeys } from './usePayments'
import type { AllocatePaymentRequest } from '@/types/allocation'

// Query keys for allocation-related queries
export const allocationKeys = {
  all: ['allocations'] as const,
  payment: (paymentId: number) => [...allocationKeys.all, 'payment', paymentId] as const,
  invoices: (clientId: number) => [...allocationKeys.all, 'invoices', clientId] as const,
}

/**
 * Hook to fetch payment details for allocation
 */
export function usePaymentForAllocation(paymentId: number | null) {
  return useQuery({
    queryKey: allocationKeys.payment(paymentId ?? 0),
    queryFn: () => accountingApi.getPaymentForAllocation(paymentId!),
    enabled: !!paymentId,
  })
}

/**
 * Hook to fetch unpaid invoices for a client
 */
export function useClientUnpaidInvoices(clientId: number | null) {
  return useQuery({
    queryKey: allocationKeys.invoices(clientId ?? 0),
    queryFn: () => accountingApi.getClientUnpaidInvoices(clientId!),
    enabled: !!clientId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  })
}

/**
 * Hook to allocate payment to invoices
 */
export function useAllocatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, request }: { paymentId: number; request: AllocatePaymentRequest }) =>
      accountingApi.allocatePayment(paymentId, request),
    onSuccess: (result) => {
      // Invalidate payment queries to refresh data
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      // Invalidate allocation queries
      queryClient.invalidateQueries({ queryKey: allocationKeys.payment(result.paymentId) })
      // Invalidate invoice queries
      queryClient.invalidateQueries({ queryKey: allocationKeys.all })
    },
  })
}

/**
 * Hook to auto-allocate payment using FIFO
 */
export function useAutoAllocatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: number) => accountingApi.autoAllocatePayment(paymentId),
    onSuccess: (result) => {
      // Invalidate payment queries to refresh data
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      // Invalidate allocation queries
      queryClient.invalidateQueries({ queryKey: allocationKeys.payment(result.paymentId) })
      // Invalidate invoice queries
      queryClient.invalidateQueries({ queryKey: allocationKeys.all })
    },
  })
}
