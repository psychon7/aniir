/**
 * React Query hooks for Client Delegates
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClientDelegates,
  getClientDelegate,
  getPrimaryDelegate,
  createClientDelegate,
  updateClientDelegate,
  deleteClientDelegate,
  type ListDelegatesParams,
} from '@/api/delegates'
import type {
  ClientDelegateCreateDto,
  ClientDelegateUpdateDto,
} from '@/types/delegate'

// =============================================================================
// Query Keys
// =============================================================================

export const delegateKeys = {
  all: ['delegates'] as const,
  lists: () => [...delegateKeys.all, 'list'] as const,
  list: (clientId: number, params?: ListDelegatesParams) =>
    [...delegateKeys.lists(), clientId, params] as const,
  details: () => [...delegateKeys.all, 'detail'] as const,
  detail: (clientId: number, delegateId: number) =>
    [...delegateKeys.details(), clientId, delegateId] as const,
  primary: (clientId: number) =>
    [...delegateKeys.all, 'primary', clientId] as const,
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Get paginated list of delegates for a client
 */
export function useClientDelegates(
  clientId: number,
  params: ListDelegatesParams = {}
) {
  return useQuery({
    queryKey: delegateKeys.list(clientId, params),
    queryFn: () => getClientDelegates(clientId, params),
    enabled: clientId > 0,
  })
}

/**
 * Get a specific delegate
 */
export function useClientDelegate(clientId: number, delegateId: number) {
  return useQuery({
    queryKey: delegateKeys.detail(clientId, delegateId),
    queryFn: () => getClientDelegate(clientId, delegateId),
    enabled: clientId > 0 && delegateId > 0,
  })
}

/**
 * Get the primary delegate for a client
 */
export function usePrimaryDelegate(clientId: number) {
  return useQuery({
    queryKey: delegateKeys.primary(clientId),
    queryFn: () => getPrimaryDelegate(clientId),
    enabled: clientId > 0,
  })
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new delegate
 */
export function useCreateClientDelegate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: number
      data: ClientDelegateCreateDto
    }) => createClientDelegate(clientId, data),
    onSuccess: (_, variables) => {
      // Invalidate delegate list and primary delegate queries
      queryClient.invalidateQueries({
        queryKey: delegateKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: delegateKeys.primary(variables.clientId),
      })
    },
  })
}

/**
 * Update an existing delegate
 */
export function useUpdateClientDelegate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      delegateId,
      data,
    }: {
      clientId: number
      delegateId: number
      data: ClientDelegateUpdateDto
    }) => updateClientDelegate(clientId, delegateId, data),
    onSuccess: (_, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({
        queryKey: delegateKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: delegateKeys.detail(variables.clientId, variables.delegateId),
      })
      queryClient.invalidateQueries({
        queryKey: delegateKeys.primary(variables.clientId),
      })
    },
  })
}

/**
 * Delete a delegate
 */
export function useDeleteClientDelegate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      delegateId,
    }: {
      clientId: number
      delegateId: number
    }) => deleteClientDelegate(clientId, delegateId),
    onSuccess: (_, variables) => {
      // Invalidate delegate list and primary delegate queries
      queryClient.invalidateQueries({
        queryKey: delegateKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: delegateKeys.primary(variables.clientId),
      })
    },
  })
}
