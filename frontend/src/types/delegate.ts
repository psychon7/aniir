/**
 * TypeScript types for Client Delegates
 *
 * Delegates are entities (usually parent companies, billing agents, or group HQ)
 * that receive invoices on behalf of a client.
 */

export interface ClientDelegate {
  id: number
  clientId: number
  delegateClientId?: number | null
  companyName?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address1?: string | null
  address2?: string | null
  postcode?: string | null
  city?: string | null
  country?: string | null
  vatNumber?: string | null
  isActive: boolean
  isPrimary: boolean
  notes?: string | null
  createdAt?: string
  updatedAt?: string
  // Resolved lookup
  delegateClientName?: string | null
}

export interface ClientDelegateCreateDto {
  cdl_delegate_cli_id?: number | null
  cdl_company_name?: string | null
  cdl_contact_name?: string | null
  cdl_email?: string | null
  cdl_phone?: string | null
  cdl_address1?: string | null
  cdl_address2?: string | null
  cdl_postcode?: string | null
  cdl_city?: string | null
  cdl_country?: string | null
  cdl_vat_number?: string | null
  cdl_is_primary?: boolean
  cdl_notes?: string | null
}

export interface ClientDelegateUpdateDto {
  cdl_delegate_cli_id?: number | null
  cdl_company_name?: string | null
  cdl_contact_name?: string | null
  cdl_email?: string | null
  cdl_phone?: string | null
  cdl_address1?: string | null
  cdl_address2?: string | null
  cdl_postcode?: string | null
  cdl_city?: string | null
  cdl_country?: string | null
  cdl_vat_number?: string | null
  cdl_is_active?: boolean
  cdl_is_primary?: boolean
  cdl_notes?: string | null
}

export interface ClientDelegatePaginatedResponse {
  data: ClientDelegate[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
