import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from '@/api/suppliers'
import { lookupsApi } from '@/api/lookups'
import type { SupplierCreateDto, SupplierUpdateDto, SupplierSearchParams } from '@/types/supplier'

// Query keys
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (params: SupplierSearchParams) => [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: number) => [...supplierKeys.details(), id] as const,
  contacts: (supplierId: number) => [...supplierKeys.detail(supplierId), 'contacts'] as const,
}

/**
 * Hook to fetch paginated list of suppliers
 */
export function useSuppliers(params: SupplierSearchParams = {}) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => suppliersApi.getAll(params),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  })
}

/**
 * Hook to fetch a single supplier by ID
 */
export function useSupplier(id: number) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => suppliersApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch contacts for a supplier
 */
export function useSupplierContacts(supplierId: number) {
  return useQuery({
    queryKey: supplierKeys.contacts(supplierId),
    queryFn: () => suppliersApi.getContacts(supplierId),
    enabled: !!supplierId,
  })
}

/**
 * Hook to create a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SupplierCreateDto) => suppliersApi.create(data),
    onSuccess: () => {
      // Invalidate supplier list queries to refetch
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SupplierUpdateDto) => suppliersApi.update(data),
    onSuccess: (updatedSupplier) => {
      // Update the specific supplier in cache
      queryClient.setQueryData(supplierKeys.detail(updatedSupplier.id), updatedSupplier)
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
  })
}

/**
 * Hook to delete a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => suppliersApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove the supplier from cache
      queryClient.removeQueries({ queryKey: supplierKeys.detail(deletedId) })
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
  })
}

/**
 * Hook to export suppliers to CSV
 */
export function useExportSuppliers() {
  return useMutation({
    mutationFn: (params: SupplierSearchParams = {}) => suppliersApi.exportCSV(params),
    onSuccess: (csvData) => {
      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `suppliers-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  })
}

/**
 * Hook to fetch supplier types lookup
 */
export function useSupplierTypes() {
  return useQuery({
    queryKey: ['lookups', 'supplierTypes'],
    queryFn: lookupsApi.getSupplierTypes,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
