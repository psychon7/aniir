/**
 * Chat store with Socket.IO connection management
 * Handles real-time messaging, typing indicators, and user presence
 */

import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import type {
  ChatMessage,
  ChatState,
  ChatActions,
  ConnectionEstablishedResponse,
  JoinedThreadResponse,
  UserJoinedResponse,
  UserLeftResponse,
  NewMessageResponse,
  MessageDeletedResponse,
  ThreadUsersResponse,
  ChatErrorResponse,
  TypingUser,
  MessagesReadResponse,
  ReadConfirmedResponse,
  ReadReceiptsResponse,
  ReadReceipt,
} from '@/types/chat'

// Socket.IO instance (singleton)
let socket: Socket | null = null

// Reconnection state to prevent flooding
let reconnectAttempts = 0
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 2000
const MAX_RECONNECT_DELAY = 30000

// Get the WebSocket URL from environment or use default
const getSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin
  return baseUrl.replace(/^http/, 'ws').replace(/\/api\/v1$/, '') || baseUrl
}

interface ChatStore extends ChatState, ChatActions {}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  currentUser: null,
  activeThreadId: null,
  threads: new Map(),
  messages: new Map(),
  typingUsers: new Map(),
  threadUsers: new Map(),
  readReceipts: new Map(),
  unreadCounts: new Map(),

  // Connect to Socket.IO server
  connect: (token: string) => {
    // Prevent multiple connections
    if (socket?.connected || get().isConnecting) {
      return
    }

    // Check if we've exceeded max reconnect attempts
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('WebSocket: Max reconnection attempts reached. Use manual reconnect.')
      set({ 
        isConnecting: false, 
        connectionError: 'Connection failed after multiple attempts. Please refresh the page.' 
      })
      return
    }

    // Clear any pending reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    set({ isConnecting: true, connectionError: null })

    // Create socket connection - disable auto-reconnection, we handle it manually
    const socketUrl = getSocketUrl()
    socket = io(socketUrl, {
      path: '/ws/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false, // Disable auto-reconnection to prevent flooding
      timeout: 10000,
    })

    // Connection established
    socket.on('connection_established', (data: ConnectionEstablishedResponse) => {
      reconnectAttempts = 0 // Reset on successful connection
      set({
        isConnected: true,
        isConnecting: false,
        connectionError: null,
        currentUser: data.user,
      })
    })

    // Connection error - use exponential backoff
    socket.on('connect_error', (error: Error) => {
      reconnectAttempts++
      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1),
        MAX_RECONNECT_DELAY
      )
      
      console.warn(`WebSocket connection failed (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}). Retrying in ${delay/1000}s...`)
      
      set({
        isConnected: false,
        isConnecting: false,
        connectionError: error.message || 'Connection failed',
      })

      // Schedule reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeout = setTimeout(() => {
          const currentToken = socket?.auth?.token as string
          if (currentToken) {
            get().connect(currentToken)
          }
        }, delay)
      }
    })

    // Disconnected - attempt reconnect for unexpected disconnections
    socket.on('disconnect', (reason: string) => {
      const shouldReconnect = reason !== 'io server disconnect' && reason !== 'io client disconnect'
      
      set({
        isConnected: false,
        isConnecting: false,
        connectionError: shouldReconnect ? null : 'Disconnected',
      })

      // Only auto-reconnect for unexpected disconnections
      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
          MAX_RECONNECT_DELAY
        )
        reconnectTimeout = setTimeout(() => {
          const currentToken = socket?.auth?.token as string
          if (currentToken) {
            reconnectAttempts++
            get().connect(currentToken)
          }
        }, delay)
      }
    })

    // Joined thread confirmation
    socket.on('joined_thread', (data: JoinedThreadResponse) => {
      const threads = new Map(get().threads)
      threads.set(data.thread_id, {
        id: data.thread_id,
        name: data.thread_name,
        entityType: data.entity_type,
        entityId: data.entity_id,
        createdBy: 0,
        createdAt: new Date().toISOString(),
      })
      set({ activeThreadId: data.thread_id, threads })
    })

    // Left thread confirmation
    socket.on('left_thread', (data: { thread_id: number }) => {
      if (get().activeThreadId === data.thread_id) {
        set({ activeThreadId: null })
      }
    })

    // User joined thread
    socket.on('user_joined', (data: UserJoinedResponse) => {
      const users = new Map(get().threadUsers)
      const threadUsers = users.get(data.thread_id) || []
      if (!threadUsers.find(u => u.id === data.user.id)) {
        users.set(data.thread_id, [...threadUsers, data.user])
        set({ threadUsers: users })
      }
    })

    // User left thread
    socket.on('user_left', (data: UserLeftResponse) => {
      const users = new Map(get().threadUsers)
      const threadUsers = users.get(data.thread_id) || []
      users.set(data.thread_id, threadUsers.filter(u => u.id !== data.user.id))
      set({ threadUsers: users })
    })

    // New message received
    socket.on('new_message', (data: NewMessageResponse) => {
      const messages = new Map(get().messages)
      const threadMessages = messages.get(data.thread_id) || []

      // Avoid duplicates
      if (!threadMessages.find(m => m.message_id === data.message_id)) {
        const newMessage: ChatMessage = {
          message_id: data.message_id,
          thread_id: data.thread_id,
          content: data.content,
          attachments: data.attachments,
          created_at: data.created_at,
          user: data.user,
        }
        messages.set(data.thread_id, [...threadMessages, newMessage])
        set({ messages })
      }
    })

    // Message deleted
    socket.on('message_deleted', (data: MessageDeletedResponse) => {
      const messages = new Map(get().messages)
      const threadMessages = messages.get(data.thread_id) || []
      messages.set(
        data.thread_id,
        threadMessages.map(m =>
          m.message_id === data.message_id
            ? { ...m, deleted_at: new Date().toISOString() }
            : m
        )
      )
      set({ messages })
    })

    // User typing
    socket.on('user_typing', (data: TypingUser) => {
      const typing = new Map(get().typingUsers)
      const threadTyping = typing.get(data.thread_id) || []
      if (!threadTyping.find(u => u.id === data.user.id)) {
        typing.set(data.thread_id, [...threadTyping, data.user])
        set({ typingUsers: typing })
      }
    })

    // User stopped typing
    socket.on('user_stopped_typing', (data: { thread_id: number; user: { id: number; username: string } }) => {
      const typing = new Map(get().typingUsers)
      const threadTyping = typing.get(data.thread_id) || []
      typing.set(data.thread_id, threadTyping.filter(u => u.id !== data.user.id))
      set({ typingUsers: typing })
    })

    // Thread users list
    socket.on('thread_users', (data: ThreadUsersResponse) => {
      const users = new Map(get().threadUsers)
      users.set(data.thread_id, data.users)
      set({ threadUsers: users })
    })

    // Messages read by another user
    socket.on('messages_read', (data: MessagesReadResponse) => {
      const messages = new Map(get().messages)
      const threadMessages = messages.get(data.thread_id) || []
      const readReceipts = new Map(get().readReceipts)

      // Update messages with read status
      const updatedMessages = threadMessages.map(m => {
        if (data.message_ids.includes(m.message_id)) {
          const existingReadBy = m.read_by || []
          // Add new reader if not already present
          if (!existingReadBy.find(r => r.user_id === data.read_by.id)) {
            return {
              ...m,
              is_read: true,
              read_by: [...existingReadBy, {
                user_id: data.read_by.id,
                username: data.read_by.username,
                display_name: data.read_by.display_name,
                read_at: data.read_at
              }]
            }
          }
        }
        return m
      })
      messages.set(data.thread_id, updatedMessages)

      // Also update readReceipts map
      for (const msgId of data.message_ids) {
        const existing = readReceipts.get(msgId) || []
        if (!existing.find(r => r.user_id === data.read_by.id)) {
          readReceipts.set(msgId, [...existing, {
            user_id: data.read_by.id,
            username: data.read_by.username,
            display_name: data.read_by.display_name,
            read_at: data.read_at
          }])
        }
      }

      set({ messages, readReceipts })
    })

    // Confirmation that we marked messages as read
    socket.on('read_confirmed', (data: ReadConfirmedResponse) => {
      // Update unread count for the thread
      const unreadCounts = new Map(get().unreadCounts)
      const currentCount = unreadCounts.get(data.thread_id) || 0
      const newCount = Math.max(0, currentCount - data.message_ids.length)
      unreadCounts.set(data.thread_id, newCount)
      set({ unreadCounts })
    })

    // Read receipts response
    socket.on('read_receipts', (data: ReadReceiptsResponse) => {
      const readReceipts = new Map(get().readReceipts)
      const messages = new Map(get().messages)
      const threadMessages = messages.get(data.thread_id) || []

      // Update readReceipts map
      for (const [msgIdStr, receipts] of Object.entries(data.receipts)) {
        const msgId = parseInt(msgIdStr, 10)
        readReceipts.set(msgId, receipts)
      }

      // Update messages with read status
      const updatedMessages = threadMessages.map(m => {
        const receipts = data.receipts[m.message_id]
        if (receipts && receipts.length > 0) {
          return {
            ...m,
            is_read: true,
            read_by: receipts
          }
        }
        return m
      })
      messages.set(data.thread_id, updatedMessages)

      set({ readReceipts, messages })
    })

    // Error from server
    socket.on('error', (data: ChatErrorResponse) => {
      console.error('Chat error:', data.message)
      set({ connectionError: data.message })
    })

    // Pong response (for keep-alive)
    socket.on('pong', () => {
      // Connection is alive
    })
  },

  // Disconnect from Socket.IO server
  disconnect: () => {
    // Clear any pending reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    reconnectAttempts = 0 // Reset reconnect attempts on manual disconnect
    
    if (socket) {
      socket.disconnect()
      socket = null
    }
    set({
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      currentUser: null,
      activeThreadId: null,
      threads: new Map(),
      messages: new Map(),
      typingUsers: new Map(),
      threadUsers: new Map(),
      readReceipts: new Map(),
      unreadCounts: new Map(),
    })
  },

  // Join a chat thread
  joinThread: (threadId: number) => {
    if (socket?.connected) {
      socket.emit('join_thread', { thread_id: threadId })
    }
  },

  // Leave a chat thread
  leaveThread: (threadId: number) => {
    if (socket?.connected) {
      socket.emit('leave_thread', { thread_id: threadId })
    }
  },

  // Send a message to a thread
  sendMessage: (threadId: number, content: string, attachments?: number[]) => {
    if (socket?.connected) {
      socket.emit('send_message', {
        thread_id: threadId,
        content,
        attachments: attachments || null,
      })
    }
  },

  // Delete a message
  deleteMessage: (messageId: number) => {
    if (socket?.connected) {
      socket.emit('delete_message', { message_id: messageId })
    }
  },

  // Start typing indicator
  startTyping: (threadId: number) => {
    if (socket?.connected) {
      socket.emit('typing_start', { thread_id: threadId })
    }
  },

  // Stop typing indicator
  stopTyping: (threadId: number) => {
    if (socket?.connected) {
      socket.emit('typing_stop', { thread_id: threadId })
    }
  },

  // Get users in a thread
  getThreadUsers: (threadId: number) => {
    if (socket?.connected) {
      socket.emit('get_thread_users', { thread_id: threadId })
    }
  },

  // Mark messages as read in a thread
  markRead: (threadId: number, messageId?: number) => {
    if (socket?.connected) {
      socket.emit('mark_read', {
        thread_id: threadId,
        message_id: messageId || null,
      })
    }
  },

  // Get read receipts for messages
  getReadReceipts: (threadId: number, messageIds?: number[]) => {
    if (socket?.connected) {
      socket.emit('get_read_receipts', {
        thread_id: threadId,
        message_ids: messageIds || null,
      })
    }
  },
}))

// Helper function to get socket instance (for advanced use cases)
export const getSocket = () => socket
