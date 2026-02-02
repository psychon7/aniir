import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { 
  getSocket, 
  connectSocket, 
  disconnectSocket, 
  isSocketConnected,
  ServerToClientEvents,
  ClientToServerEvents 
} from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

interface UseSocketReturn {
  socket: TypedSocket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: TypedSocket['emit'];
  on: TypedSocket['on'];
  off: TypedSocket['off'];
}

/**
 * React hook for Socket.IO connection management
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<TypedSocket | null>(null);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!token || !isAuthenticated) {
      console.warn('Cannot connect socket: not authenticated');
      return;
    }

    const socket = connectSocket(token) as TypedSocket;
    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.(reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      onError?.(error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      setIsConnected(false);
    });
  }, [token, isAuthenticated, onConnect, onDisconnect, onError]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  // Auto-connect on mount if authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, token, connect, disconnect]);

  // Emit wrapper with type safety
  const emit = useCallback(
    (...args: Parameters<TypedSocket['emit']>) => {
      if (socketRef.current?.connected) {
        return socketRef.current.emit(...args);
      }
      console.warn('Cannot emit: socket not connected');
      return socketRef.current;
    },
    []
  );

  // On wrapper
  const on = useCallback(
    (...args: Parameters<TypedSocket['on']>) => {
      if (socketRef.current) {
        return socketRef.current.on(...args);
      }
      console.warn('Cannot add listener: socket not initialized');
      return socketRef.current as unknown as TypedSocket;
    },
    []
  );

  // Off wrapper
  const off = useCallback(
    (...args: Parameters<TypedSocket['off']>) => {
      if (socketRef.current) {
        return socketRef.current.off(...args);
      }
      return socketRef.current as unknown as TypedSocket;
    },
    []
  );

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}

export default useSocket;
