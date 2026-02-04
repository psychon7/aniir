import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type { KeyValue, ApiResponse, Carrier } from '@/types/api'

/**
 * Lookup/Reference data API methods
 * These are used to populate dropdowns and select fields
 */
export const lookupsApi = {
  async getCountries(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getCountries()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/countries')
    return response.data.data
  },

  async getCurrencies(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getCurrencies()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/currencies')
    return response.data.data
  },

  async getVatRates(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getVatRates()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/vat-rates')
    return response.data.data
  },

  async getPaymentModes(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getPaymentModes()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/payment-modes')
    return response.data.data
  },

  async getPaymentTerms(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getPaymentTerms()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/payment-terms')
    return response.data.data
  },

  async getClientTypes(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getClientTypes()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/client-types')
    return response.data.data
  },

  async getClientStatuses(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getClientStatuses()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/client-statuses')
    return response.data.data
  },

  async getBusinessUnits(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getBusinessUnits()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/business-units')
    return response.data.data
  },

  async getLanguages(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getLanguages()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/languages')
    return response.data.data
  },

  async getCivilities(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getCivilities()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/civilities')
    return response.data.data
  },

  async getSocieties(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getSocieties()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/societies')
    return response.data.data
  },

  async getProductCategories(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getProductCategories()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/categories')
    return response.data.data
  },

  async getOrderStatuses(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getOrderStatuses()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/order-statuses')
    return response.data.data
  },

  async getInvoiceStatuses(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getInvoiceStatuses()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/invoice-statuses')
    return response.data.data
  },

  async getPaymentStatuses(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getPaymentStatuses()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/payment-statuses')
    return response.data.data
  },

  async getUnitsOfMeasure(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getUnitsOfMeasure()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/units-of-measure')
    return response.data.data
  },

  // Carrier methods
  async getCarriers(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getCarriers()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/carriers')
    return response.data.data
  },

  async getActiveCarriers(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getActiveCarriers()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/carriers/active')
    return response.data.data
  },

  async getSupplierTypes(): Promise<KeyValue[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getSupplierTypes()
      return response.data
    }
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/lookup/supplier-types')
    return response.data.data
  },

  async getCarrierById(id: number): Promise<Carrier> {
    const response = await apiClient.get<ApiResponse<Carrier>>(`/lookup/carriers/${id}`)
    return response.data.data
  },

  async createCarrier(carrier: Omit<Carrier, 'id' | 'socId'>): Promise<Carrier> {
    const response = await apiClient.post<ApiResponse<Carrier>>('/lookup/carriers', carrier)
    return response.data.data
  },

  async updateCarrier(id: number, carrier: Omit<Carrier, 'id' | 'socId'>): Promise<Carrier> {
    const response = await apiClient.put<ApiResponse<Carrier>>(`/lookup/carriers/${id}`, carrier)
    return response.data.data
  },

  async deleteCarrier(id: number): Promise<void> {
    await apiClient.delete(`/lookup/carriers/${id}`)
  },

  /**
   * Get all lookups in a single request (efficient for initial load)
   */
  async getAll(): Promise<{
    countries: KeyValue[]
    currencies: KeyValue[]
    vatRates: KeyValue[]
    paymentModes: KeyValue[]
    paymentTerms: KeyValue[]
    clientTypes: KeyValue[]
    clientStatuses: KeyValue[]
    businessUnits: KeyValue[]
    languages: KeyValue[]
    civilities: KeyValue[]
    societies: KeyValue[]
    productCategories: KeyValue[]
    orderStatuses: KeyValue[]
    invoiceStatuses: KeyValue[]
    unitsOfMeasure: KeyValue[]
  }> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getAllLookups()
      return response.data
    }
    const response = await apiClient.get<
      ApiResponse<{
        countries: KeyValue[]
        currencies: KeyValue[]
        vatRates: KeyValue[]
        paymentModes: KeyValue[]
        paymentTerms: KeyValue[]
        clientTypes: KeyValue[]
        clientStatuses: KeyValue[]
        businessUnits: KeyValue[]
        languages: KeyValue[]
        civilities: KeyValue[]
        societies: KeyValue[]
        productCategories: KeyValue[]
        orderStatuses: KeyValue[]
        invoiceStatuses: KeyValue[]
        unitsOfMeasure: KeyValue[]
      }>
    >('/lookup/all')
    return response.data.data
  },
}
