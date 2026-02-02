/**
 * Chat module types for real-time messaging via Socket.IO
 */

// Entity types that can have associated chat threads
export type ChatEntityType =
  | 'Invoice'
  | 'Order'
  | 'Project'
  | 'PO'
  | 'Lot'
  | 'Shipment'
  | 'General'

// User information in chat context
export interface ChatUser {
  id: number
  username: string
  display_name: string
}

// Chat thread (conversation)
export interface ChatThread {
  id: number
  name: string | null
  entityType: ChatEntityType | null
  entityId: number | null
  createdBy: number
  createdAt: string
}

// Read receipt for a message
export interface ReadReceipt {
  user_id: number
  username?: string
  display_name?: string
  read_at: string
}

// Read status enumeration
export type MessageReadStatus = 'sent' | 'delivered' | 'read'

// Chat message
export interface ChatMessage {
  message_id: number
  thread_id: number
  content: string
  attachments: number[] | null
  created_at: string
  deleted_at?: string | null
  user: ChatUser
  // Read receipt fields
  is_read?: boolean
  read_by?: ReadReceipt[]
  read_status?: MessageReadStatus
}

// Typing indicator
export interface TypingUser {
  thread_id: number
  user: ChatUser
}

// Socket.IO event payloads

export interface SendMessagePayload {
  thread_id: number
  content: string
  attachments?: number[]
}

export interface DeleteMessagePayload {
  message_id: number
}

export interface JoinThreadPayload {
  thread_id: number
}

export interface LeaveThreadPayload {
  thread_id: number
}

export interface TypingPayload {
  thread_id: number
}

// Socket.IO event responses

export interface ConnectionEstablishedResponse {
  message: string
  user: {
    id: number
    username: string
    display_name: string
  }
}

export interface JoinedThreadResponse {
  thread_id: number
  thread_name: string | null
  entity_type: ChatEntityType | null
  entity_id: number | null
}

export interface UserJoinedResponse {
  thread_id: number
  user: ChatUser
}

export interface UserLeftResponse {
  thread_id: number
  user: {
    id: number
    username: string
  }
}

export interface NewMessageResponse {
  message_id: number
  thread_id: number
  content: string
  attachments: number[] | null
  created_at: string
  user: ChatUser
  is_read?: boolean
  read_by?: ReadReceipt[]
}

// Messages read event response
export interface MessagesReadResponse {
  thread_id: number
  message_ids: number[]
  read_by: ChatUser
  read_at: string
}

// Read confirmed event response (sent to the user who marked messages as read)
export interface ReadConfirmedResponse {
  thread_id: number
  message_ids: number[]
  read_at: string
}

// Read receipts response (when fetching read receipts)
export interface ReadReceiptsResponse {
  thread_id: number
  receipts: Record<number, ReadReceipt[]> // message_id -> receipts
}

export interface MessageDeletedResponse {
  message_id: number
  thread_id: number
  deleted_by: {
    id: number
    username: string
  }
}

export interface ThreadUsersResponse {
  thread_id: number
  users: ChatUser[]
}

export interface ChatErrorResponse {
  message: string
}

// Chat attachment (file) for message
export interface ChatAttachment {
  id: number
  name: string
  size: number
  mimeType: string
  url: string
  thumbnailUrl?: string
}

// Pending attachment for upload
export interface PendingAttachment {
  id: string // temporary client-side ID
  file: File
  name: string
  size: number
  mimeType: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  uploadedId?: number // server ID after upload completes
}

// Chat state for store
export interface ChatState {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  currentUser: ChatUser | null
  activeThreadId: number | null
  threads: Map<number, ChatThread>
  messages: Map<number, ChatMessage[]>
  typingUsers: Map<number, ChatUser[]>
  threadUsers: Map<number, ChatUser[]>
  // Read receipts: message_id -> array of read receipts
  readReceipts: Map<number, ReadReceipt[]>
  // Unread counts per thread
  unreadCounts: Map<number, number>
}

// Chat store actions
export interface ChatActions {
  connect: (token: string) => void
  disconnect: () => void
  joinThread: (threadId: number) => void
  leaveThread: (threadId: number) => void
  sendMessage: (threadId: number, content: string, attachments?: number[]) => void
  deleteMessage: (messageId: number) => void
  startTyping: (threadId: number) => void
  stopTyping: (threadId: number) => void
  getThreadUsers: (threadId: number) => void
  // Read receipt actions
  markRead: (threadId: number, messageId?: number) => void
  getReadReceipts: (threadId: number, messageIds?: number[]) => void
}
