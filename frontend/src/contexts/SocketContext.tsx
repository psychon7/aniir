import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { 
  connectSocket, 
  disconnectSocket, 
  getSocket,
  ServerToClientEvents,
  ClientToServerEvents 
} from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
  connectionError: Error | null;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Socket.IO Context Provider
 * Manages global socket connection state
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if not authenticated
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Connect with authentication
    const socketInstance = connectSocket(token) as TypedSocket;
    setSocket(socketInstance);

    // Event handlers
    const handleConnect = () => {
      console.log('Socket.IO connected');
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = (reason: string) => {
      console.log('Socket.IO disconnected:', reason);
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('Socket.IO connection error:', error);
      setConnectionError(error);
      setIsConnected(false);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    // Cleanup on unmount
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to access socket context
 */
export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;
