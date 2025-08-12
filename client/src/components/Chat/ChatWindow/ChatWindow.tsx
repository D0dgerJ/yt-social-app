import React, { useEffect, useRef } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatStore } from '@/stores/chatStore';
import { getChatMessages } from '@/utils/api/chat.api';
import { decrypt } from '@/utils/encryption';
import { MessageItem } from '../MessageItem/MessageItem';
import { useUserStore } from '@/stores/userStore';
import './ChatWindow.scss';

const ChatWindow = () => {
  const { messages, setMessages, clearMessages } = useMessageStore();
  const { currentConversationId } = useChatStore();
  const currentUser = useUserStore((state) => state.currentUser);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMedia = (msg: any): boolean => {
    return !!(msg.mediaUrl || msg.stickerUrl || msg.gifUrl || msg.fileName);
  };

  useChatSocket();

  // Загрузка истории сообщений
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentConversationId) return;
      try {
        clearMessages(); // Очищаем старые сообщения перед загрузкой новых
        const data = await getChatMessages(currentConversationId);
        setMessages(data);
      } catch (error) {
        console.error("❌ Ошибка загрузки сообщений:", error);
      }
    };

    loadMessages();
  }, [currentConversationId, setMessages, clearMessages]);

  // Автоскролл вниз
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.length === 0 ? (
          <p className="empty">Нет сообщений</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="message">

              <MessageItem
                key={msg.id}
                messageId={msg.id}
                content={
                  msg.encryptedContent
                    ? (() => {
                        try {
                          return decrypt(msg.encryptedContent);
                        } catch {
                          return '[ошибка]';
                        }
                      })()
                    : !hasMedia(msg)
                    ? '[нет контента]'
                    : ''
                }
                currentUserId={currentUser?.id ?? 0}
                senderId={msg.senderId}
                senderUsername={msg.sender.username}
                isOwnMessage={msg.senderId === currentUser?.id}
                mediaType={msg.mediaType}
                mediaUrl={msg.mediaUrl}
                stickerUrl={msg.stickerUrl}
                fileName={msg.fileName}
              />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatWindow;