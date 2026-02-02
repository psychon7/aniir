/**
 * Chat API service for thread management and attachments
 */
import apiClient from './client'
import type { ChatEntityType, ChatAttachment } from '@/types/chat'

// API response types
export interface ChatThreadResponse {
  id: number
  name: string | null
  entity_type: ChatEntityType | null
  entity_id: number | null
  created_by: number
  created_at: string
  last_message_at: string | null
  unread_count: number
  last_message?: {
    content: string
    user: {
      id: number
      username: string
      display_name: string
    }
    created_at: string
  } | null
  participants_count: number
}

export interface CreateThreadPayload {
  name?: string
  entity_type?: ChatEntityType
  entity_id?: number
}

export interface UpdateThreadPayload {
  name?: string
}

// Get all threads for the current user
export async function getThreads(): Promise<ChatThreadResponse[]> {
  const response = await apiClient.get('/chat/threads')
  return response.data.data || response.data
}

// Get a specific thread by ID
export async function getThread(threadId: number): Promise<ChatThreadResponse> {
  const response = await apiClient.get(`/chat/threads/${threadId}`)
  return response.data.data || response.data
}

// Create a new thread
export async function createThread(payload: CreateThreadPayload): Promise<ChatThreadResponse> {
  const response = await apiClient.post('/chat/threads', payload)
  return response.data.data || response.data
}

// Update a thread
export async function updateThread(threadId: number, payload: UpdateThreadPayload): Promise<ChatThreadResponse> {
  const response = await apiClient.patch(`/chat/threads/${threadId}`, payload)
  return response.data.data || response.data
}

// Delete a thread
export async function deleteThread(threadId: number): Promise<void> {
  await apiClient.delete(`/chat/threads/${threadId}`)
}

// Get threads for a specific entity
export async function getEntityThreads(
  entityType: ChatEntityType,
  entityId: number
): Promise<ChatThreadResponse[]> {
  const response = await apiClient.get('/chat/threads', {
    params: {
      entity_type: entityType,
      entity_id: entityId,
    },
  })
  return response.data.data || response.data
}

// Get or create a thread for a specific entity
export async function getOrCreateEntityThread(
  entityType: ChatEntityType,
  entityId: number,
  name?: string
): Promise<ChatThreadResponse> {
  const response = await apiClient.post('/chat/threads/get-or-create', {
    entity_type: entityType,
    entity_id: entityId,
    name,
  })
  return response.data.data || response.data
}

// ============ Attachment Operations ============

export interface AttachmentUploadResponse {
  id: number
  name: string
  size: number
  mime_type: string
  url: string
  thumbnail_url?: string
}

export interface AttachmentUploadProgress {
  loaded: number
  total: number
  percentage: number
}

// Upload a file attachment for chat
export async function uploadAttachment(
  file: File,
  onProgress?: (progress: AttachmentUploadProgress) => void
): Promise<AttachmentUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<AttachmentUploadResponse>('/chat/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        onProgress({
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
        })
      }
    },
  })

  return response.data
}

// Get attachment details by ID
export async function getAttachment(attachmentId: number): Promise<ChatAttachment> {
  const response = await apiClient.get(`/chat/attachments/${attachmentId}`)
  return response.data.data || response.data
}

// Get multiple attachments by IDs
export async function getAttachments(attachmentIds: number[]): Promise<ChatAttachment[]> {
  if (attachmentIds.length === 0) return []

  const response = await apiClient.get('/chat/attachments', {
    params: { ids: attachmentIds.join(',') },
  })
  return response.data.data || response.data
}

// Delete an attachment
export async function deleteAttachment(attachmentId: number): Promise<void> {
  await apiClient.delete(`/chat/attachments/${attachmentId}`)
}

// ============ Read Receipt Operations ============

export interface MarkReadResponse {
  message: string
  marked_count: number
  read_at: string
}

export interface UnreadCountResponse {
  thread_id: number
  unread_count: number
}

export interface ReadReceiptUser {
  user_id: number
  username: string
  read_at: string
}

export interface MessageReadReceiptsResponse {
  message_id: number
  read_by: ReadReceiptUser[]
  read_count: number
}

// Mark a message as read (also marks all messages before it)
export async function markMessageRead(
  threadId: number,
  messageId: number
): Promise<MarkReadResponse> {
  const response = await apiClient.post(
    `/chat/threads/${threadId}/messages/${messageId}/read`
  )
  return response.data
}

// Get unread count for a thread
export async function getUnreadCount(threadId: number): Promise<UnreadCountResponse> {
  const response = await apiClient.get(`/chat/threads/${threadId}/unread-count`)
  return response.data
}

// Get read receipts for a specific message
export async function getMessageReadReceipts(
  threadId: number,
  messageId: number
): Promise<MessageReadReceiptsResponse> {
  const response = await apiClient.get(
    `/chat/threads/${threadId}/messages/${messageId}/read-receipts`
  )
  return response.data
}
