/**
 * Email Log entity representing sent email records in the ERP system
 */
export interface EmailLog {
  id: number
  subject: string
  fromAddress: string
  toAddresses: string[]
  ccAddresses?: string[]
  bccAddresses?: string[]
  status: EmailStatus
  statusMessage?: string

  // Related entities
  relatedEntityType?: EmailRelatedEntityType
  relatedEntityId?: number
  relatedEntityReference?: string

  // Content
  bodyPreview?: string
  hasAttachments: boolean
  attachmentCount?: number

  // Metadata
  sentAt?: string
  createdAt: string
  createdBy?: string
  retryCount: number
  lastRetryAt?: string
}

/**
 * Email status enumeration
 */
export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'queued'

/**
 * Related entity types that can trigger emails
 */
export type EmailRelatedEntityType =
  | 'invoice'
  | 'quote'
  | 'order'
  | 'payment'
  | 'client'
  | 'supplier'
  | 'shipment'
  | 'system'

/**
 * Email log list item (summary view for table)
 */
export interface EmailLogListItem {
  id: number
  subject: string
  fromAddress: string
  toAddresses: string[]
  status: EmailStatus
  relatedEntityType?: EmailRelatedEntityType
  relatedEntityReference?: string
  hasAttachments: boolean
  sentAt?: string
  createdAt: string
}

/**
 * Search/filter parameters for email log list
 */
export interface EmailLogSearchParams {
  search?: string
  status?: EmailStatus
  relatedEntityType?: EmailRelatedEntityType
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Email log detail with full content
 */
export interface EmailLogDetail extends EmailLog {
  bodyHtml?: string
  bodyText?: string
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
}

/**
 * Email attachment info
 */
export interface EmailAttachment {
  id: number
  filename: string
  contentType: string
  size: number
  downloadUrl?: string
}

/**
 * DTO for resending an email
 */
export interface EmailResendDto {
  emailLogId: number
  toAddresses?: string[]  // Override recipients if provided
}
