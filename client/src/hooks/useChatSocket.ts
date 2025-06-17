import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/userStore';
import { useChatStore } from '@/stores/chatStore';
import { useMessageStore } from '@/stores/messageStore';
import { Message } from '../utils/types/MessageTypes';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useChatSocket = () => {
  const { currentUser } = useUserStore();
  const { currentConversationId } = useChatStore();
  const { addMessage } = useMessageStore();

  const socketRef = useRef<Socket | null>(null);
  const prevConversationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser || currentConversationId === null) return;

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        query: { userId: currentUser.id },
      });

      // Подписка на входящие сообщения
      socketRef.current.on('receiveMessage', (message: Message) => {
        if (message.conversationId === currentConversationId) {
          addMessage(message);
        }
      });
    }

    // Если комната сменилась, переприсоединиться
    if (prevConversationIdRef.current !== currentConversationId) {
      if (prevConversationIdRef.current !== null) {
        socketRef.current.emit('leaveConversation', prevConversationIdRef.current);
      }

      socketRef.current.emit('joinConversation', currentConversationId);
      prevConversationIdRef.current = currentConversationId;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveConversation', currentConversationId);
        socketRef.current.disconnect();
        socketRef.current = null;
        prevConversationIdRef.current = null;
      }
    };
  }, [currentUser, currentConversationId, addMessage]);
};
