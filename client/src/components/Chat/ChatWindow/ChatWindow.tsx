import React, { useEffect, useRef } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatStore } from '@/stores/chatStore';
import { getChatMessages } from '@/utils/api/chat.api';
import { decrypt } from '@/utils/encryption';
import { MessageReactions } from '../MessageReactions/MessageReactions';
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
              <p>
                <strong>{msg.sender.username}: </strong>
                <span style={{ color: 'red', fontWeight: 'bold' }}>
                  {msg.encryptedContent ? (
                    (() => {
                      try {
                        const decrypted = decrypt(msg.encryptedContent);
                        return (
                          <span style={{ color: 'red', fontWeight: 'bold' }}>
                            {decrypted}
                          </span>
                        );
                      } catch (e) {
                        return (
                          <span style={{ color: 'red', fontWeight: 'bold' }}>
                            [ошибка]
                          </span>
                        );
                      }
                    })()
                  ) : !hasMedia(msg) ? (
                    <span style={{ color: 'red', fontWeight: 'bold' }}>[нет контента]</span>
                  ) : null}
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
                <a
                  href={`/uploads/${encodeURIComponent(
                    msg.mediaUrl.split('/').pop() || ''
                  )}`}
                  download={msg.fileName ?? undefined}
                >
                  📎 {msg.fileName}
                </a>
              )}

              {currentUser && (
                <MessageReactions messageId={msg.id} currentUserId={currentUser.id} />
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