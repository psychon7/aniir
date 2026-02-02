import { io, Socket } from 'socket.io-client';

// Socket.IO server URL
// Priority: VITE_SOCKET_URL > window.location.origin (for production same-origin)
// In development: http://localhost:8000
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');

// Socket instance (singleton)
let socket: Socket | null = null;

// Socket connection options
const socketOptions = {
  path: '/ws/socket.io',
  transports: ['websocket', 'polling'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
};

/**
 * Get or create the Socket.IO instance
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, socketOptions);
  }
  return socket;
}

/**
 * Connect to Socket.IO server with authentication
 */
export function connectSocket(token: string): Socket {
  const socketInstance = getSocket();
  
  // Set auth token
  socketInstance.auth = { token };
  
  // Connect if not already connected
  if (!socketInstance.connected) {
    socketInstance.connect();
  }
  
  return socketInstance;
}

/**
 * Disconnect from Socket.IO server
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

// Socket event types for type safety
export interface ServerToClientEvents {
  // Chat events
  'chat:message': (message: ChatMessage) => void;
  'chat:typing': (data: TypingIndicator) => void;
  'chat:read': (data: ReadReceipt) => void;
  'chat:online_users': (users: number[]) => void;
  'chat:user_joined': (userId: number) => void;
  'chat:user_left': (userId: number) => void;
  
  // Notification events
  'notification:new': (notification: Notification) => void;
  'notification:count': (count: number) => void;
  
  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'reconnect': (attemptNumber: number) => void;
  'reconnect_attempt': (attemptNumber: number) => void;
  'reconnect_error': (error: Error) => void;
  'reconnect_failed': () => void;
}

export interface ClientToServerEvents {
  // Chat events
  'chat:send_message': (data: SendMessagePayload, callback: (response: MessageResponse) => void) => void;
  'chat:typing_start': (conversationId: number) => void;
  'chat:typing_stop': (conversationId: number) => void;
  'chat:mark_read': (conversationId: number) => void;
  'chat:join_conversation': (conversationId: number) => void;
  'chat:leave_conversation': (conversationId: number) => void;
  
  // Presence events
  'presence:online': () => void;
  'presence:offline': () => void;
}

// Type definitions for chat events
export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'system';
  file_url?: string;
  file_name?: string;
  created_at: string;
  read_by: number[];
}

export interface TypingIndicator {
  conversation_id: number;
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export interface ReadReceipt {
  conversation_id: number;
  user_id: number;
  last_read_message_id: number;
}

export interface SendMessagePayload {
  conversation_id: number;
  content: string;
  message_type?: 'text' | 'file' | 'image';
  file_url?: string;
  file_name?: string;
}

export interface MessageResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  created_at: string;
  read: boolean;
}

export default getSocket;
