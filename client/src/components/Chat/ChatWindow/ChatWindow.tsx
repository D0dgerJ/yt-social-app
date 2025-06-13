import React, { useEffect, useRef } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useChatSocket } from '@/hooks/useChatSocket';

const ChatWindow = () => {
  const { messages } = useMessageStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useChatSocket();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.length === 0 ? (
        <p className="empty">Нет сообщений</p>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className="message">
            <p>
              <strong>{msg.sender.username}: </strong>
              {msg.content}
            </p>

            {msg.mediaType === 'image' && <img src={msg.mediaUrl} alt="image" />}
            {msg.mediaType === 'gif' && <img src={msg.gifUrl} alt="gif" />}
            {msg.mediaType === 'sticker' && <img src={msg.stickerUrl} alt="sticker" />}
            {msg.mediaType === 'file' && (
              <a href={msg.mediaUrl} download={msg.fileName}>
                📎 {msg.fileName}
              </a>
            )}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
