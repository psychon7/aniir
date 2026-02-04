/**
 * Consignee entity (delivery/invoicing address)
 */
export interface Consignee {
  con_id: number
  con_code?: string
  con_firstname?: string
  con_lastname?: string
  civ_id?: number
  con_adresse_title?: string
  con_address1?: string
  con_address2?: string
  con_address3?: string
  con_postcode?: string
  con_city?: string
  con_province?: string
  con_country?: string
  con_tel1?: string
  con_tel2?: string
  con_fax?: string
  con_cellphone?: string
  con_email?: string
  con_recieve_newsletter?: boolean
  con_newsletter_email?: string
  con_is_delivery_adr?: boolean
  con_is_invoicing_adr?: boolean
  usr_created_by?: number
  soc_id?: number
  con_d_creation?: string
  con_d_update?: string
  con_comment?: string
  con_cmu_id?: number
  con_company_name?: string
}

/**
 * DTO for creating a consignee
 */
export interface ConsigneeCreateDto {
  con_firstname?: string
  con_lastname?: string
  civ_id?: number
  con_code?: string
  con_adresse_title?: string
  con_address1?: string
  con_address2?: string
  con_address3?: string
  con_postcode?: string
  con_city?: string
  con_province?: string
  con_country?: string
  con_tel1?: string
  con_tel2?: string
  con_fax?: string
  con_cellphone?: string
  con_email?: string
  con_recieve_newsletter?: boolean
  con_newsletter_email?: string
  con_is_delivery_adr?: boolean
  con_is_invoicing_adr?: boolean
  usr_created_by?: number
  soc_id?: number
  con_comment?: string
  con_cmu_id?: number
  con_company_name?: string
}

/**
 * DTO for updating a consignee
 */
export interface ConsigneeUpdateDto extends ConsigneeCreateDto {}

/**
 * Consignee search parameters
 */
export interface ConsigneeSearchParams {
  search?: string
  soc_id?: number
  con_firstname?: string
  con_comment?: string
  con_email?: string
  con_postcode?: string
  con_city?: string
  con_address?: string
  con_company_name?: string
  con_tel?: string
  con_is_delivery_adr?: boolean
  con_is_invoicing_adr?: boolean
  page?: number
  pageSize?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
