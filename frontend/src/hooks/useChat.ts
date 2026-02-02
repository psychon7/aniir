/**
 * Custom hook for chat functionality
 * Provides a convenient interface for sending messages and managing chat state
 */

import { useCallback, useEffect, useRef, useMemo } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import type { ChatMessage } from '@/types/chat'

/**
 * Main chat hook for connecting and managing chat state
 */
export function useChat() {
  const {
    isConnected,
    isConnecting,
    connectionError,
    currentUser,
    connect,
    disconnect,
  } = useChatStore()

  const { accessToken, isAuthenticated } = useAuthStore()

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken && !isConnected && !isConnecting) {
      connect(accessToken)
    }
  }, [isAuthenticated, accessToken, isConnected, isConnecting, connect])

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated && isConnected) {
      disconnect()
    }
  }, [isAuthenticated, isConnected, disconnect])

  return {
    isConnected,
    isConnecting,
    connectionError,
    currentUser,
    connect: useCallback(() => {
      if (accessToken) {
        connect(accessToken)
      }
    }, [accessToken, connect]),
    disconnect,
  }
}

/**
 * Hook for managing a specific chat thread
 */
export function useChatThread(threadId: number) {
  const {
    isConnected,
    activeThreadId,
    currentUser,
    messages: allMessages,
    typingUsers: allTypingUsers,
    threadUsers: allThreadUsers,
    unreadCounts: allUnreadCounts,
    joinThread,
    leaveThread,
    getThreadUsers,
    markRead,
    getReadReceipts,
  } = useChatStore()

  // Track last marked message to avoid redundant calls
  const lastMarkedMessageRef = useRef<number | null>(null)

  // Get messages for this thread
  const messages = useMemo(() => {
    return allMessages.get(threadId) || []
  }, [allMessages, threadId])

  // Get typing users for this thread
  const typingUsers = useMemo(() => {
    return allTypingUsers.get(threadId) || []
  }, [allTypingUsers, threadId])

  // Get online users for this thread
  const onlineUsers = useMemo(() => {
    return allThreadUsers.get(threadId) || []
  }, [allThreadUsers, threadId])

  // Get unread count for this thread
  const unreadCount = useMemo(() => {
    return allUnreadCounts.get(threadId) || 0
  }, [allUnreadCounts, threadId])

  // Join thread when component mounts
  useEffect(() => {
    if (isConnected && threadId) {
      joinThread(threadId)
      getThreadUsers(threadId)
      // Get read receipts for this thread's messages
      getReadReceipts(threadId)
    }

    return () => {
      if (isConnected && threadId) {
        leaveThread(threadId)
      }
    }
  }, [isConnected, threadId, joinThread, leaveThread, getThreadUsers, getReadReceipts])

  // Auto-mark messages as read when new messages arrive and thread is active
  useEffect(() => {
    if (!isConnected || !threadId || !currentUser) return

    // Get the last message that's not from the current user
    const unreadMessages = messages.filter(
      m => m.user.id !== currentUser.id && !m.is_read && !m.deleted_at
    )

    if (unreadMessages.length > 0) {
      const lastUnreadMessage = unreadMessages[unreadMessages.length - 1]

      // Only mark if we haven't already marked this message
      if (lastMarkedMessageRef.current !== lastUnreadMessage.message_id) {
        lastMarkedMessageRef.current = lastUnreadMessage.message_id
        markRead(threadId, lastUnreadMessage.message_id)
      }
    }
  }, [isConnected, threadId, messages, currentUser, markRead])

  const isActive = activeThreadId === threadId

  // Manual mark as read function
  const markAsRead = useCallback(
    (messageId?: number) => {
      if (isConnected && threadId) {
        markRead(threadId, messageId)
      }
    },
    [isConnected, threadId, markRead]
  )

  return {
    messages,
    typingUsers,
    onlineUsers,
    unreadCount,
    isActive,
    isConnected,
    markAsRead,
  }
}

/**
 * Hook for sending messages with typing indicator support
 */
export function useSendMessage(threadId: number) {
  const { isConnected, sendMessage, startTyping, stopTyping } = useChatStore()

  // Debounce typing indicator
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isConnected || !threadId) return

    // Start typing if not already
    if (!isTypingRef.current) {
      isTypingRef.current = true
      startTyping(threadId)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        stopTyping(threadId)
      }
    }, 2000)
  }, [isConnected, threadId, startTyping, stopTyping])

  // Send message handler
  const send = useCallback(
    (content: string, attachments?: number[]) => {
      if (!isConnected || !threadId) return false

      const trimmedContent = content.trim()
      if (!trimmedContent && (!attachments || attachments.length === 0)) {
        return false
      }

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTypingRef.current) {
        isTypingRef.current = false
        stopTyping(threadId)
      }

      // Send the message
      sendMessage(threadId, trimmedContent, attachments)
      return true
    },
    [isConnected, threadId, sendMessage, stopTyping]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTypingRef.current && threadId) {
        stopTyping(threadId)
      }
    }
  }, [threadId, stopTyping])

  return {
    send,
    onTyping: handleTyping,
    isConnected,
  }
}

/**
 * Hook for deleting messages
 */
export function useDeleteMessage() {
  const { isConnected, deleteMessage, currentUser } = useChatStore()
  const { user } = useAuthStore()

  const canDelete = useCallback(
    (message: ChatMessage) => {
      if (!currentUser && !user) return false

      const userId = currentUser?.id || user?.id
      const isAdmin = user?.roleId === 1

      // User can delete own messages or admin can delete any
      return message.user.id === userId || isAdmin
    },
    [currentUser, user]
  )

  const remove = useCallback(
    (messageId: number) => {
      if (!isConnected) return false
      deleteMessage(messageId)
      return true
    },
    [isConnected, deleteMessage]
  )

  return {
    remove,
    canDelete,
    isConnected,
  }
}

/**
 * Hook for managing read receipts
 */
export function useReadReceipts(threadId: number) {
  const {
    isConnected,
    currentUser,
    readReceipts: allReadReceipts,
    markRead,
    getReadReceipts,
  } = useChatStore()

  // Get read receipts for a specific message
  const getReceiptsForMessage = useCallback(
    (messageId: number) => {
      return allReadReceipts.get(messageId) || []
    },
    [allReadReceipts]
  )

  // Check if a message has been read by anyone
  const isMessageRead = useCallback(
    (messageId: number) => {
      const receipts = allReadReceipts.get(messageId)
      return receipts && receipts.length > 0
    },
    [allReadReceipts]
  )

  // Mark messages as read
  const markMessagesRead = useCallback(
    (messageId?: number) => {
      if (isConnected && threadId) {
        markRead(threadId, messageId)
      }
    },
    [isConnected, threadId, markRead]
  )

  // Refresh read receipts
  const refreshReceipts = useCallback(
    (messageIds?: number[]) => {
      if (isConnected && threadId) {
        getReadReceipts(threadId, messageIds)
      }
    },
    [isConnected, threadId, getReadReceipts]
  )

  return {
    getReceiptsForMessage,
    isMessageRead,
    markMessagesRead,
    refreshReceipts,
    currentUserId: currentUser?.id,
  }
}
