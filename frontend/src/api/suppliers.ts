import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type { Supplier, SupplierContact, SupplierCreateDto, SupplierUpdateDto, SupplierSearchParams } from '@/types/supplier'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * Supplier API methods
 * Automatically switches between mock and real API based on VITE_USE_MOCK_API env variable
 */
export const suppliersApi = {
  /**
   * Get paginated list of suppliers with optional filtering
   */
  async getAll(params: SupplierSearchParams = {}): Promise<PagedResponse<Supplier>> {
    if (isMockEnabled()) {
      return mockHandlers.getSuppliers(params)
    }

    const response = await apiClient.get<PagedResponse<Supplier>>('/suppliers', { params })
    return response.data
  },

  /**
   * Get a single supplier by ID
   */
  async getById(id: number): Promise<Supplier> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getSupplierById(id)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`)
    return response.data.data
  },

  /**
   * Create a new supplier
   */
  async create(data: SupplierCreateDto): Promise<Supplier> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createSupplier(data)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<Supplier>>('/suppliers', data)
    return response.data.data
  },

  /**
   * Update an existing supplier
   */
  async update(data: SupplierUpdateDto): Promise<Supplier> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateSupplier(data)
      return response.data
    }

    const response = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${data.id}`, data)
    return response.data.data
  },

  /**
   * Delete a supplier (soft delete)
   */
  async delete(id: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteSupplier(id)
      return
    }

    await apiClient.delete(`/suppliers/${id}`)
  },

  /**
   * Get contacts for a supplier
   */
  async getContacts(supplierId: number): Promise<SupplierContact[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getSupplierContacts(supplierId)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<SupplierContact[]>>(`/suppliers/${supplierId}/contacts`)
    return response.data.data
  },

  /**
   * Create a new contact for a supplier
   */
  async createContact(
    supplierId: number,
    contact: Omit<SupplierContact, 'id' | 'supplierId'>
  ): Promise<SupplierContact> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createSupplierContact(supplierId, contact)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<SupplierContact>>(
      `/suppliers/${supplierId}/contacts`,
      contact
    )
    return response.data.data
  },

  /**
   * Delete a supplier contact
   */
  async deleteContact(supplierId: number, contactId: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteSupplierContact(contactId)
      return
    }

    await apiClient.delete(`/suppliers/${supplierId}/contacts/${contactId}`)
  },

  /**
   * Export suppliers to CSV
   */
  async exportCSV(params: SupplierSearchParams = {}): Promise<string> {
    if (isMockEnabled()) {
      return mockHandlers.exportSuppliersToCSV(params)
    }

    const response = await apiClient.get<string>('/suppliers/export', {
      params,
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },
}
