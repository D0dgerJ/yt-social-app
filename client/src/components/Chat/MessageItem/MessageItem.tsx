import React, { useState } from 'react';
import { MessageReactions } from '../MessageReactions/MessageReactions';
import './MessageItem.scss';

interface MessageItemProps {
  messageId: number;
  content: string;
  currentUserId: number;
  senderId: number;
  senderUsername: string;
  isOwnMessage: boolean;
  mediaType?: string;
  mediaUrl?: string;
  stickerUrl?: string;
  fileName?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  messageId,
  content,
  currentUserId,
  senderId,
  senderUsername,
  isOwnMessage,
  mediaType,
  mediaUrl,
  stickerUrl,
  fileName,
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowReactions((prev) => !prev);
  };

  const handleClickOutside = () => {
    setShowReactions(false);
  };

  return (
    <div
      className={`message-item ${isOwnMessage ? 'own' : ''}`}
      onContextMenu={handleContextMenu}
    >
      <div className="message-content">
        <span className="sender">{senderUsername}:</span> {content}
      </div>

      {showReactions && (
        <div className="reactions-popup" onClick={handleClickOutside}>
          <MessageReactions
            messageId={messageId}
            currentUserId={currentUserId}
          />
        </div>
      )}

      {mediaType === 'image' && mediaUrl && (
        <img src={mediaUrl} alt="image" />
      )}

      {mediaType === 'gif' && mediaUrl && (
        <img src={mediaUrl} alt="gif" className="media-gif" />
      )}

      {mediaType === 'sticker' && stickerUrl && (
        <img src={stickerUrl} alt="sticker" />
      )}

      {mediaType === 'file' && mediaUrl && (
        <a
          href={`/uploads/${encodeURIComponent(
            mediaUrl.split('/').pop() || ''
          )}`}
          download={fileName ?? undefined}
        >
          📎 {fileName}
        </a>
      )}
    </div>
  );
};
