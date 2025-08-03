import React, { useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuth } from '@/context/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useMessageStore, type Message } from '@/stores/messageStore';
import { encrypt } from '@/utils/encryption';
import { v4 as uuidv4 } from 'uuid';
import EmojiPicker from 'emoji-picker-react';
import GifPicker from './GifPicker';
import './MessageInput.scss';

const MessageInput: React.FC = () => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const { currentConversationId } = useChatStore();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addMessage, replaceMessage } = useMessageStore();

  const sendMessage = ({
    text,
    mediaUrl,
    mediaType = 'text',
  }: {
    text: string;
    mediaUrl?: string;
    mediaType?: 'text' | 'gif' | 'image' | 'video';
  }) => {
    if (!currentConversationId || !socket || !user?.id) return;

    const encryptedContent = encrypt(text);
    const clientMessageId = uuidv4();
    const now = new Date().toISOString();

    const tempMessage = {
      id: `temp-${clientMessageId}`,
      conversationId: currentConversationId,
      senderId: user.id,
      content: text,
      mediaUrl,
      mediaType,
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

    if (mediaType === 'text') setContent('');
    setShowEmoji(false);
    setShowGifPicker(false);

    // ⚠️ Сборка payload без лишних null-полей
    const payload: any = {
      conversationId: currentConversationId,
      senderId: user.id,
      clientMessageId,
    };

    if (text.trim()) {
      payload.encryptedContent = encryptedContent;
    }

    if (mediaUrl) {
      payload.mediaUrl = mediaUrl;
      payload.mediaType = mediaType;
    }

    socket.emit('sendMessage', payload, (response: any) => {
      if (response.status === 'ok') {
        replaceMessage(clientMessageId, {
          ...response.message,
          isDelivered: true,
        });
      } else {
        console.error('Ошибка при отправке:', response.error);
      }
    });
  };


  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage({ text: content.trim() });
  };

  const handleGifSelect = (gifUrl: string) => {
    sendMessage({ text: '', mediaUrl: gifUrl, mediaType: 'gif' });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="message-input-container">
      <div className="emoji-wrapper">
        <button className="emoji-toggle-button" onClick={() => setShowEmoji(!showEmoji)}>
          😊
        </button>
        {showEmoji && (
          <div className="emoji-picker-wrapper">
            <EmojiPicker onEmojiClick={handleEmojiClick} height={300} />
          </div>
        )}
      </div>

      <div className="gif-wrapper">
        <button className="gif-toggle-button" onClick={() => setShowGifPicker(!showGifPicker)}>
          🎬
        </button>
        {showGifPicker && (
          <div className="gif-picker-wrapper">
            <GifPicker onSelect={handleGifSelect} />
          </div>
        )}
      </div>

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
