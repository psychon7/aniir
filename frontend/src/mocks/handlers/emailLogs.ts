import { delay } from '../delay'
import { mockEmailLogs, getEmailLogDetailById } from '../data/emailLogs'
import type { EmailLog, EmailLogDetail, EmailLogSearchParams, EmailResendDto } from '@/types/emailLog'
import type { ApiResponse, PagedResponse } from '@/types/api'

// In-memory data store (copy for mutation)
let emailLogs = [...mockEmailLogs]

/**
 * Get all email logs with pagination and filtering
 */
export async function getEmailLogs(params: EmailLogSearchParams = {}): Promise<PagedResponse<EmailLog>> {
  await delay(400)

  let filtered = [...emailLogs]

  // Apply search filter
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (log) =>
        log.subject.toLowerCase().includes(search) ||
        log.fromAddress.toLowerCase().includes(search) ||
        log.toAddresses.some((to) => to.toLowerCase().includes(search)) ||
        log.relatedEntityReference?.toLowerCase().includes(search)
    )
  }

  // Apply status filter
  if (params.status) {
    filtered = filtered.filter((log) => log.status === params.status)
  }

  // Apply related entity type filter
  if (params.relatedEntityType) {
    filtered = filtered.filter((log) => log.relatedEntityType === params.relatedEntityType)
  }

  // Apply date range filter
  if (params.fromDate) {
    const fromDate = new Date(params.fromDate)
    filtered = filtered.filter((log) => new Date(log.createdAt) >= fromDate)
  }
  if (params.toDate) {
    const toDate = new Date(params.toDate)
    toDate.setHours(23, 59, 59, 999) // End of day
    filtered = filtered.filter((log) => new Date(log.createdAt) <= toDate)
  }

  // Apply sorting
  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder || 'desc'
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof EmailLog]
    const bVal = b[sortBy as keyof EmailLog]
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
 * Get a single email log by ID
 */
export async function getEmailLogById(id: number): Promise<ApiResponse<EmailLogDetail>> {
  await delay(300)

  const detail = getEmailLogDetailById(id)
  if (!detail) {
    throw new Error(`Email log with ID ${id} not found`)
  }

  return {
    success: true,
    data: detail,
  }
}

/**
 * Resend an email
 */
export async function resendEmail(dto: EmailResendDto): Promise<ApiResponse<EmailLog>> {
  await delay(600)

  const index = emailLogs.findIndex((log) => log.id === dto.emailLogId)
  if (index === -1) {
    throw new Error(`Email log with ID ${dto.emailLogId} not found`)
  }

  const originalLog = emailLogs[index]

  // Create a new log entry for the resend
  const newId = Math.max(...emailLogs.map((l) => l.id)) + 1
  const resendLog: EmailLog = {
    ...originalLog,
    id: newId,
    status: 'queued',
    statusMessage: undefined,
    toAddresses: dto.toAddresses || originalLog.toAddresses,
    sentAt: undefined,
    createdAt: new Date().toISOString(),
    createdBy: 'User (Resend)',
    retryCount: 0,
    lastRetryAt: undefined,
  }

  emailLogs.unshift(resendLog)

  // Simulate async sending - update status after a delay
  setTimeout(() => {
    const logIndex = emailLogs.findIndex((l) => l.id === newId)
    if (logIndex !== -1) {
      emailLogs[logIndex] = {
        ...emailLogs[logIndex],
        status: 'sent',
        sentAt: new Date().toISOString(),
      }
    }
  }, 2000)

  return {
    success: true,
    data: resendLog,
    message: 'Email queued for resending',
  }
}

/**
 * Get email log statistics
 */
export async function getEmailLogStats(): Promise<
  ApiResponse<{
    total: number
    sent: number
    delivered: number
    failed: number
    bounced: number
    pending: number
    queued: number
  }>
> {
  await delay(200)

  const stats = {
    total: emailLogs.length,
    sent: emailLogs.filter((l) => l.status === 'sent').length,
    delivered: emailLogs.filter((l) => l.status === 'delivered').length,
    failed: emailLogs.filter((l) => l.status === 'failed').length,
    bounced: emailLogs.filter((l) => l.status === 'bounced').length,
    pending: emailLogs.filter((l) => l.status === 'pending').length,
    queued: emailLogs.filter((l) => l.status === 'queued').length,
  }

  return {
    success: true,
    data: stats,
  }
}

/**
 * Export email logs to CSV
 */
export async function exportEmailLogsToCSV(params: EmailLogSearchParams = {}): Promise<string> {
  await delay(600)

  // Get filtered data (without pagination)
  const result = await getEmailLogs({ ...params, page: 1, pageSize: 10000 })

  const headers = [
    'ID',
    'Subject',
    'From',
    'To',
    'CC',
    'Status',
    'Related Type',
    'Related Reference',
    'Sent At',
    'Created At',
    'Created By',
    'Has Attachments',
    'Retry Count',
  ]

  const rows = result.data.map((log) => [
    log.id.toString(),
    log.subject,
    log.fromAddress,
    log.toAddresses.join('; '),
    log.ccAddresses?.join('; ') || '',
    log.status,
    log.relatedEntityType || '',
    log.relatedEntityReference || '',
    log.sentAt || '',
    log.createdAt,
    log.createdBy || '',
    log.hasAttachments ? 'Yes' : 'No',
    log.retryCount.toString(),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Reset mock data to initial state
 */
export function resetMockEmailLogs(): void {
  emailLogs = [...mockEmailLogs]
}
