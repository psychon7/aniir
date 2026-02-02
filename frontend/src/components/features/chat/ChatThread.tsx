/**
 * ChatThread component - Full chat interface for a thread
 * Integrates message list, typing indicators, and message input
 */

import { useRef } from 'react'
import { Users, WifiOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatThread, useSendMessage, useDeleteMessage, useChat } from '@/hooks/useChat'
import { useAuthStore } from '@/stores/authStore'
import { MessageList, type MessageListRef } from './MessageList'
import { ChatInput } from './ChatInput'

interface ChatThreadProps {
  threadId: number
  className?: string
}

export function ChatThread({ threadId, className }: ChatThreadProps) {
  const { isConnected, isConnecting, connectionError } = useChat()
  const { messages, typingUsers, onlineUsers, unreadCount, markAsRead } = useChatThread(threadId)
  const { send, onTyping } = useSendMessage(threadId)
  const { remove, canDelete } = useDeleteMessage()
  const { user } = useAuthStore()

  const messageListRef = useRef<MessageListRef>(null)

  const handleDeleteMessage = (messageId: number) => {
    remove(messageId)
  }

  // Connection status display
  if (!isConnected && !isConnecting) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Not Connected
            </h3>
            <p className="text-sm text-muted-foreground">
              {connectionError || 'Unable to connect to chat server'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isConnecting) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Connecting...
            </h3>
            <p className="text-sm text-muted-foreground">
              Establishing connection to chat server
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)} data-testid="chat-thread">
      {/* Header with online users */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-foreground">Chat</h2>
          <span className="text-sm text-muted-foreground">
            Thread #{threadId}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{onlineUsers.length} online</span>
        </div>
      </div>

      {/* Messages area */}
      <MessageList
        ref={messageListRef}
        messages={messages}
        currentUserId={user?.id}
        typingUsers={typingUsers}
        onDeleteMessage={handleDeleteMessage}
        canDeleteMessage={canDelete}
      />

      {/* Message input */}
      <ChatInput
        onSendMessage={send}
        onTyping={onTyping}
        disabled={!isConnected}
        placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
      />
    </div>
  )
}

// Export individual components for flexibility
export { ChatMessage, TypingIndicator } from './ChatMessage'
export { ChatInput } from './ChatInput'
export { MessageList } from './MessageList'
