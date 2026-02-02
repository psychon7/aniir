/**
 * Mock handlers for chat API
 */
import { delay } from '../delay'
import { mockChatThreads, getNextThreadId } from '../data/chat'
import type { ChatThreadResponse, CreateThreadPayload, UpdateThreadPayload } from '@/api/chat'
import type { ApiResponse } from '@/types/api'

// In-memory data store
let threads = [...mockChatThreads]

/**
 * Get all threads for the current user
 */
export async function getThreads(): Promise<ChatThreadResponse[]> {
  await delay(400)

  // Sort by last_message_at descending
  return [...threads].sort((a, b) => {
    const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
    return timeB - timeA
  })
}

/**
 * Get a single thread by ID
 */
export async function getThread(threadId: number): Promise<ApiResponse<ChatThreadResponse>> {
  await delay(300)

  const thread = threads.find((t) => t.id === threadId)
  if (!thread) {
    throw new Error(`Thread with ID ${threadId} not found`)
  }

  return {
    success: true,
    data: thread,
  }
}

/**
 * Create a new thread
 */
export async function createThread(payload: CreateThreadPayload): Promise<ApiResponse<ChatThreadResponse>> {
  await delay(500)

  const newThread: ChatThreadResponse = {
    id: getNextThreadId(),
    name: payload.name || null,
    entity_type: payload.entity_type || 'General',
    entity_id: payload.entity_id || null,
    created_by: 1, // Current user
    created_at: new Date().toISOString(),
    last_message_at: null,
    unread_count: 0,
    last_message: null,
    participants_count: 1,
  }

  threads.push(newThread)

  return {
    success: true,
    data: newThread,
    message: 'Thread created successfully',
  }
}

/**
 * Update a thread
 */
export async function updateThread(
  threadId: number,
  payload: UpdateThreadPayload
): Promise<ApiResponse<ChatThreadResponse>> {
  await delay(400)

  const index = threads.findIndex((t) => t.id === threadId)
  if (index === -1) {
    throw new Error(`Thread with ID ${threadId} not found`)
  }

  const updated: ChatThreadResponse = {
    ...threads[index],
    name: payload.name !== undefined ? payload.name : threads[index].name,
  }

  threads[index] = updated

  return {
    success: true,
    data: updated,
    message: 'Thread updated successfully',
  }
}

/**
 * Delete a thread
 */
export async function deleteThread(threadId: number): Promise<ApiResponse<void>> {
  await delay(300)

  const index = threads.findIndex((t) => t.id === threadId)
  if (index === -1) {
    throw new Error(`Thread with ID ${threadId} not found`)
  }

  threads.splice(index, 1)

  return {
    success: true,
    data: undefined,
    message: 'Thread deleted successfully',
  }
}

/**
 * Get threads for a specific entity
 */
export async function getEntityThreads(
  entityType: string,
  entityId: number
): Promise<ChatThreadResponse[]> {
  await delay(300)

  return threads.filter(
    (t) => t.entity_type === entityType && t.entity_id === entityId
  )
}

/**
 * Get or create a thread for a specific entity
 */
export async function getOrCreateEntityThread(
  entityType: string,
  entityId: number,
  name?: string
): Promise<ApiResponse<ChatThreadResponse>> {
  await delay(400)

  // Check if thread exists
  let thread = threads.find(
    (t) => t.entity_type === entityType && t.entity_id === entityId
  )

  if (!thread) {
    // Create new thread
    thread = {
      id: getNextThreadId(),
      name: name || null,
      entity_type: entityType as ChatThreadResponse['entity_type'],
      entity_id: entityId,
      created_by: 1,
      created_at: new Date().toISOString(),
      last_message_at: null,
      unread_count: 0,
      last_message: null,
      participants_count: 1,
    }
    threads.push(thread)
  }

  return {
    success: true,
    data: thread,
  }
}

/**
 * Reset mock data to initial state
 */
export function resetMockChatThreads(): void {
  threads = [...mockChatThreads]
}
