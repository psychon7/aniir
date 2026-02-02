import { delay } from '../delay'
import { mockClients, mockClientContacts, getNextClientId, getNextContactId } from '../data/clients'
import type { Client, ClientContact, ClientCreateDto, ClientUpdateDto, ClientSearchParams } from '@/types/client'
import type { ApiResponse, PagedResponse } from '@/types/api'

// In-memory data store (mutated by CRUD operations)
let clients = [...mockClients]
let contacts = [...mockClientContacts]

/**
 * Get all clients with pagination and filtering
 */
export async function getClients(params: ClientSearchParams = {}): Promise<PagedResponse<Client>> {
  await delay(400)

  let filtered = [...clients]

  // Apply search filter
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        c.companyName.toLowerCase().includes(search) ||
        c.reference.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.city?.toLowerCase().includes(search)
    )
  }

  // Apply status filter
  if (params.statusId) {
    filtered = filtered.filter((c) => c.statusId === params.statusId)
  }

  // Apply client type filter
  if (params.clientTypeId) {
    filtered = filtered.filter((c) => c.clientTypeId === params.clientTypeId)
  }

  // Apply country filter
  if (params.countryId) {
    filtered = filtered.filter((c) => c.countryId === params.countryId)
  }

  // Apply business unit filter
  if (params.businessUnitId) {
    filtered = filtered.filter((c) => c.businessUnitId === params.businessUnitId)
  }

  // Apply society filter
  if (params.societyId) {
    filtered = filtered.filter((c) => c.societyId === params.societyId)
  }

  // Apply sorting
  const sortBy = params.sortBy || 'companyName'
  const sortOrder = params.sortOrder || 'asc'
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof Client]
    const bVal = b[sortBy as keyof Client]
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
 * Get a single client by ID
 */
export async function getClientById(id: number): Promise<ApiResponse<Client>> {
  await delay(300)

  const client = clients.find((c) => c.id === id)
  if (!client) {
    throw new Error(`Client with ID ${id} not found`)
  }

  return {
    success: true,
    data: client,
  }
}

/**
 * Create a new client
 */
export async function createClient(dto: ClientCreateDto): Promise<ApiResponse<Client>> {
  await delay(500)

  const id = getNextClientId()
  const reference = `CLI-${String(id).padStart(4, '0')}`

  // Look up related names from lookups (simplified for mock)
  const newClient: Client = {
    id,
    reference,
    companyName: dto.companyName,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phone: dto.phone,
    mobile: dto.mobile,
    address: dto.address,
    address2: dto.address2,
    postalCode: dto.postalCode,
    city: dto.city,
    countryId: dto.countryId,
    countryName: dto.countryId === 1 ? 'France' : dto.countryId === 2 ? 'Germany' : 'Other',
    vatNumber: dto.vatNumber,
    siret: dto.siret,
    website: dto.website,
    clientTypeId: dto.clientTypeId,
    clientTypeName: dto.clientTypeId === 1 ? 'Retail' : dto.clientTypeId === 2 ? 'Wholesale' : 'Other',
    statusId: dto.statusId,
    statusName: dto.statusId === 1 ? 'Active' : dto.statusId === 2 ? 'Inactive' : 'Prospect',
    currencyId: dto.currencyId,
    currencyCode: dto.currencyId === 1 ? 'EUR' : dto.currencyId === 2 ? 'USD' : 'GBP',
    paymentModeId: dto.paymentModeId,
    paymentModeName: dto.paymentModeId === 1 ? 'Bank Transfer' : 'Other',
    paymentTermId: dto.paymentTermId,
    paymentTermDays: dto.paymentTermId === 3 ? 30 : 0,
    creditLimit: dto.creditLimit,
    discount: dto.discount,
    businessUnitId: dto.businessUnitId,
    businessUnitName: dto.businessUnitId === 1 ? 'LED Division' : 'Other',
    societyId: dto.societyId,
    societyName: dto.societyId === 1 ? 'ECOLED EUROPE' : 'Other',
    languageId: dto.languageId,
    languageCode: dto.languageId === 1 ? 'fr' : 'en',
    notes: dto.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: dto.statusId === 1 || dto.statusId === 3,
  }

  clients.push(newClient)

  return {
    success: true,
    data: newClient,
    message: 'Client created successfully',
  }
}

/**
 * Update an existing client
 */
export async function updateClient(dto: ClientUpdateDto): Promise<ApiResponse<Client>> {
  await delay(400)

  const index = clients.findIndex((c) => c.id === dto.id)
  if (index === -1) {
    throw new Error(`Client with ID ${dto.id} not found`)
  }

  const existing = clients[index]
  const updated: Client = {
    ...existing,
    ...dto,
    updatedAt: new Date().toISOString(),
    // Update derived fields if relevant IDs changed
    statusName: dto.statusId ? (dto.statusId === 1 ? 'Active' : dto.statusId === 2 ? 'Inactive' : 'Prospect') : existing.statusName,
    isActive: dto.statusId ? dto.statusId === 1 || dto.statusId === 3 : existing.isActive,
  }

  clients[index] = updated

  return {
    success: true,
    data: updated,
    message: 'Client updated successfully',
  }
}

/**
 * Delete a client (soft delete by setting inactive)
 */
export async function deleteClient(id: number): Promise<ApiResponse<void>> {
  await delay(300)

  const index = clients.findIndex((c) => c.id === id)
  if (index === -1) {
    throw new Error(`Client with ID ${id} not found`)
  }

  // Soft delete - mark as inactive
  clients[index] = {
    ...clients[index],
    isActive: false,
    statusId: 2,
    statusName: 'Inactive',
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    data: undefined,
    message: 'Client deleted successfully',
  }
}

/**
 * Get contacts for a client
 */
export async function getClientContacts(clientId: number): Promise<ApiResponse<ClientContact[]>> {
  await delay(250)

  const clientContacts = contacts.filter((c) => c.clientId === clientId)

  return {
    success: true,
    data: clientContacts,
  }
}

/**
 * Create a new contact for a client
 */
export async function createClientContact(
  clientId: number,
  contact: Omit<ClientContact, 'id' | 'clientId'>
): Promise<ApiResponse<ClientContact>> {
  await delay(400)

  const newContact: ClientContact = {
    id: getNextContactId(),
    clientId,
    ...contact,
  }

  contacts.push(newContact)

  return {
    success: true,
    data: newContact,
    message: 'Contact created successfully',
  }
}

/**
 * Delete a client contact
 */
export async function deleteClientContact(contactId: number): Promise<ApiResponse<void>> {
  await delay(300)

  const index = contacts.findIndex((c) => c.id === contactId)
  if (index === -1) {
    throw new Error(`Contact with ID ${contactId} not found`)
  }

  contacts.splice(index, 1)

  return {
    success: true,
    data: undefined,
    message: 'Contact deleted successfully',
  }
}

/**
 * Reset mock data to initial state (useful for testing)
 */
export function resetMockClients(): void {
  clients = [...mockClients]
  contacts = [...mockClientContacts]
}

/**
 * Export clients to CSV format
 */
export async function exportClientsToCSV(params: ClientSearchParams = {}): Promise<string> {
  await delay(600)

  // Get filtered data (without pagination)
  const result = await getClients({ ...params, page: 1, pageSize: 10000 })

  const headers = [
    'Reference',
    'Company Name',
    'Contact',
    'Email',
    'Phone',
    'City',
    'Country',
    'Status',
    'Type',
    'Business Unit',
  ]

  const rows = result.data.map((c) => [
    c.reference,
    c.companyName,
    `${c.firstName || ''} ${c.lastName || ''}`.trim(),
    c.email || '',
    c.phone || '',
    c.city || '',
    c.countryName || '',
    c.statusName,
    c.clientTypeName || '',
    c.businessUnitName || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}
