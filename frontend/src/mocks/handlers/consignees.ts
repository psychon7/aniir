import { delay } from '../delay'
import { mockConsignees, getNextConsigneeId } from '../data/consignees'
import type { Consignee, ConsigneeCreateDto, ConsigneeUpdateDto, ConsigneeSearchParams } from '@/types/consignee'
import type { ApiResponse, PagedResponse } from '@/types/api'

let consignees = [...mockConsignees]

function matches(value: string | undefined, search: string) {
  if (!value) return false
  return value.toLowerCase().includes(search)
}

export async function getConsignees(
  params: ConsigneeSearchParams = {}
): Promise<PagedResponse<Consignee>> {
  await delay(300)

  let filtered = [...consignees]

  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        matches(c.con_company_name, search) ||
        matches(c.con_firstname, search) ||
        matches(c.con_lastname, search) ||
        matches(c.con_email, search) ||
        matches(c.con_city, search) ||
        matches(c.con_postcode, search) ||
        matches(c.con_code, search)
    )
  }

  if (params.con_company_name) {
    const search = params.con_company_name.toLowerCase()
    filtered = filtered.filter((c) => matches(c.con_company_name, search))
  }

  if (params.con_firstname) {
    const search = params.con_firstname.toLowerCase()
    filtered = filtered.filter((c) => matches(c.con_firstname, search))
  }

  if (params.con_email) {
    const search = params.con_email.toLowerCase()
    filtered = filtered.filter((c) => matches(c.con_email, search))
  }

  if (params.con_postcode) {
    const search = params.con_postcode.toLowerCase()
    filtered = filtered.filter((c) => matches(c.con_postcode, search))
  }

  if (params.con_city) {
    const search = params.con_city.toLowerCase()
    filtered = filtered.filter((c) => matches(c.con_city, search))
  }

  if (params.con_address) {
    const search = params.con_address.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        matches(c.con_address1, search) ||
        matches(c.con_address2, search) ||
        matches(c.con_address3, search)
    )
  }

  if (params.con_tel) {
    const search = params.con_tel.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        matches(c.con_tel1, search) ||
        matches(c.con_tel2, search) ||
        matches(c.con_cellphone, search) ||
        matches(c.con_fax, search)
    )
  }

  if (params.soc_id) {
    filtered = filtered.filter((c) => c.soc_id === params.soc_id)
  }

  if (params.con_is_delivery_adr !== undefined) {
    filtered = filtered.filter((c) => c.con_is_delivery_adr === params.con_is_delivery_adr)
  }

  if (params.con_is_invoicing_adr !== undefined) {
    filtered = filtered.filter((c) => c.con_is_invoicing_adr === params.con_is_invoicing_adr)
  }

  const sortBy = params.sort_by || 'con_company_name'
  const sortOrder = params.sort_order || 'asc'
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof Consignee]
    const bVal = b[sortBy as keyof Consignee]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })

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

export async function getConsigneeById(id: number): Promise<ApiResponse<Consignee>> {
  await delay(200)

  const consignee = consignees.find((c) => c.con_id === id)
  if (!consignee) {
    throw new Error(`Consignee with ID ${id} not found`)
  }

  return {
    success: true,
    data: consignee,
  }
}

export async function createConsignee(dto: ConsigneeCreateDto): Promise<ApiResponse<Consignee>> {
  await delay(350)

  const id = getNextConsigneeId()
  const newConsignee: Consignee = {
    con_id: id,
    con_code: dto.con_code || `CS-${String(id).padStart(4, '0')}`,
    con_firstname: dto.con_firstname,
    con_lastname: dto.con_lastname,
    con_company_name: dto.con_company_name,
    civ_id: dto.civ_id,
    con_adresse_title: dto.con_adresse_title,
    con_address1: dto.con_address1,
    con_address2: dto.con_address2,
    con_address3: dto.con_address3,
    con_postcode: dto.con_postcode,
    con_city: dto.con_city,
    con_province: dto.con_province,
    con_country: dto.con_country,
    con_tel1: dto.con_tel1,
    con_tel2: dto.con_tel2,
    con_fax: dto.con_fax,
    con_cellphone: dto.con_cellphone,
    con_email: dto.con_email,
    con_recieve_newsletter: dto.con_recieve_newsletter ?? false,
    con_newsletter_email: dto.con_newsletter_email,
    con_is_delivery_adr: dto.con_is_delivery_adr ?? true,
    con_is_invoicing_adr: dto.con_is_invoicing_adr ?? true,
    usr_created_by: dto.usr_created_by,
    soc_id: dto.soc_id ?? 1,
    con_comment: dto.con_comment,
    con_cmu_id: dto.con_cmu_id,
    con_d_creation: new Date().toISOString(),
    con_d_update: new Date().toISOString(),
  }

  consignees.push(newConsignee)

  return {
    success: true,
    data: newConsignee,
    message: 'Consignee created successfully',
  }
}

export async function updateConsignee(
  id: number,
  dto: ConsigneeUpdateDto
): Promise<ApiResponse<Consignee>> {
  await delay(300)

  const index = consignees.findIndex((c) => c.con_id === id)
  if (index === -1) {
    throw new Error(`Consignee with ID ${id} not found`)
  }

  const existing = consignees[index]
  const updated: Consignee = {
    ...existing,
    ...dto,
    con_id: id,
    con_d_update: new Date().toISOString(),
  }

  consignees[index] = updated

  return {
    success: true,
    data: updated,
    message: 'Consignee updated successfully',
  }
}

export async function deleteConsignee(id: number): Promise<ApiResponse<void>> {
  await delay(200)

  const index = consignees.findIndex((c) => c.con_id === id)
  if (index === -1) {
    throw new Error(`Consignee with ID ${id} not found`)
  }

  consignees.splice(index, 1)

  return {
    success: true,
    data: undefined,
    message: 'Consignee deleted successfully',
  }
}
