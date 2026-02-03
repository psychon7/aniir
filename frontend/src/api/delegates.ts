/**
 * Client Delegates API client
 *
 * Provides functions for managing billing delegates for clients.
 */
import api from './client'
import type {
  ClientDelegate,
  ClientDelegateCreateDto,
  ClientDelegateUpdateDto,
  ClientDelegatePaginatedResponse,
} from '@/types/delegate'

// =============================================================================
// Client Delegates
// =============================================================================

export interface ListDelegatesParams {
  page?: number
  pageSize?: number
  activeOnly?: boolean
}

/**
 * Get all delegates for a client
 */
export async function getClientDelegates(
  clientId: number,
  params: ListDelegatesParams = {}
): Promise<ClientDelegatePaginatedResponse> {
  const { page = 1, pageSize = 20, activeOnly = true } = params
  const response = await api.get<ClientDelegatePaginatedResponse>(
    `/clients/${clientId}/delegates`,
    {
      params: { page, pageSize, active_only: activeOnly },
    }
  )
  return response.data
}

/**
 * Get a specific delegate
 */
export async function getClientDelegate(
  clientId: number,
  delegateId: number
): Promise<ClientDelegate> {
  const response = await api.get<ClientDelegate>(
    `/clients/${clientId}/delegates/${delegateId}`
  )
  return response.data
}

/**
 * Get the primary delegate for a client
 */
export async function getPrimaryDelegate(
  clientId: number
): Promise<ClientDelegate | null> {
  try {
    const response = await api.get<ClientDelegate>(
      `/clients/${clientId}/delegates/primary`
    )
    return response.data
  } catch (error: any) {
    // Return null if no primary delegate is set
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Create a new delegate for a client
 */
export async function createClientDelegate(
  clientId: number,
  data: ClientDelegateCreateDto
): Promise<ClientDelegate> {
  const response = await api.post<ClientDelegate>(
    `/clients/${clientId}/delegates`,
    data
  )
  return response.data
}

/**
 * Update an existing delegate
 */
export async function updateClientDelegate(
  clientId: number,
  delegateId: number,
  data: ClientDelegateUpdateDto
): Promise<ClientDelegate> {
  const response = await api.put<ClientDelegate>(
    `/clients/${clientId}/delegates/${delegateId}`,
    data
  )
  return response.data
}

/**
 * Delete a delegate
 */
export async function deleteClientDelegate(
  clientId: number,
  delegateId: number
): Promise<void> {
  await api.delete(`/clients/${clientId}/delegates/${delegateId}`)
}
