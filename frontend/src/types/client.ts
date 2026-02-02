/**
 * Client entity representing a customer in the ERP system
 */
export interface Client {
  id: number
  reference: string
  companyName: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  mobile?: string
  fax?: string
  address?: string
  address2?: string
  postalCode?: string
  city?: string
  countryId?: number
  countryName?: string
  vatNumber?: string
  siret?: string
  website?: string

  // Business relations
  clientTypeId?: number
  clientTypeName?: string
  statusId: number
  statusName: string
  currencyId: number
  currencyCode: string
  paymentModeId?: number
  paymentModeName?: string
  paymentTermId?: number
  paymentTermDays?: number

  // Financial
  creditLimit?: number
  discount?: number

  // Organization
  businessUnitId?: number
  businessUnitName?: string
  societyId: number
  societyName: string
  languageId?: number
  languageCode?: string

  // Notes
  notes?: string

  // Metadata
  createdAt: string
  updatedAt: string
  isActive: boolean
}

/**
 * Client contact information
 */
export interface ClientContact {
  id: number
  clientId: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  position?: string
  isPrimary: boolean
  isActive: boolean
}

/**
 * DTO for creating a new client
 */
export interface ClientCreateDto {
  companyName: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  address2?: string
  postalCode?: string
  city?: string
  countryId?: number
  vatNumber?: string
  siret?: string
  website?: string
  clientTypeId?: number
  statusId: number
  currencyId: number
  paymentModeId?: number
  paymentTermId?: number
  creditLimit?: number
  discount?: number
  businessUnitId?: number
  societyId: number
  languageId?: number
  notes?: string
}

/**
 * DTO for updating an existing client
 */
export interface ClientUpdateDto extends Partial<ClientCreateDto> {
  id: number
}

/**
 * Search/filter parameters for client list
 */
export interface ClientSearchParams {
  search?: string
  statusId?: number
  clientTypeId?: number
  countryId?: number
  businessUnitId?: number
  societyId?: number
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Client list item (summary view)
 */
export interface ClientListItem {
  id: number
  reference: string
  companyName: string
  city?: string
  countryName?: string
  statusId: number
  statusName: string
  clientTypeName?: string
  businessUnitName?: string
  email?: string
  phone?: string
  isActive: boolean
}
