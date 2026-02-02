import { delay } from '../delay'
import { mockStatements, getNextStatementId, getNextStatementReference, statementStatuses, statementTypes } from '../data/statements'
import type { Statement, StatementCreateDto, StatementUpdateDto, StatementSearchParams } from '@/types/statement'
import type { ApiResponse, PagedResponse } from '@/types/api'

// In-memory data store (mutated by CRUD operations)
let statements = [...mockStatements]

/**
 * Get all statements with pagination and filtering
 */
export async function getStatements(params: StatementSearchParams = {}): Promise<PagedResponse<Statement>> {
  await delay(400)

  let filtered = [...statements]

  // Apply search filter
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.reference.toLowerCase().includes(search) ||
        s.clientName.toLowerCase().includes(search) ||
        s.statementTypeName.toLowerCase().includes(search) ||
        s.notes?.toLowerCase().includes(search)
    )
  }

  // Apply client filter
  if (params.clientId) {
    filtered = filtered.filter((s) => s.clientId === params.clientId)
  }

  // Apply status filter
  if (params.statusId) {
    filtered = filtered.filter((s) => s.statusId === params.statusId)
  }

  // Apply statement type filter
  if (params.statementTypeId) {
    filtered = filtered.filter((s) => s.statementTypeId === params.statementTypeId)
  }

  // Apply business unit filter
  if (params.businessUnitId) {
    filtered = filtered.filter((s) => s.businessUnitId === params.businessUnitId)
  }

  // Apply society filter
  if (params.societyId) {
    filtered = filtered.filter((s) => s.societyId === params.societyId)
  }

  // Apply date range filter
  if (params.dateFrom) {
    filtered = filtered.filter((s) => s.statementDate >= params.dateFrom!)
  }
  if (params.dateTo) {
    filtered = filtered.filter((s) => s.statementDate <= params.dateTo!)
  }

  // Apply period range filter
  if (params.periodFrom) {
    filtered = filtered.filter((s) => s.periodStart >= params.periodFrom!)
  }
  if (params.periodTo) {
    filtered = filtered.filter((s) => s.periodEnd <= params.periodTo!)
  }

  // Apply sorting
  const sortBy = params.sortBy || 'statementDate'
  const sortOrder = params.sortOrder || 'desc'
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof Statement]
    const bVal = b[sortBy as keyof Statement]
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
 * Get a single statement by ID
 */
export async function getStatementById(id: number): Promise<ApiResponse<Statement>> {
  await delay(300)

  const statement = statements.find((s) => s.id === id)
  if (!statement) {
    throw new Error(`Statement with ID ${id} not found`)
  }

  return {
    success: true,
    data: statement,
  }
}

/**
 * Create a new statement
 */
export async function createStatement(dto: StatementCreateDto): Promise<ApiResponse<Statement>> {
  await delay(500)

  const id = getNextStatementId()
  const reference = getNextStatementReference()

  // Get client name from mock clients (simplified lookup)
  const clientNames: Record<number, string> = {
    1: 'Acme Corporation',
    2: 'TechStart SAS',
    3: 'Global Industries GmbH',
    5: 'Metro Services Ltd',
    7: 'Illumina Italia SpA',
    8: 'Shenzhen Electronics Ltd',
    9: 'Belgian Lights BVBA',
  }

  // Get status name
  const statusName = statementStatuses.find(s => s.key === dto.statusId)?.value || 'Draft'

  // Get statement type name
  const typeName = statementTypes.find(t => t.key === dto.statementTypeId)?.value || 'Monthly Statement'

  // Get currency code (simplified)
  const currencyCodes: Record<number, string> = {
    1: 'EUR',
    2: 'USD',
    3: 'GBP',
    4: 'CNY',
    5: 'JPY',
    6: 'CHF',
  }

  // Get business unit name (simplified)
  const businessUnitNames: Record<number, string> = {
    1: 'LED Division',
    2: 'Domotics',
    3: 'HVAC',
    4: 'Wave Concept',
    5: 'Accessories',
  }

  // Get society name (simplified)
  const societyNames: Record<number, string> = {
    1: 'ECOLED EUROPE',
    2: 'ECOLED HK',
  }

  const newStatement: Statement = {
    id,
    reference,
    clientId: dto.clientId,
    clientName: clientNames[dto.clientId] || 'Unknown Client',
    statementDate: dto.statementDate,
    periodStart: dto.periodStart,
    periodEnd: dto.periodEnd,
    openingBalance: dto.openingBalance,
    totalDebits: 0,
    totalCredits: 0,
    closingBalance: dto.openingBalance,
    currencyId: dto.currencyId,
    currencyCode: currencyCodes[dto.currencyId] || 'EUR',
    statusId: dto.statusId,
    statusName,
    statementTypeId: dto.statementTypeId,
    statementTypeName: typeName,
    businessUnitId: dto.businessUnitId,
    businessUnitName: dto.businessUnitId ? businessUnitNames[dto.businessUnitId] : undefined,
    societyId: dto.societyId,
    societyName: societyNames[dto.societyId] || 'Unknown',
    notes: dto.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'current_user',
    transactionCount: 0,
  }

  statements.push(newStatement)

  return {
    success: true,
    data: newStatement,
    message: 'Statement created successfully',
  }
}

/**
 * Update an existing statement
 */
export async function updateStatement(dto: StatementUpdateDto): Promise<ApiResponse<Statement>> {
  await delay(400)

  const index = statements.findIndex((s) => s.id === dto.id)
  if (index === -1) {
    throw new Error(`Statement with ID ${dto.id} not found`)
  }

  const existing = statements[index]

  // Get status name if changed
  const statusName = dto.statusId
    ? statementStatuses.find(s => s.key === dto.statusId)?.value || existing.statusName
    : existing.statusName

  // Get type name if changed
  const typeName = dto.statementTypeId
    ? statementTypes.find(t => t.key === dto.statementTypeId)?.value || existing.statementTypeName
    : existing.statementTypeName

  const updated: Statement = {
    ...existing,
    ...dto,
    statusName,
    statementTypeName: typeName,
    updatedAt: new Date().toISOString(),
  }

  statements[index] = updated

  return {
    success: true,
    data: updated,
    message: 'Statement updated successfully',
  }
}

/**
 * Delete a statement
 */
export async function deleteStatement(id: number): Promise<ApiResponse<void>> {
  await delay(300)

  const index = statements.findIndex((s) => s.id === id)
  if (index === -1) {
    throw new Error(`Statement with ID ${id} not found`)
  }

  statements.splice(index, 1)

  return {
    success: true,
    data: undefined,
    message: 'Statement deleted successfully',
  }
}

/**
 * Reset mock data to initial state (useful for testing)
 */
export function resetMockStatements(): void {
  statements = [...mockStatements]
}

/**
 * Export statements to CSV format
 */
export async function exportStatementsToCSV(params: StatementSearchParams = {}): Promise<string> {
  await delay(600)

  // Get filtered data (without pagination)
  const result = await getStatements({ ...params, page: 1, pageSize: 10000 })

  const headers = [
    'Reference',
    'Client',
    'Statement Date',
    'Period Start',
    'Period End',
    'Opening Balance',
    'Closing Balance',
    'Currency',
    'Status',
    'Type',
    'Business Unit',
    'Notes',
  ]

  const rows = result.data.map((s) => [
    s.reference,
    s.clientName,
    s.statementDate,
    s.periodStart,
    s.periodEnd,
    s.openingBalance.toFixed(2),
    s.closingBalance.toFixed(2),
    s.currencyCode,
    s.statusName,
    s.statementTypeName,
    s.businessUnitName || '',
    s.notes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Get statement statuses for lookups
 */
export async function getStatementStatuses(): Promise<ApiResponse<Array<{ key: number; value: string }>>> {
  await delay(100)
  return {
    success: true,
    data: statementStatuses,
  }
}

/**
 * Get statement types for lookups
 */
export async function getStatementTypes(): Promise<ApiResponse<Array<{ key: number; value: string }>>> {
  await delay(100)
  return {
    success: true,
    data: statementTypes,
  }
}

/**
 * Send statement to client via email
 */
export async function sendStatementToClient(id: number, email: string): Promise<ApiResponse<void>> {
  await delay(800)

  const index = statements.findIndex((s) => s.id === id)
  if (index === -1) {
    throw new Error(`Statement with ID ${id} not found`)
  }

  // Update statement with sent info
  statements[index] = {
    ...statements[index],
    statusId: 3,
    statusName: 'Sent',
    sentAt: new Date().toISOString(),
    sentTo: email,
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    data: undefined,
    message: `Statement sent to ${email}`,
  }
}

/**
 * Generate statement PDF (returns a mock blob)
 */
export async function generateStatementPDF(id: number): Promise<Blob> {
  await delay(1000)

  const statement = statements.find((s) => s.id === id)
  if (!statement) {
    throw new Error(`Statement with ID ${id} not found`)
  }

  // Create a simple text representation as mock PDF content
  const content = `
ACCOUNT STATEMENT
==================

Reference: ${statement.reference}
Client: ${statement.clientName}
Statement Date: ${statement.statementDate}
Period: ${statement.periodStart} to ${statement.periodEnd}

Financial Summary
-----------------
Opening Balance: ${statement.currencyCode} ${statement.openingBalance.toFixed(2)}
Total Debits: ${statement.currencyCode} ${statement.totalDebits.toFixed(2)}
Total Credits: ${statement.currencyCode} ${statement.totalCredits.toFixed(2)}
Closing Balance: ${statement.currencyCode} ${statement.closingBalance.toFixed(2)}

Type: ${statement.statementTypeName}
Status: ${statement.statusName}
Business Unit: ${statement.businessUnitName || 'N/A'}
Society: ${statement.societyName}

Notes: ${statement.notes || 'None'}

Generated: ${new Date().toISOString()}
`

  return new Blob([content], { type: 'application/pdf' })
}
