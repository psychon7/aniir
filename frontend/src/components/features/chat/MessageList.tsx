/**
 * MessageList component for displaying a scrollable list of chat messages
 * with date grouping, auto-scroll, and typing indicators
 */

import { useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { MessageSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMessage } from './ChatMessage'
import { TypingIndicator } from './ChatMessage'
import type { ChatMessage as ChatMessageType, ChatUser } from '@/types/chat'

interface MessageListProps {
  messages: ChatMessageType[]
  currentUserId: number | undefined
  typingUsers?: ChatUser[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onDeleteMessage?: (messageId: number) => void
  canDeleteMessage?: (message: ChatMessageType) => boolean
  className?: string
  emptyMessage?: string
  emptySubMessage?: string
}

export interface MessageListRef {
  scrollToBottom: (behavior?: ScrollBehavior) => void
  scrollToMessage: (messageId: number, behavior?: ScrollBehavior) => void
}

/**
 * Format date for message group header
 */
function formatDateHeader(date: Date): string {
  if (isToday(date)) {
    return 'Today'
  }
  if (isYesterday(date)) {
    return 'Yesterday'
  }
  return format(date, 'EEEE, MMMM d, yyyy')
}

/**
 * Group messages by date
 */
interface MessageGroup {
  date: Date
  messages: ChatMessageType[]
}

function groupMessagesByDate(messages: ChatMessageType[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  let currentGroup: MessageGroup | null = null

  for (const message of messages) {
    const messageDate = new Date(message.created_at)

    if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
      currentGroup = {
        date: messageDate,
        messages: [message],
      }
      groups.push(currentGroup)
    } else {
      currentGroup.messages.push(message)
    }
  }

  return groups
}

export const MessageList = forwardRef<MessageListRef, MessageListProps>(function MessageList(
  {
    messages,
    currentUserId,
    typingUsers = [],
    isLoading = false,
    hasMore = false,
    onLoadMore,
    onDeleteMessage,
    canDeleteMessage,
    className,
    emptyMessage = 'No messages yet',
    emptySubMessage = 'Be the first to send a message!',
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef(messages.length)
  const userScrolledRef = useRef(false)

  // Sort messages by created_at
  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [messages])

  // Group messages by date
  const messageGroups = useMemo(() => {
    return groupMessagesByDate(sortedMessages)
  }, [sortedMessages])

  // Filter out current user from typing users
  const filteredTypingUsers = useMemo(() => {
    if (!currentUserId) return typingUsers
    return typingUsers.filter(u => u.id !== currentUserId)
  }, [typingUsers, currentUserId])

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  // Scroll to a specific message
  const scrollToMessage = useCallback((messageId: number, behavior: ScrollBehavior = 'smooth') => {
    const messageElement = containerRef.current?.querySelector(
      `[data-message-id="${messageId}"]`
    )
    if (messageElement) {
      messageElement.scrollIntoView({ behavior, block: 'center' })
    }
  }, [])

  // Expose scroll methods via ref
  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom,
      scrollToMessage,
    }),
    [scrollToBottom, scrollToMessage]
  )

  // Check if user is near the bottom
  const isNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100
  }, [])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    // Track if user has scrolled up
    userScrolledRef.current = !isNearBottom()

    // Load more messages when scrolled to top
    if (container.scrollTop < 50 && hasMore && onLoadMore && !isLoading) {
      onLoadMore()
    }
  }, [hasMore, onLoadMore, isLoading, isNearBottom])

  // Auto-scroll when new messages arrive (if near bottom)
  useEffect(() => {
    const newMessagesCount = messages.length - prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messages.length

    if (newMessagesCount > 0) {
      // If user hasn't scrolled up or if the new message is from the current user
      const latestMessage = sortedMessages[sortedMessages.length - 1]
      const isOwnMessage = latestMessage?.user.id === currentUserId

      if (!userScrolledRef.current || isOwnMessage) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => scrollToBottom('smooth'), 0)
      }
    }
  }, [messages.length, sortedMessages, currentUserId, scrollToBottom])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && prevMessagesLengthRef.current === 0) {
      scrollToBottom('instant')
    }
  }, [messages.length, scrollToBottom])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !hasMore || !onLoadMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreTriggerRef.current)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore, isLoading])

  // Handle delete message
  const handleDelete = useCallback(
    (messageId: number) => {
      onDeleteMessage?.(messageId)
    },
    [onDeleteMessage]
  )

  // Check if can delete message
  const checkCanDelete = useCallback(
    (message: ChatMessageType) => {
      if (canDeleteMessage) {
        return canDeleteMessage(message)
      }
      // Default: can delete own messages
      return message.user.id === currentUserId
    },
    [canDeleteMessage, currentUserId]
  )

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        'flex-1 overflow-y-auto px-4 py-4',
        className
      )}
      data-testid="message-list"
      role="log"
      aria-label="Message list"
      aria-live="polite"
    >
      {/* Load more trigger / Loading indicator */}
      {hasMore && (
        <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading older messages...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1"
            >
              Load more messages
            </button>
          )}
        </div>
      )}

      {/* Loading state (initial load) */}
      {isLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
          <p className="text-xs text-muted-foreground mt-1">{emptySubMessage}</p>
        </div>
      )}

      {/* Message groups by date */}
      {messageGroups.map((group) => (
        <div key={group.date.toISOString()} className="mb-4">
          {/* Date header */}
          <div className="flex items-center justify-center my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="px-4 text-xs font-medium text-muted-foreground">
              {formatDateHeader(group.date)}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Messages in this group */}
          {group.messages.map((message) => (
            <div
              key={message.message_id}
              data-message-id={message.message_id}
            >
              <ChatMessage
                message={message}
                isOwnMessage={message.user.id === currentUserId}
                canDelete={checkCanDelete(message)}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Typing indicator */}
      {filteredTypingUsers.length > 0 && (
        <TypingIndicator users={filteredTypingUsers} />
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
})

// Re-export types for convenience
export type { MessageListProps }
