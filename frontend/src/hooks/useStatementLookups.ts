import { useQuery } from '@tanstack/react-query'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import apiClient from '@/api/client'
import type { KeyValue } from '@/types/api'

// Query keys
export const statementLookupKeys = {
  all: ['statementLookups'] as const,
  statuses: () => [...statementLookupKeys.all, 'statuses'] as const,
  types: () => [...statementLookupKeys.all, 'types'] as const,
}

// Common options for lookup queries (long stale time since lookups rarely change)
const lookupQueryOptions = {
  staleTime: 10 * 60 * 1000, // 10 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
}

async function getStatementStatuses(): Promise<KeyValue[]> {
  if (isMockEnabled()) {
    const response = await mockHandlers.getStatementStatuses()
    return response.data
  }
  const response = await apiClient.get<{ success: boolean; data: KeyValue[] }>('/lookups/statement-statuses')
  return response.data.data
}

async function getStatementTypes(): Promise<KeyValue[]> {
  if (isMockEnabled()) {
    const response = await mockHandlers.getStatementTypes()
    return response.data
  }
  const response = await apiClient.get<{ success: boolean; data: KeyValue[] }>('/lookups/statement-types')
  return response.data.data
}

export function useStatementStatuses() {
  return useQuery({
    queryKey: statementLookupKeys.statuses(),
    queryFn: getStatementStatuses,
    ...lookupQueryOptions,
  })
}

export function useStatementTypes() {
  return useQuery({
    queryKey: statementLookupKeys.types(),
    queryFn: getStatementTypes,
    ...lookupQueryOptions,
  })
}
