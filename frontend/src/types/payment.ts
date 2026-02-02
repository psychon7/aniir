/**
 * Payment entity representing a payment transaction in the ERP system
 */
export interface Payment {
  id: number
  reference: string

  // Related entities
  clientId: number
  clientName: string
  invoiceId?: number
  invoiceReference?: string

  // Payment details
  amount: number
  currencyId: number
  currencyCode: string
  paymentDate: string
  paymentModeId: number
  paymentModeName: string

  // Bank details
  bankAccount?: string
  bankReference?: string
  checkNumber?: string
  transactionId?: string

  // Status
  statusId: number
  statusName: string

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
  isReconciled: boolean
}

/**
 * DTO for creating a new payment
 */
export interface PaymentCreateDto {
  clientId: number
  invoiceId?: number
  amount: number
  currencyId: number
  paymentDate: string
  paymentModeId: number
  bankAccount?: string
  bankReference?: string
  checkNumber?: string
  transactionId?: string
  statusId: number
  businessUnitId?: number
  societyId: number
  notes?: string
}

/**
 * DTO for updating an existing payment
 */
export interface PaymentUpdateDto extends Partial<PaymentCreateDto> {
  id: number
}

/**
 * Search/filter parameters for payment list
 */
export interface PaymentSearchParams {
  search?: string
  clientId?: number
  invoiceId?: number
  statusId?: number
  paymentModeId?: number
  businessUnitId?: number
  societyId?: number
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Payment list item (summary view)
 */
export interface PaymentListItem {
  id: number
  reference: string
  clientName: string
  invoiceReference?: string
  amount: number
  currencyCode: string
  paymentDate: string
  paymentModeName: string
  statusId: number
  statusName: string
  businessUnitName?: string
  isReconciled: boolean
}

/**
 * Payment status lookup
 */
export interface PaymentStatus {
  id: number
  name: string
  color: string
}
