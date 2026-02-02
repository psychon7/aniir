/**
 * Socket.IO Connection Hook
 *
 * A reusable hook for managing Socket.IO connections with:
 * - Automatic connection/disconnection based on authentication
 * - Connection state management (connected, connecting, errors)
 * - Event subscription/unsubscription helpers
 * - Reconnection control
 * - Keep-alive ping/pong support
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'

// Connection configuration options
export interface SocketConnectionOptions {
  /** Custom WebSocket path (default: '/ws/socket.io') */
  path?: string
  /** Transport protocols (default: ['websocket', 'polling']) */
  transports?: ('websocket' | 'polling')[]
  /** Enable automatic reconnection (default: true) */
  reconnection?: boolean
  /** Maximum reconnection attempts (default: 5) */
  reconnectionAttempts?: number
  /** Initial reconnection delay in ms (default: 1000) */
  reconnectionDelay?: number
  /** Maximum reconnection delay in ms (default: 5000) */
  reconnectionDelayMax?: number
  /** Auto-connect when authenticated (default: true) */
  autoConnect?: boolean
  /** Enable keep-alive ping (default: true) */
  enablePing?: boolean
  /** Ping interval in ms (default: 25000) */
  pingInterval?: number
}

// Connection state
export interface SocketConnectionState {
  /** Whether the socket is connected */
  isConnected: boolean
  /** Whether the socket is attempting to connect */
  isConnecting: boolean
  /** Whether the socket is reconnecting after a disconnect */
  isReconnecting: boolean
  /** Current reconnection attempt number */
  reconnectAttempt: number
  /** Connection error message if any */
  error: string | null
  /** Last successful connection timestamp */
  connectedAt: Date | null
  /** Transport protocol currently in use */
  transport: string | null
}

// Event listener type
type EventListener = (...args: unknown[]) => void

// Default configuration
const DEFAULT_OPTIONS: Required<SocketConnectionOptions> = {
  path: '/ws/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: true,
  enablePing: true,
  pingInterval: 25000,
}

/**
 * Get the WebSocket URL from environment or use default
 * Priority: VITE_SOCKET_URL > window.location.origin (for production)
 * In development: defaults to http://localhost:8000
 */
const getSocketUrl = (): string => {
  // Use dedicated socket URL if provided
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL
  }
  // Fall back to same origin (for production deployments)
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000'
}

/**
 * Hook for managing Socket.IO connections
 *
 * @param options - Connection configuration options
 * @returns Connection state and control functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isConnected,
 *     connect,
 *     disconnect,
 *     emit,
 *     on,
 *     off
 *   } = useSocketConnection();
 *
 *   useEffect(() => {
 *     const handleMessage = (data) => console.log(data);
 *     on('new_message', handleMessage);
 *     return () => off('new_message', handleMessage);
 *   }, [on, off]);
 *
 *   return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useSocketConnection(options: SocketConnectionOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  // Socket instance ref (persists across renders)
  const socketRef = useRef<Socket | null>(null)

  // Ping interval ref
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track registered event listeners for cleanup
  const eventListenersRef = useRef<Map<string, Set<EventListener>>>(new Map())

  // Auth state
  const { accessToken, isAuthenticated } = useAuthStore()

  // Connection state
  const [state, setState] = useState<SocketConnectionState>({
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    reconnectAttempt: 0,
    error: null,
    connectedAt: null,
    transport: null,
  })

  /**
   * Start the keep-alive ping interval
   */
  const startPingInterval = useCallback(() => {
    if (!config.enablePing) return

    // Clear existing interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }

    // Start new ping interval
    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping', { timestamp: Date.now() })
      }
    }, config.pingInterval)
  }, [config.enablePing, config.pingInterval])

  /**
   * Stop the keep-alive ping interval
   */
  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  /**
   * Connect to the Socket.IO server
   */
  const connect = useCallback((token?: string) => {
    const authToken = token || accessToken

    // Prevent multiple connections
    if (socketRef.current?.connected || state.isConnecting) {
      return
    }

    if (!authToken) {
      setState(prev => ({
        ...prev,
        error: 'No authentication token available',
      }))
      return
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }))

    // Create socket connection
    const socketUrl = getSocketUrl()
    const socket = io(socketUrl, {
      path: config.path,
      auth: { token: authToken },
      transports: config.transports,
      reconnection: config.reconnection,
      reconnectionAttempts: config.reconnectionAttempts,
      reconnectionDelay: config.reconnectionDelay,
      reconnectionDelayMax: config.reconnectionDelayMax,
    })

    socketRef.current = socket

    // Handle successful connection
    socket.on('connect', () => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        reconnectAttempt: 0,
        error: null,
        connectedAt: new Date(),
        transport: socket.io.engine?.transport?.name || null,
      }))
      startPingInterval()
    })

    // Handle connection established event (custom server event)
    socket.on('connection_established', () => {
      // Connection confirmation from server
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
      }))
    })

    // Handle connection error
    socket.on('connect_error', (error: Error) => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error.message || 'Connection failed',
      }))
      stopPingInterval()
    })

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      const errorMsg = reason === 'io server disconnect'
        ? 'Server disconnected'
        : reason === 'io client disconnect'
          ? null // Intentional disconnect
          : reason

      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: errorMsg,
        transport: null,
      }))
      stopPingInterval()
    })

    // Handle reconnection attempt
    socket.io.on('reconnect_attempt', (attempt: number) => {
      setState(prev => ({
        ...prev,
        isConnecting: true,
        isReconnecting: true,
        reconnectAttempt: attempt,
      }))
    })

    // Handle successful reconnection
    socket.io.on('reconnect', () => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        reconnectAttempt: 0,
        error: null,
        connectedAt: new Date(),
      }))
      startPingInterval()
    })

    // Handle reconnection failure
    socket.io.on('reconnect_failed', () => {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        isReconnecting: false,
        error: 'Reconnection failed after maximum attempts',
      }))
    })

    // Handle transport change
    socket.io.engine?.on('upgrade', (transport: { name: string }) => {
      setState(prev => ({
        ...prev,
        transport: transport.name,
      }))
    })

    // Handle pong response
    socket.on('pong', () => {
      // Connection is alive - could track latency here if needed
    })

    // Handle server errors
    socket.on('error', (data: { message: string }) => {
      setState(prev => ({
        ...prev,
        error: data.message,
      }))
    })
  }, [
    accessToken,
    state.isConnecting,
    config,
    startPingInterval,
    stopPingInterval
  ])

  /**
   * Disconnect from the Socket.IO server
   */
  const disconnect = useCallback(() => {
    stopPingInterval()

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    // Clear all event listeners
    eventListenersRef.current.clear()

    setState({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      reconnectAttempt: 0,
      error: null,
      connectedAt: null,
      transport: null,
    })
  }, [stopPingInterval])

  /**
   * Emit an event to the server
   */
  const emit = useCallback(<T = unknown>(
    event: string,
    data?: T,
    callback?: (response: unknown) => void
  ): boolean => {
    if (!socketRef.current?.connected) {
      return false
    }

    if (callback) {
      socketRef.current.emit(event, data, callback)
    } else {
      socketRef.current.emit(event, data)
    }
    return true
  }, [])

  /**
   * Subscribe to a socket event
   */
  const on = useCallback(<T = unknown>(
    event: string,
    listener: (data: T) => void
  ): void => {
    if (!socketRef.current) return

    // Track listener for cleanup
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set())
    }
    eventListenersRef.current.get(event)!.add(listener as EventListener)

    socketRef.current.on(event, listener as EventListener)
  }, [])

  /**
   * Unsubscribe from a socket event
   */
  const off = useCallback(<T = unknown>(
    event: string,
    listener?: (data: T) => void
  ): void => {
    if (!socketRef.current) return

    if (listener) {
      // Remove specific listener
      socketRef.current.off(event, listener as EventListener)
      eventListenersRef.current.get(event)?.delete(listener as EventListener)
    } else {
      // Remove all listeners for event
      socketRef.current.off(event)
      eventListenersRef.current.delete(event)
    }
  }, [])

  /**
   * Subscribe to an event for a single occurrence
   */
  const once = useCallback(<T = unknown>(
    event: string,
    listener: (data: T) => void
  ): void => {
    if (!socketRef.current) return
    socketRef.current.once(event, listener as EventListener)
  }, [])

  /**
   * Force a reconnection attempt
   */
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect()
    } else if (accessToken) {
      connect(accessToken)
    }
  }, [accessToken, connect])

  /**
   * Get the underlying socket instance (for advanced use cases)
   */
  const getSocket = useCallback((): Socket | null => {
    return socketRef.current
  }, [])

  // Auto-connect when authenticated
  useEffect(() => {
    if (config.autoConnect && isAuthenticated && accessToken && !state.isConnected && !state.isConnecting) {
      connect(accessToken)
    }
  }, [config.autoConnect, isAuthenticated, accessToken, state.isConnected, state.isConnecting, connect])

  // Auto-disconnect on logout
  useEffect(() => {
    if (!isAuthenticated && state.isConnected) {
      disconnect()
    }
  }, [isAuthenticated, state.isConnected, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPingInterval()
      // Note: We don't disconnect here to allow the connection to persist
      // across component remounts. Use disconnect() explicitly when needed.
    }
  }, [stopPingInterval])

  return {
    // Connection state
    ...state,

    // Connection control
    connect,
    disconnect,
    reconnect,

    // Event handling
    emit,
    on,
    off,
    once,

    // Advanced
    getSocket,
  }
}

/**
 * Hook for subscribing to socket events with automatic cleanup
 *
 * @param event - Event name to subscribe to
 * @param handler - Event handler function
 * @param deps - Dependencies array for handler memoization
 *
 * @example
 * ```tsx
 * function ChatMessages() {
 *   const [messages, setMessages] = useState([]);
 *
 *   useSocketEvent('new_message', (message) => {
 *     setMessages(prev => [...prev, message]);
 *   }, []);
 *
 *   return <div>{messages.map(m => <Message key={m.id} {...m} />)}</div>;
 * }
 * ```
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) {
  const { on, off, isConnected } = useSocketConnection({ autoConnect: false })
  const handlerRef = useRef(handler)

  // Keep handler ref updated
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  // Subscribe to event
  useEffect(() => {
    if (!isConnected) return

    const eventHandler = (data: T) => {
      handlerRef.current(data)
    }

    on(event, eventHandler)

    return () => {
      off(event, eventHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, on, off, isConnected, ...deps])
}

/**
 * Hook for emitting socket events with connection check
 *
 * @returns emit function that returns false if not connected
 *
 * @example
 * ```tsx
 * function SendButton() {
 *   const emit = useSocketEmit();
 *
 *   const handleClick = () => {
 *     const sent = emit('send_message', { content: 'Hello!' });
 *     if (!sent) console.log('Not connected');
 *   };
 *
 *   return <button onClick={handleClick}>Send</button>;
 * }
 * ```
 */
export function useSocketEmit() {
  const { emit, isConnected } = useSocketConnection({ autoConnect: false })

  return useCallback(<T = unknown>(
    event: string,
    data?: T,
    callback?: (response: unknown) => void
  ): boolean => {
    if (!isConnected) return false
    return emit(event, data, callback)
  }, [emit, isConnected])
}

export default useSocketConnection
