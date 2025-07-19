import React, { useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useChatStore } from '@/stores/chatStore';
import { useSocket } from "@/hooks/useSocket";
import './MessageInput.scss';

const MessageInput: React.FC = () => {
  const [content, setContent] = useState('');
  const { currentUser } = useUserStore();
  const { currentConversationId } = useChatStore();
  const { socket } = useSocket();

  const handleSend = () => {
    if (!content.trim() || !currentUser || !currentConversationId || !socket) {
      console.log("❌ Один из параметров отсутствует:", {
        content,
        currentUser,
        currentConversationId,
        socket,
      });
      return;
    }

    if (!socket.connected) {
      console.log("❌ Socket НЕ подключен");
      return;
    }

    const messageData = {
      conversationId: currentConversationId,
      senderId: currentUser.id,
      content: content.trim(),
    };

    console.log("✅ Отправка сообщения через socket:", messageData);
    socket.emit('sendMessage', messageData);
    setContent('');
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
