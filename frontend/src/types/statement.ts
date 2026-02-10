/**
 * Statement entity representing an accounting statement in the ERP system
 * Statements provide a summary of financial transactions for a specific period
 */
export interface Statement {
  id: number
  reference: string

  // Related entities
  clientId: number
  clientName: string

  // Statement details
  statementDate: string
  periodStart: string
  periodEnd: string

  // Financial summary
  openingBalance: number
  totalDebits: number
  totalCredits: number
  closingBalance: number
  currencyId: number
  currencyCode: string

  // Status
  statusId: number
  statusName: string

  // Type of statement
  statementTypeId: number
  statementTypeName: string

  // Organization
  businessUnitId?: number
  businessUnitName?: string
  societyId: number
  societyName: string

  // Notes
  notes?: string

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy?: string
  sentAt?: string
  sentTo?: string

  // Related items count
  transactionCount?: number
}

/**
 * Statement list item (summary view)
 */
export interface StatementListItem {
  id: number
  reference: string
  clientId: number
  clientName: string
  statementDate: string
  periodStart: string
  periodEnd: string
  openingBalance: number
  closingBalance: number
  currencyCode: string
  statusId: number
  statusName: string
  statementTypeName: string
  businessUnitName?: string
  transactionCount?: number
}

/**
 * Statement transaction line item
 */
export interface StatementTransaction {
  id: number
  statementId: number
  transactionDate: string
  reference: string
  description: string
  debit: number
  credit: number
  balance: number
  transactionType: string
  sourceDocument?: string
  sourceDocumentId?: number
}

/**
 * DTO for creating a new statement
 */
export interface StatementCreateDto {
  clientId: number
  statementDate: string
  periodStart: string
  periodEnd: string
  openingBalance: number
  currencyId: number
  statementTypeId: number
  statusId: number
  businessUnitId?: number
  societyId: number
  notes?: string
}

/**
 * DTO for updating an existing statement
 */
export interface StatementUpdateDto extends Partial<StatementCreateDto> {
  id: number
}

/**
 * Search/filter parameters for statement list
 */
export interface StatementSearchParams {
  search?: string
  clientId?: number
  statusId?: number
  statementTypeId?: number
  businessUnitId?: number
  societyId?: number
  dateFrom?: string
  dateTo?: string
  periodFrom?: string
  periodTo?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Statement status lookup
 */
export interface StatementStatus {
  id: number
  name: string
  color: string
}

/**
 * Statement type lookup
 */
export interface StatementType {
  id: number
  name: string
}

/**
 * Request parameters for customer statement generation.
 */
export interface StatementGenerationParams {
  fromDate: string
  toDate: string
  includePaid?: boolean
  societyId?: number
}

/**
 * Transaction row from generated customer statement.
 */
export interface CustomerStatementTransaction {
  date: string
  type: string
  reference: string
  description: string
  debit: number
  credit: number
  balance: number
  due_date?: string | null
  document_id?: number | null
  days_overdue?: number
}

/**
 * Generated customer statement payload from backend.
 */
export interface CustomerStatementReport {
  statement_type: string
  client: {
    id: number
    reference?: string
    company_name?: string
    address?: string
    city?: string
    postal_code?: string
    country?: string
    email?: string
  }
  period: {
    from_date: string
    to_date: string
  }
  opening_balance: number
  transactions: CustomerStatementTransaction[]
  totals: {
    total_debits: number
    total_credits: number
    net_change: number
    transaction_count: number
  }
  closing_balance: number
  aging_summary: {
    current: number
    days_31_60: number
    days_61_90: number
    over_90: number
  }
  filters: {
    include_paid_invoices?: boolean
    society_id?: number | null
  }
  generated_at: string
}
