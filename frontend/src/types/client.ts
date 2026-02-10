/**
 * Client entity representing a customer in the ERP system
 */
export interface Client {
  id: number
  reference: string
  companyName: string
  abbreviation?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  phone2?: string
  mobile?: string
  fax?: string
  accountingEmail?: string
  receiveNewsletter?: boolean
  newsletterEmail?: string
  address?: string
  address2?: string
  postalCode?: string
  city?: string
  countryId?: number
  countryName?: string
  country?: string
  vatNumber?: string
  vatIntra?: string
  siren?: string
  siret?: string
  website?: string

  // Business relations
  clientTypeId?: number
  clientTypeName?: string
  activityId?: number
  statusId: number
  statusName: string
  currencyId: number
  currencyCode: string
  vatId?: number
  paymentConditionId?: number
  paymentModeId?: number
  paymentModeName?: string
  paymentTermId?: number
  paymentTermDays?: number
  commercialUser1Id?: number
  commercialUser2Id?: number
  commercialUser3Id?: number
  commercialUser1Name?: string
  commercialUser2Name?: string
  commercialUser3Name?: string

  // Financial
  creditLimit?: number
  discount?: number
  invoiceDay?: number
  invoiceDayIsLastDay?: boolean

  // Organization
  businessUnitId?: number
  businessUnitName?: string
  societyId: number
  societyName: string
  languageId?: number
  languageCode?: string

  // Notes
  notes?: string
  commentForClient?: string
  commentInternal?: string

  // Bank details
  bankIban?: string
  bankBic?: string
  bankName?: string
  bankAccountHolder?: string
  bankAddress?: string

  // Metadata
  createdAt: string
  updatedAt: string
  isActive: boolean
  isBlocked?: boolean
  showDetail?: boolean
}

/**
 * Client contact information
 */
export interface ClientContact {
  id: number
  clientId: number
  firstName: string
  lastName: string
  reference?: string
  addressTitle?: string
  address1?: string
  address2?: string
  postcode?: string
  city?: string
  country?: string
  email?: string
  phone?: string
  phone2?: string
  fax?: string
  mobile?: string
  position?: string
  isPrimary?: boolean
  isInvoicingAddress?: boolean
  isDeliveryAddress?: boolean
  receiveNewsletter?: boolean
  newsletterEmail?: string
  comment?: string
  role?: string
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

/**
 * DTO for creating a new client
 */
export interface ClientCreateDto {
  companyName: string
  abbreviation?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  phone2?: string
  mobile?: string
  fax?: string
  accountingEmail?: string
  receiveNewsletter?: boolean
  newsletterEmail?: string
  address?: string
  address2?: string
  postalCode?: string
  city?: string
  countryId?: number
  country?: string
  vatNumber?: string
  vatIntra?: string
  siren?: string
  siret?: string
  website?: string
  clientTypeId?: number
  activityId?: number
  statusId: number
  currencyId: number
  vatId?: number
  paymentConditionId?: number
  paymentModeId?: number
  paymentTermId?: number
  commercialUser1Id?: number
  commercialUser2Id?: number
  commercialUser3Id?: number
  creditLimit?: number
  discount?: number
  invoiceDay?: number
  invoiceDayIsLastDay?: boolean
  businessUnitId?: number
  societyId: number
  languageId?: number
  commentForClient?: string
  commentInternal?: string
  notes?: string
  bankIban?: string
  bankBic?: string
  bankName?: string
  bankAccountHolder?: string
  bankAddress?: string
  isActive?: boolean
  isBlocked?: boolean
  showDetail?: boolean
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
