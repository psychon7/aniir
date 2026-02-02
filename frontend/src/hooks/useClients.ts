import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '@/api/clients'
import type { ClientCreateDto, ClientUpdateDto, ClientSearchParams } from '@/types/client'

// Query keys
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (params: ClientSearchParams) => [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientKeys.details(), id] as const,
  contacts: (clientId: number) => [...clientKeys.detail(clientId), 'contacts'] as const,
}

/**
 * Hook to fetch paginated list of clients
 */
export function useClients(params: ClientSearchParams = {}) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => clientsApi.getAll(params),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  })
}

/**
 * Hook to fetch a single client by ID
 */
export function useClient(id: number) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch contacts for a client
 */
export function useClientContacts(clientId: number) {
  return useQuery({
    queryKey: clientKeys.contacts(clientId),
    queryFn: () => clientsApi.getContacts(clientId),
    enabled: !!clientId,
  })
}

/**
 * Hook to create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClientCreateDto) => clientsApi.create(data),
    onSuccess: () => {
      // Invalidate client list queries to refetch
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClientUpdateDto) => clientsApi.update(data),
    onSuccess: (updatedClient) => {
      // Update the specific client in cache
      queryClient.setQueryData(clientKeys.detail(updatedClient.id), updatedClient)
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Hook to delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => clientsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove the client from cache
      queryClient.removeQueries({ queryKey: clientKeys.detail(deletedId) })
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Hook to export clients to CSV
 */
export function useExportClients() {
  return useMutation({
    mutationFn: (params: ClientSearchParams = {}) => clientsApi.exportCSV(params),
    onSuccess: (csvData) => {
      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}
