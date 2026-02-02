import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type { Client, ClientContact, ClientCreateDto, ClientUpdateDto, ClientSearchParams } from '@/types/client'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * Client API methods
 * Automatically switches between mock and real API based on VITE_USE_MOCK_API env variable
 */
export const clientsApi = {
  /**
   * Get paginated list of clients with optional filtering
   */
  async getAll(params: ClientSearchParams = {}): Promise<PagedResponse<Client>> {
    if (isMockEnabled()) {
      return mockHandlers.getClients(params)
    }

    const response = await apiClient.get<PagedResponse<Client>>('/clients', { params })
    return response.data
  },

  /**
   * Get a single client by ID
   */
  async getById(id: number): Promise<Client> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getClientById(id)
      return response.data
    }

    const response = await apiClient.get<Client>(`/clients/${id}`)
    return response.data
  },

  /**
   * Create a new client
   */
  async create(data: ClientCreateDto): Promise<Client> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createClient(data)
      return response.data
    }

    const response = await apiClient.post<Client>('/clients', data)
    return response.data
  },

  /**
   * Update an existing client
   */
  async update(data: ClientUpdateDto): Promise<Client> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateClient(data)
      return response.data
    }

    const response = await apiClient.put<Client>(`/clients/${data.id}`, data)
    return response.data
  },

  /**
   * Delete a client (soft delete)
   */
  async delete(id: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteClient(id)
      return
    }

    await apiClient.delete(`/clients/${id}`)
  },

  /**
   * Get contacts for a client
   */
  async getContacts(clientId: number): Promise<ClientContact[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getClientContacts(clientId)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<ClientContact[]>>(`/clients/${clientId}/contacts`)
    return response.data.data
  },

  /**
   * Create a new contact for a client
   */
  async createContact(
    clientId: number,
    contact: Omit<ClientContact, 'id' | 'clientId'>
  ): Promise<ClientContact> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createClientContact(clientId, contact)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<ClientContact>>(
      `/clients/${clientId}/contacts`,
      contact
    )
    return response.data.data
  },

  /**
   * Delete a client contact
   */
  async deleteContact(clientId: number, contactId: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteClientContact(contactId)
      return
    }

    await apiClient.delete(`/clients/${clientId}/contacts/${contactId}`)
  },

  /**
   * Export clients to CSV
   */
  async exportCSV(params: ClientSearchParams = {}): Promise<string> {
    if (isMockEnabled()) {
      return mockHandlers.exportClientsToCSV(params)
    }

    const response = await apiClient.get<string>('/clients/export', {
      params,
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },
}
