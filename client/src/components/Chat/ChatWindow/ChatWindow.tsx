import React, { useEffect, useRef } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatStore } from '@/stores/chatStore';
import { getChatMessages } from '@/utils/api/chat.api';
import { decrypt } from '@/utils/encryption';
import './ChatWindow.scss';

const ChatWindow = () => {
  const { messages, setMessages, clearMessages } = useMessageStore();
  const { currentConversationId } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

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
              <p>
                <strong>{msg.sender.username}: </strong>
                <span style={{ color: 'red', fontWeight: 'bold' }}>
                  {msg.encryptedContent ? (() => {
                    try {
                      const decrypted = decrypt(msg.encryptedContent);
                      console.log("🔓", msg.encryptedContent, "→", decrypted);
                      return decrypted;
                    } catch (e) {
                      console.warn("❌ Ошибка расшифровки:", msg.encryptedContent);
                      return "[ошибка]";
                    }
                  })() : '[нет контента]'}
                </span>
              </p>

              {msg.mediaType === 'image' && msg.mediaUrl && (
                <img src={msg.mediaUrl} alt="image" />
              )}

              {msg.mediaType === 'gif' && msg.mediaUrl && (
                <img src={msg.mediaUrl} alt="gif" className="media-gif" />
              )}

              {msg.mediaType === 'sticker' && msg.stickerUrl && (
                <img src={msg.stickerUrl} alt="sticker" />
              )}

              {msg.mediaType === 'file' && msg.mediaUrl && (
                <a href={msg.mediaUrl} download={msg.fileName ?? undefined}>
                  📎 {msg.fileName}
                </a>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatWindow;