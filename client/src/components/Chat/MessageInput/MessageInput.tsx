import React, { useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuth } from '@/context/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useMessageStore, type Message } from '@/stores/messageStore';
import { encrypt } from '@/utils/encryption';
import { v4 as uuidv4 } from 'uuid';
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
    const clientMessageId = uuidv4();

    const now = new Date().toISOString();
    const tempMessage = {
      id: `temp-${clientMessageId}`, // временный ID в формате строки
      conversationId: currentConversationId,
      senderId: user.id,
      content,
      mediaUrl: null,
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
      clientMessageId,
    } as unknown as Message;

    addMessage(tempMessage);
    setContent('');

    const messageData = {
      conversationId: currentConversationId,
      senderId: user.id,
      encryptedContent,
      clientMessageId,
    };

    console.log("✅ Отправка сообщения через socket:", messageData);
    socket.emit('sendMessage', messageData, (response: any) => {
      if (response.status === 'ok') {
        console.log("📨 Сообщение подтверждено:", response.message);
        replaceMessage(clientMessageId, {
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
