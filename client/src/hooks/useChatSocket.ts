import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/userStore';
import { useChatStore } from '@/stores/chatStore';
import { useMessageStore } from '@/stores/messageStore';
import { Message } from '../utils/types/MessageTypes';

let socket: Socket | null = null;

export const useChatSocket = () => {
  const { currentUser } = useUserStore();
  const { currentConversationId } = useChatStore();
  const { addMessage } = useMessageStore();

  useEffect(() => {
    if (!currentUser || currentConversationId === null) return;

    // Подключаемся к сокету с userId
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      query: { userId: currentUser.id },
    });

    // Присоединяемся к комнате чата
    socket.emit('joinConversation', currentConversationId);

    // Слушаем входящие сообщения
    socket.on('receiveMessage', (message: Message) => {
      if (message.conversationId === currentConversationId) {
        addMessage(message);
      }
    });

    // Очистка при размонтировании
    return () => {
      socket?.emit('leaveConversation', currentConversationId);
      socket?.disconnect();
    };
  }, [currentUser, currentConversationId, addMessage]);
};
