/**
 * Supplier entity representing a supplier/vendor in the ERP system
 * Maps to TM_SUP_Supplier table in the database
 */
export interface Supplier {
  id: number
  reference: string
  companyName: string
  abbreviation?: string
  email?: string
  phone?: string
  phone2?: string
  mobile?: string
  fax?: string
  address?: string
  address2?: string
  postalCode?: string
  city?: string
  country?: string

  // Business identifiers
  vatNumber?: string
  siren?: string
  siret?: string

  // Business relations
  supplierTypeId?: number
  supplierTypeName?: string
  currencyId: number
  currencyCode?: string
  paymentModeId?: number
  paymentModeName?: string
  paymentConditionId?: number
  paymentConditionName?: string
  vatId?: number

  // Organization
  societyId: number
  societyName?: string
  createdById?: number

  // Supplier portal credentials
  loginUsername?: string

  // Newsletter
  receiveNewsletter: boolean
  newsletterEmail?: string

  // Comments
  internalComment?: string
  supplierComment?: string

  // Status
  isActive: boolean
  isBlocked: boolean
  freeOfHarbor?: number

  // Related data flags
  hasContacts: boolean

  // Metadata
  createdAt: string
  updatedAt: string
}

/**
 * Supplier contact information
 */
export interface SupplierContact {
  id: number
  supplierId: number
  civilityId?: number
  firstName: string
  lastName: string
  addressTitle?: string
  email?: string
  phone?: string
  phone2?: string
  mobile?: string
  fax?: string
  address?: string
  address2?: string
  postalCode?: string
  city?: string
  country?: string
  receiveNewsletter: boolean
  newsletterEmail?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * DTO for creating a new supplier
 */
export interface SupplierCreateDto {
  companyName: string
  abbreviation?: string
  email?: string
  phone?: string
  phone2?: string
  mobile?: string
  fax?: string
  address?: string
  address2?: string
  postalCode?: string
  city?: string
  country?: string
  vatNumber?: string
  siren?: string
  siret?: string
  supplierTypeId?: number
  currencyId: number
  paymentModeId?: number
  paymentConditionId?: number
  vatId?: number
  societyId: number
  receiveNewsletter?: boolean
  newsletterEmail?: string
  internalComment?: string
  supplierComment?: string
  isActive?: boolean
  isBlocked?: boolean
  freeOfHarbor?: number
}

/**
 * DTO for updating an existing supplier
 */
export interface SupplierUpdateDto extends Partial<SupplierCreateDto> {
  id: number
}

/**
 * Search/filter parameters for supplier list
 */
export interface SupplierSearchParams {
  search?: string
  supplierTypeId?: number
  societyId?: number
  isActive?: boolean
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Supplier list item (summary view)
 */
export interface SupplierListItem {
  id: number
  reference: string
  companyName: string
  abbreviation?: string
  city?: string
  country?: string
  supplierTypeName?: string
  email?: string
  phone?: string
  isActive: boolean
  isBlocked: boolean
  hasContacts: boolean
}
