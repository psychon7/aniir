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
  ribName: string | null
  ribAddress: string | null
  ribIban: string | null
  ribBic: string | null
  ribBankCode: string | null
  ribAgencyCode: string | null
  ribAccountNumber: string | null
  ribKey: string | null
  ribDomiciliationAgency: string | null
  ribAbbreviation: string | null
  ribName2: string | null
  ribAddress2: string | null
  ribIban2: string | null
  ribBic2: string | null
  ribBankCode2: string | null
  ribAgencyCode2: string | null
  ribAccountNumber2: string | null
  ribKey2: string | null
  ribDomiciliationAgency2: string | null
  ribAbbreviation2: string | null
  quoteHeaderText: string | null
  quoteFooterText: string | null
  deliveryConditionsText: string | null
  invoicePenaltyText: string | null
  invoiceEarlyPaymentDiscountText: string | null
  invoiceEmailBody: string | null
  pricingCoefficientSodCin: number | null
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
  soc_rib_name?: string
  soc_rib_address?: string
  soc_rib_code_iban?: string
  soc_rib_code_bic?: string
  soc_rib_bank_code?: string
  soc_rib_agence_code?: string
  soc_rib_account_number?: string
  soc_rib_key?: string
  soc_rib_domiciliation_agency?: string
  soc_rib_abbre?: string
  soc_rib_name_2?: string
  soc_rib_address_2?: string
  soc_rib_code_iban_2?: string
  soc_rib_code_bic_2?: string
  soc_rib_bank_code_2?: string
  soc_rib_agence_code_2?: string
  soc_rib_account_number_2?: string
  soc_rib_key_2?: string
  soc_rib_domiciliation_agency_2?: string
  soc_rib_abbre_2?: string
  soc_quote_header_text?: string
  soc_quote_footer_text?: string
  soc_delivery_conditions_text?: string
  soc_invoice_penalty_text?: string
  soc_invoice_early_payment_discount_text?: string
  soc_invoice_email_body?: string
  soc_pricing_coefficient_sod_cin?: number
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
