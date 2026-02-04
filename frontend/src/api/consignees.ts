import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type { Consignee, ConsigneeCreateDto, ConsigneeUpdateDto, ConsigneeSearchParams } from '@/types/consignee'
import type { PagedResponse } from '@/types/api'

/**
 * Consignee API methods
 */
export const consigneesApi = {
  /**
   * Get paginated list of consignees with optional filtering
   */
  async getAll(params: ConsigneeSearchParams = {}): Promise<PagedResponse<Consignee>> {
    if (isMockEnabled()) {
      return mockHandlers.getConsignees(params)
    }

    const queryParams: Record<string, any> = {}
    if (params.search) queryParams.search = params.search
    if (params.soc_id) queryParams.soc_id = params.soc_id
    if (params.con_firstname) queryParams.con_firstname = params.con_firstname
    if (params.con_comment) queryParams.con_comment = params.con_comment
    if (params.con_email) queryParams.con_email = params.con_email
    if (params.con_postcode) queryParams.con_postcode = params.con_postcode
    if (params.con_city) queryParams.con_city = params.con_city
    if (params.con_address) queryParams.con_address = params.con_address
    if (params.con_company_name) queryParams.con_company_name = params.con_company_name
    if (params.con_tel) queryParams.con_tel = params.con_tel
    if (params.con_is_delivery_adr !== undefined) queryParams.con_is_delivery_adr = params.con_is_delivery_adr
    if (params.con_is_invoicing_adr !== undefined) queryParams.con_is_invoicing_adr = params.con_is_invoicing_adr
    if (params.page) queryParams.page = params.page
    if (params.pageSize) queryParams.pageSize = params.pageSize
    if (params.sort_by) queryParams.sort_by = params.sort_by
    if (params.sort_order) queryParams.sort_order = params.sort_order

    const response = await apiClient.get<PagedResponse<Consignee>>('/consignees', { params: queryParams })
    return response.data
  },

  /**
   * Get a single consignee by ID
   */
  async getById(id: number): Promise<Consignee> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getConsigneeById(id)
      return response.data
    }

    const response = await apiClient.get<Consignee>(`/consignees/${id}`)
    return response.data
  },

  /**
   * Create a new consignee
   */
  async create(data: ConsigneeCreateDto): Promise<Consignee> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createConsignee(data)
      return response.data
    }

    const response = await apiClient.post<Consignee>('/consignees', data)
    return response.data
  },

  /**
   * Update an existing consignee
   */
  async update(id: number, data: ConsigneeUpdateDto): Promise<Consignee> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateConsignee(id, data)
      return response.data
    }

    const response = await apiClient.put<Consignee>(`/consignees/${id}`, data)
    return response.data
  },

  /**
   * Delete a consignee
   */
  async delete(id: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteConsignee(id)
      return
    }

    await apiClient.delete(`/consignees/${id}`)
  },
}
