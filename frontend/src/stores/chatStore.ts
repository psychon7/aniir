/**
 * Chat store with Socket.IO connection management
 * Handles real-time messaging, typing indicators, and user presence
 * 
 * Production-grade implementation with:
 * - Circuit breaker pattern to prevent connection flooding
 * - Graceful degradation when WebSocket is unavailable
 * - Manual reconnection with exponential backoff
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

// Connection state management
let connectionAttempts = 0
let lastConnectionAttempt = 0
let isCircuitBroken = false
let circuitBrokenUntil = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

// Configuration
const MAX_CONSECUTIVE_FAILURES = 3 // Open circuit after this many failures
const CIRCUIT_RESET_TIME = 60000 // 1 minute before trying again
const MIN_RETRY_INTERVAL = 5000 // Minimum 5s between attempts
const MAX_RETRY_INTERVAL = 120000 // Maximum 2 minutes between attempts

// Get the WebSocket URL from environment or use default
const getSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin
  return baseUrl.replace(/^http/, 'ws').replace(/\/api\/v1$/, '') || baseUrl
}

// Calculate retry delay with exponential backoff
const getRetryDelay = (attempt: number): number => {
  const delay = Math.min(MIN_RETRY_INTERVAL * Math.pow(2, attempt), MAX_RETRY_INTERVAL)
  return delay + Math.random() * 1000 // Add jitter
}

// Reset connection state
const resetConnectionState = () => {
  connectionAttempts = 0
  isCircuitBroken = false
  circuitBrokenUntil = 0
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

// Check if we can attempt connection
const canAttemptConnection = (): { allowed: boolean; reason?: string } => {
  const now = Date.now()
  
  // Check circuit breaker
  if (isCircuitBroken) {
    if (now < circuitBrokenUntil) {
      const remainingSeconds = Math.ceil((circuitBrokenUntil - now) / 1000)
      return { 
        allowed: false, 
        reason: `WebSocket unavailable. Retry in ${remainingSeconds}s` 
      }
    }
    // Circuit reset - allow one attempt
    isCircuitBroken = false
    connectionAttempts = 0
  }
  
  // Rate limit connection attempts
  if (now - lastConnectionAttempt < MIN_RETRY_INTERVAL) {
    return { allowed: false, reason: 'Too many connection attempts' }
  }
  
  return { allowed: true }
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

  // Connect to Socket.IO server with circuit breaker protection
  connect: (token: string) => {
    // Prevent multiple connections
    if (socket?.connected || get().isConnecting) {
      return
    }

    // Check circuit breaker
    const connectionCheck = canAttemptConnection()
    if (!connectionCheck.allowed) {
      set({ connectionError: connectionCheck.reason || 'Connection blocked' })
      return
    }

    // Track connection attempt
    lastConnectionAttempt = Date.now()
    connectionAttempts++

    set({ isConnecting: true, connectionError: null })

    // Create socket connection - DISABLE auto-reconnection, we manage it ourselves
    const socketUrl = getSocketUrl()
    socket = io(socketUrl, {
      path: '/ws/socket.io',
      auth: { token },
      transports: ['websocket'], // Start with WebSocket only
      reconnection: false, // Disable auto-reconnection - we manage it
      timeout: 10000,
      forceNew: true,
    })

    let hasConnected = false

    // Connection established successfully
    socket.on('connection_established', (data: ConnectionEstablishedResponse) => {
      hasConnected = true
      resetConnectionState() // Reset circuit breaker on success
      set({
        isConnected: true,
        isConnecting: false,
        connectionError: null,
        currentUser: data.user,
      })
    })

    // Socket.IO connect event (transport level)
    socket.on('connect', () => {
      // Transport connected, waiting for server acknowledgment
      hasConnected = true
      resetConnectionState()
      set({ isConnecting: false, isConnected: true, connectionError: null })
    })

    // Connection error
    socket.on('connect_error', (error: Error) => {
      const errorMsg = error.message || 'Connection failed'
      
      // Check if this is a transport/infrastructure error
      const isInfrastructureError = 
        errorMsg.includes('websocket') ||
        errorMsg.includes('transport') ||
        errorMsg.includes('xhr poll error') ||
        !hasConnected
      
      if (isInfrastructureError) {
        // Increment failure count
        if (connectionAttempts >= MAX_CONSECUTIVE_FAILURES) {
          // Open circuit breaker
          isCircuitBroken = true
          circuitBrokenUntil = Date.now() + CIRCUIT_RESET_TIME
          
          console.warn(
            `WebSocket: Circuit breaker opened after ${connectionAttempts} failures. ` +
            `Will retry in ${CIRCUIT_RESET_TIME / 1000}s`
          )
          
          set({
            isConnected: false,
            isConnecting: false,
            connectionError: 'Real-time features unavailable. Will retry automatically.',
          })
          
          // Cleanup socket
          if (socket) {
            socket.disconnect()
            socket = null
          }
          
          // Schedule circuit reset attempt
          reconnectTimer = setTimeout(() => {
            if (isCircuitBroken) {
              console.log('WebSocket: Attempting circuit reset...')
              get().connect(token)
            }
          }, CIRCUIT_RESET_TIME)
          
          return
        }
        
        // Schedule retry with exponential backoff
        const retryDelay = getRetryDelay(connectionAttempts)
        console.log(`WebSocket: Connection failed. Retry ${connectionAttempts}/${MAX_CONSECUTIVE_FAILURES} in ${Math.round(retryDelay / 1000)}s`)
        
        set({
          isConnected: false,
          isConnecting: false,
          connectionError: `Connecting... (attempt ${connectionAttempts}/${MAX_CONSECUTIVE_FAILURES})`,
        })
        
        // Cleanup and retry
        if (socket) {
          socket.disconnect()
          socket = null
        }
        
        reconnectTimer = setTimeout(() => {
          get().connect(token)
        }, retryDelay)
        
        return
      }
      
      // For other errors (auth, server rejection), don't retry automatically
      console.warn('WebSocket connection error:', errorMsg)
      set({
        isConnected: false,
        isConnecting: false,
        connectionError: errorMsg,
      })
    })

    // Disconnected
    socket.on('disconnect', (reason: string) => {
      const wasConnected = hasConnected
      
      set({
        isConnected: false,
        isConnecting: false,
        connectionError: reason === 'io server disconnect' ? 'Server disconnected' : null,
      })
      
      // If we were connected and got disconnected, attempt one reconnect
      if (wasConnected && reason !== 'io client disconnect') {
        console.log('WebSocket: Disconnected, will attempt reconnect...')
        reconnectTimer = setTimeout(() => {
          get().connect(token)
        }, MIN_RETRY_INTERVAL)
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
    // Clear any pending reconnection timers
    resetConnectionState()
    
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
