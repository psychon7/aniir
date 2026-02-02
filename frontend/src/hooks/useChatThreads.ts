/**
 * Custom hooks for managing chat threads list
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getThreads,
  getThread,
  createThread,
  updateThread,
  deleteThread,
  getEntityThreads,
  getOrCreateEntityThread,
  type ChatThreadResponse,
  type CreateThreadPayload,
  type UpdateThreadPayload,
} from '@/api/chat'
import type { ChatEntityType } from '@/types/chat'

// Query keys
export const chatThreadsKeys = {
  all: ['chat-threads'] as const,
  lists: () => [...chatThreadsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...chatThreadsKeys.lists(), filters] as const,
  details: () => [...chatThreadsKeys.all, 'detail'] as const,
  detail: (id: number) => [...chatThreadsKeys.details(), id] as const,
  entity: (entityType: ChatEntityType, entityId: number) =>
    [...chatThreadsKeys.all, 'entity', entityType, entityId] as const,
}

/**
 * Hook to fetch all chat threads
 */
export function useChatThreads() {
  return useQuery({
    queryKey: chatThreadsKeys.list(),
    queryFn: getThreads,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for unread counts
  })
}

/**
 * Hook to fetch a single thread
 */
export function useChatThreadDetail(threadId: number) {
  return useQuery({
    queryKey: chatThreadsKeys.detail(threadId),
    queryFn: () => getThread(threadId),
    enabled: !!threadId,
  })
}

/**
 * Hook to fetch threads for a specific entity
 */
export function useEntityChatThreads(entityType: ChatEntityType, entityId: number) {
  return useQuery({
    queryKey: chatThreadsKeys.entity(entityType, entityId),
    queryFn: () => getEntityThreads(entityType, entityId),
    enabled: !!entityType && !!entityId,
  })
}

/**
 * Hook to create a new thread
 */
export function useCreateThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateThreadPayload) => createThread(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatThreadsKeys.lists() })
    },
  })
}

/**
 * Hook to update a thread
 */
export function useUpdateThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      threadId,
      payload,
    }: {
      threadId: number
      payload: UpdateThreadPayload
    }) => updateThread(threadId, payload),
    onSuccess: (_, { threadId }) => {
      queryClient.invalidateQueries({ queryKey: chatThreadsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: chatThreadsKeys.detail(threadId) })
    },
  })
}

/**
 * Hook to delete a thread
 */
export function useDeleteThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (threadId: number) => deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatThreadsKeys.lists() })
    },
  })
}

/**
 * Hook to get or create a thread for an entity
 */
export function useGetOrCreateEntityThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      name,
    }: {
      entityType: ChatEntityType
      entityId: number
      name?: string
    }) => getOrCreateEntityThread(entityType, entityId, name),
    onSuccess: (data, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: chatThreadsKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: chatThreadsKeys.entity(entityType, entityId),
      })
      // Also cache the thread detail
      queryClient.setQueryData(chatThreadsKeys.detail(data.id), data)
    },
  })
}

/**
 * Helper function to format last message time
 */
export function formatThreadTime(dateString: string | null): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Helper to get thread display name
 */
export function getThreadDisplayName(thread: ChatThreadResponse): string {
  if (thread.name) return thread.name

  if (thread.entity_type && thread.entity_id) {
    return `${thread.entity_type} #${thread.entity_id}`
  }

  return `Thread #${thread.id}`
}
