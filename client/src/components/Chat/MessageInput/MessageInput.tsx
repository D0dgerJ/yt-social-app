import React, { useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuth } from '@/context/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useMessageStore, type Message } from '@/stores/messageStore';
import { encrypt } from '@/utils/encryption';
import './MessageInput.scss';

const MessageInput: React.FC = () => {
  const [content, setContent] = useState('');
  const { currentConversationId } = useChatStore();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addMessage, replaceMessage } = useMessageStore();

  const handleSend = () => {
    if (!content.trim() || !currentConversationId || !socket || !user?.id) {
      console.log("❌ Один из параметров отсутствует:", {
        content,
        currentConversationId,
        socket,
        user,
      });
      return;
    }

    if (!socket.connected) {
      console.log("❌ Socket НЕ подключен");
      return;
    }

    const encryptedContent = encrypt(content.trim());

    // 1️⃣ Временное сообщение (Optimistic UI)
    const tempId = Date.now();
    const now = new Date().toISOString();

    const tempMessage: Message = {
      id: tempId,
      conversationId: currentConversationId,
      senderId: user.id,
      content,
      mediaUrl: null, // допустимо, т.к. mediaUrl?: string | null
      mediaType: 'text',
      isDelivered: false,
      isRead: false,
      createdAt: now,
      updatedAt: now,
      sender: {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    };

    addMessage(tempMessage);
    setContent('');

    // 2️⃣ Отправка через socket
    const messageData = {
      conversationId: currentConversationId,
      senderId: user.id,
      encryptedContent,
    };

    console.log("✅ Отправка сообщения через socket:", messageData);
    socket.emit('sendMessage', messageData, (response: any) => {
      if (response.status === 'ok') {
        console.log("📨 Сообщение подтверждено:", response.message);

        // 3️⃣ Замена временного на серверное сообщение
        replaceMessage(tempId, {
          ...response.message,
          isDelivered: true,
        });
      } else {
        console.error("❌ Ошибка при отправке:", response.error);
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input-container">
      <input
        type="text"
        placeholder="Напишите сообщение..."
        className="message-input-field"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyPress}
      />
      <button
        onClick={handleSend}
        disabled={!content.trim()}
        className="message-send-button"
      >
        Отправить
      </button>
    </div>
  );
};

export default MessageInput;
