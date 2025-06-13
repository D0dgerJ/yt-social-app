import React, { useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useChatStore } from '@/stores/chatStore';
import { Socket } from 'socket.io-client';

declare global {
  interface Window {
    socket: Socket | null;
  }
}

const MessageInput: React.FC = () => {
  const [content, setContent] = useState('');
  const { currentUser } = useUserStore();
  const { currentConversationId } = useChatStore();

  const handleSend = () => {
    if (!content.trim() || !currentUser || !currentConversationId || !window.socket) return;

    const messageData = {
      conversationId: currentConversationId,
      senderId: currentUser.id,
      content: content.trim(),
    };

    window.socket.emit('sendMessage', messageData);
    setContent('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center p-2 border-t">
      <input
        type="text"
        placeholder="Напишите сообщение..."
        className="flex-1 p-2 rounded border"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyPress}
      />
      <button
        onClick={handleSend}
        disabled={!content.trim()}
        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Отправить
      </button>
    </div>
  );
};

export default MessageInput;
