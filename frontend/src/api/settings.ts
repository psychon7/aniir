import apiClient from './client'

/**
 * Enterprise settings response from the backend (camelCase)
 */
export interface EnterpriseSettings {
  id: number
  companyName: string
  shortLabel: string | null
  currencyId: number
  languageId: number
  isActive: boolean
  address1: string | null
  address2: string | null
  postcode: string | null
  city: string | null
  county: string | null
  phone: string | null
  fax: string | null
  cellphone: string | null
  email: string | null
  website: string | null
  siret: string | null
  rcs: string | null
  vatIntra: string | null
  capital: string | null
  emailAuto: boolean | null
  maskCommission: boolean | null
  fullAddress: string | null
}

/**
 * Enterprise settings update DTO (snake_case for backend)
 */
export interface EnterpriseSettingsUpdateDto {
  soc_society_name?: string
  soc_short_label?: string
  soc_address1?: string
  soc_address2?: string
  soc_postcode?: string
  soc_city?: string
  soc_county?: string
  soc_tel?: string
  soc_fax?: string
  soc_cellphone?: string
  soc_email?: string
  soc_site?: string
  soc_siret?: string
  soc_rcs?: string
  soc_tva_intra?: string
  soc_capital?: string
  soc_email_auto?: boolean
  soc_mask_commission?: boolean
}

/**
 * Settings API methods
 */
export const settingsApi = {
  /**
   * Get the default enterprise settings
   */
  async getEnterprise(): Promise<EnterpriseSettings> {
    const response = await apiClient.get<EnterpriseSettings>('/settings/enterprise')
    return response.data
  },

  /**
   * Update enterprise settings
   */
  async updateEnterprise(id: number, data: EnterpriseSettingsUpdateDto): Promise<EnterpriseSettings> {
    const response = await apiClient.put<EnterpriseSettings>(`/settings/enterprise/${id}`, data)
    return response.data
  },

  /**
   * List all societies
   */
  async getSocieties(): Promise<EnterpriseSettings[]> {
    const response = await apiClient.get<EnterpriseSettings[]>('/settings/societies')
    return response.data
  },

  /**
   * Get a single society by ID
   */
  async getSociety(id: number): Promise<EnterpriseSettings> {
    const response = await apiClient.get<EnterpriseSettings>(`/settings/societies/${id}`)
    return response.data
  },
}
