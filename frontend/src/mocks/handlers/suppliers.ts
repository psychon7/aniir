import { delay } from '../delay'
import { mockSuppliers, mockSupplierContacts, getNextSupplierId, getNextSupplierContactId } from '../data/suppliers'
import type { Supplier, SupplierContact, SupplierCreateDto, SupplierUpdateDto, SupplierSearchParams } from '@/types/supplier'
import type { ApiResponse, PagedResponse } from '@/types/api'

// In-memory data store (mutated by CRUD operations)
let suppliers = [...mockSuppliers]
let contacts = [...mockSupplierContacts]

/**
 * Get all suppliers with pagination and filtering
 */
export async function getSuppliers(params: SupplierSearchParams = {}): Promise<PagedResponse<Supplier>> {
  await delay(400)

  let filtered = [...suppliers]

  // Apply search filter
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.companyName.toLowerCase().includes(search) ||
        s.reference.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search) ||
        s.city?.toLowerCase().includes(search) ||
        s.abbreviation?.toLowerCase().includes(search)
    )
  }

  // Apply supplier type filter
  if (params.supplierTypeId) {
    filtered = filtered.filter((s) => s.supplierTypeId === params.supplierTypeId)
  }

  // Apply society filter
  if (params.societyId) {
    filtered = filtered.filter((s) => s.societyId === params.societyId)
  }

  // Apply active filter
  if (params.isActive !== undefined) {
    filtered = filtered.filter((s) => s.isActive === params.isActive)
  }

  // Apply sorting
  const sortBy = params.sortBy || 'companyName'
  const sortOrder = params.sortOrder || 'asc'
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof Supplier]
    const bVal = b[sortBy as keyof Supplier]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })

  // Apply pagination
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (page - 1) * pageSize
  const data = filtered.slice(startIndex, startIndex + pageSize)

  return {
    success: true,
    data,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Get a single supplier by ID
 */
export async function getSupplierById(id: number): Promise<ApiResponse<Supplier>> {
  await delay(300)

  const supplier = suppliers.find((s) => s.id === id)
  if (!supplier) {
    throw new Error(`Supplier with ID ${id} not found`)
  }

  return {
    success: true,
    data: supplier,
  }
}

/**
 * Create a new supplier
 */
export async function createSupplier(dto: SupplierCreateDto): Promise<ApiResponse<Supplier>> {
  await delay(500)

  const id = getNextSupplierId()
  const reference = `SUP-${String(id).padStart(4, '0')}`

  // Look up related names from lookups (simplified for mock)
  const newSupplier: Supplier = {
    id,
    reference,
    companyName: dto.companyName,
    abbreviation: dto.abbreviation,
    email: dto.email,
    phone: dto.phone,
    phone2: dto.phone2,
    mobile: dto.mobile,
    fax: dto.fax,
    address: dto.address,
    address2: dto.address2,
    postalCode: dto.postalCode,
    city: dto.city,
    country: dto.country,
    vatNumber: dto.vatNumber,
    siren: dto.siren,
    siret: dto.siret,
    supplierTypeId: dto.supplierTypeId,
    supplierTypeName: dto.supplierTypeId === 1 ? 'Manufacturer' : dto.supplierTypeId === 2 ? 'Distributor' : 'Service Provider',
    currencyId: dto.currencyId,
    currencyCode: dto.currencyId === 1 ? 'EUR' : dto.currencyId === 2 ? 'USD' : 'CNY',
    paymentModeId: dto.paymentModeId,
    paymentModeName: dto.paymentModeId === 1 ? 'Bank Transfer' : 'Other',
    paymentConditionId: dto.paymentConditionId,
    paymentConditionName: dto.paymentConditionId === 3 ? '30 days' : 'Immediate',
    vatId: dto.vatId,
    societyId: dto.societyId,
    societyName: dto.societyId === 1 ? 'ECOLED EUROPE' : 'ECOLED HK',
    createdById: 1,
    receiveNewsletter: dto.receiveNewsletter || false,
    newsletterEmail: dto.newsletterEmail,
    internalComment: dto.internalComment,
    supplierComment: dto.supplierComment,
    isActive: dto.isActive ?? true,
    isBlocked: dto.isBlocked || false,
    freeOfHarbor: dto.freeOfHarbor,
    hasContacts: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  suppliers.push(newSupplier)

  return {
    success: true,
    data: newSupplier,
    message: 'Supplier created successfully',
  }
}

/**
 * Update an existing supplier
 */
export async function updateSupplier(dto: SupplierUpdateDto): Promise<ApiResponse<Supplier>> {
  await delay(400)

  const index = suppliers.findIndex((s) => s.id === dto.id)
  if (index === -1) {
    throw new Error(`Supplier with ID ${dto.id} not found`)
  }

  const existing = suppliers[index]
  const updated: Supplier = {
    ...existing,
    ...dto,
    updatedAt: new Date().toISOString(),
    // Update derived fields if relevant IDs changed
    supplierTypeName: dto.supplierTypeId
      ? (dto.supplierTypeId === 1 ? 'Manufacturer' : dto.supplierTypeId === 2 ? 'Distributor' : 'Service Provider')
      : existing.supplierTypeName,
  }

  suppliers[index] = updated

  return {
    success: true,
    data: updated,
    message: 'Supplier updated successfully',
  }
}

/**
 * Delete a supplier (soft delete by setting inactive)
 */
export async function deleteSupplier(id: number): Promise<ApiResponse<void>> {
  await delay(300)

  const index = suppliers.findIndex((s) => s.id === id)
  if (index === -1) {
    throw new Error(`Supplier with ID ${id} not found`)
  }

  // Soft delete - mark as inactive
  suppliers[index] = {
    ...suppliers[index],
    isActive: false,
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    data: undefined,
    message: 'Supplier deleted successfully',
  }
}

/**
 * Get contacts for a supplier
 */
export async function getSupplierContacts(supplierId: number): Promise<ApiResponse<SupplierContact[]>> {
  await delay(250)

  const supplierContacts = contacts.filter((c) => c.supplierId === supplierId)

  return {
    success: true,
    data: supplierContacts,
  }
}

/**
 * Create a new contact for a supplier
 */
export async function createSupplierContact(
  supplierId: number,
  contact: Omit<SupplierContact, 'id' | 'supplierId'>
): Promise<ApiResponse<SupplierContact>> {
  await delay(400)

  const newContact: SupplierContact = {
    id: getNextSupplierContactId(),
    supplierId,
    ...contact,
  }

  contacts.push(newContact)

  // Update hasContacts flag on supplier
  const supplierIndex = suppliers.findIndex((s) => s.id === supplierId)
  if (supplierIndex !== -1) {
    suppliers[supplierIndex] = {
      ...suppliers[supplierIndex],
      hasContacts: true,
    }
  }

  return {
    success: true,
    data: newContact,
    message: 'Contact created successfully',
  }
}

/**
 * Delete a supplier contact
 */
export async function deleteSupplierContact(contactId: number): Promise<ApiResponse<void>> {
  await delay(300)

  const index = contacts.findIndex((c) => c.id === contactId)
  if (index === -1) {
    throw new Error(`Contact with ID ${contactId} not found`)
  }

  const supplierId = contacts[index].supplierId
  contacts.splice(index, 1)

  // Update hasContacts flag on supplier if no more contacts
  const remainingContacts = contacts.filter((c) => c.supplierId === supplierId)
  if (remainingContacts.length === 0) {
    const supplierIndex = suppliers.findIndex((s) => s.id === supplierId)
    if (supplierIndex !== -1) {
      suppliers[supplierIndex] = {
        ...suppliers[supplierIndex],
        hasContacts: false,
      }
    }
  }

  return {
    success: true,
    data: undefined,
    message: 'Contact deleted successfully',
  }
}

/**
 * Reset mock data to initial state (useful for testing)
 */
export function resetMockSuppliers(): void {
  suppliers = [...mockSuppliers]
  contacts = [...mockSupplierContacts]
}

/**
 * Export suppliers to CSV format
 */
export async function exportSuppliersToCSV(params: SupplierSearchParams = {}): Promise<string> {
  await delay(600)

  // Get filtered data (without pagination)
  const result = await getSuppliers({ ...params, page: 1, pageSize: 10000 })

  const headers = [
    'Reference',
    'Company Name',
    'Abbreviation',
    'Email',
    'Phone',
    'City',
    'Country',
    'Type',
    'Currency',
    'Active',
  ]

  const rows = result.data.map((s) => [
    s.reference,
    s.companyName,
    s.abbreviation || '',
    s.email || '',
    s.phone || '',
    s.city || '',
    s.country || '',
    s.supplierTypeName || '',
    s.currencyCode || '',
    s.isActive ? 'Yes' : 'No',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}
