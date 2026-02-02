import { useEffect, useCallback, useState } from 'react';
import { useSocket } from './useSocket';
import { 
  ChatMessage, 
  TypingIndicator, 
  ReadReceipt, 
  SendMessagePayload,
  MessageResponse 
} from '@/lib/socket';

interface UseChatSocketOptions {
  conversationId?: number;
  onNewMessage?: (message: ChatMessage) => void;
  onTyping?: (data: TypingIndicator) => void;
  onReadReceipt?: (data: ReadReceipt) => void;
  onOnlineUsersChange?: (users: number[]) => void;
}

interface UseChatSocketReturn {
  isConnected: boolean;
  onlineUsers: number[];
  typingUsers: Map<number, TypingIndicator>;
  sendMessage: (payload: Omit<SendMessagePayload, 'conversation_id'>) => Promise<MessageResponse>;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: () => void;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
}

/**
 * React hook for chat-specific Socket.IO functionality
 */
export function useChatSocket(options: UseChatSocketOptions = {}): UseChatSocketReturn {
  const { 
    conversationId, 
    onNewMessage, 
    onTyping, 
    onReadReceipt,
    onOnlineUsersChange 
  } = options;

  const { socket, isConnected, on, off, emit } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingIndicator>>(new Map());

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: ChatMessage) => {
      if (!conversationId || message.conversation_id === conversationId) {
        onNewMessage?.(message);
      }
    };

    on('chat:message', handleMessage);
    return () => {
      off('chat:message', handleMessage);
    };
  }, [socket, conversationId, onNewMessage, on, off]);

  // Handle typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: TypingIndicator) => {
      if (!conversationId || data.conversation_id === conversationId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          if (data.is_typing) {
            next.set(data.user_id, data);
          } else {
            next.delete(data.user_id);
          }
          return next;
        });
        onTyping?.(data);
      }
    };

    on('chat:typing', handleTyping);
    return () => {
      off('chat:typing', handleTyping);
    };
  }, [socket, conversationId, onTyping, on, off]);

  // Handle read receipts
  useEffect(() => {
    if (!socket) return;

    const handleReadReceipt = (data: ReadReceipt) => {
      if (!conversationId || data.conversation_id === conversationId) {
        onReadReceipt?.(data);
      }
    };

    on('chat:read', handleReadReceipt);
    return () => {
      off('chat:read', handleReadReceipt);
    };
  }, [socket, conversationId, onReadReceipt, on, off]);

  // Handle online users
  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (users: number[]) => {
      setOnlineUsers(users);
      onOnlineUsersChange?.(users);
    };

    const handleUserJoined = (userId: number) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    };

    const handleUserLeft = (userId: number) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    };

    on('chat:online_users', handleOnlineUsers);
    on('chat:user_joined', handleUserJoined);
    on('chat:user_left', handleUserLeft);

    return () => {
      off('chat:online_users', handleOnlineUsers);
      off('chat:user_joined', handleUserJoined);
      off('chat:user_left', handleUserLeft);
    };
  }, [socket, onOnlineUsersChange, on, off]);

  // Auto-join conversation when conversationId changes
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    emit('chat:join_conversation', conversationId);

    return () => {
      emit('chat:leave_conversation', conversationId);
    };
  }, [socket, isConnected, conversationId, emit]);

  // Send message
  const sendMessage = useCallback(
    (payload: Omit<SendMessagePayload, 'conversation_id'>): Promise<MessageResponse> => {
      return new Promise((resolve, reject) => {
        if (!conversationId) {
          reject(new Error('No conversation selected'));
          return;
        }

        if (!isConnected) {
          reject(new Error('Socket not connected'));
          return;
        }

        emit('chat:send_message', 
          { ...payload, conversation_id: conversationId },
          (response: MessageResponse) => {
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error || 'Failed to send message'));
            }
          }
        );
      });
    },
    [conversationId, isConnected, emit]
  );

  // Typing indicators
  const startTyping = useCallback(() => {
    if (conversationId && isConnected) {
      emit('chat:typing_start', conversationId);
    }
  }, [conversationId, isConnected, emit]);

  const stopTyping = useCallback(() => {
    if (conversationId && isConnected) {
      emit('chat:typing_stop', conversationId);
    }
  }, [conversationId, isConnected, emit]);

  // Mark as read
  const markAsRead = useCallback(() => {
    if (conversationId && isConnected) {
      emit('chat:mark_read', conversationId);
    }
  }, [conversationId, isConnected, emit]);

  // Join/leave conversation
  const joinConversation = useCallback(
    (convId: number) => {
      if (isConnected) {
        emit('chat:join_conversation', convId);
      }
    },
    [isConnected, emit]
  );

  const leaveConversation = useCallback(
    (convId: number) => {
      if (isConnected) {
        emit('chat:leave_conversation', convId);
      }
    },
    [isConnected, emit]
  );

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    joinConversation,
    leaveConversation,
  };
}

export default useChatSocket;
