import React, { useState } from 'react';
import { MessageReactions, type GroupedReaction } from '../MessageReactions/MessageReactions';
import './MessageItem.scss';

interface MessageItemProps {
  messageId: number;
  content: string;
  currentUserId: number;
  senderId: number;
  senderUsername: string;
  isOwnMessage: boolean;
  mediaType?: 'text' | 'image' | 'video' | 'gif' | 'file' | 'sticker';
  mediaUrl?: string;
  stickerUrl?: string;
  fileName?: string;
  groupedReactions?: GroupedReaction[];
}

const API_BASE = import.meta.env.VITE_API_URL ?? window.location.origin;

function toAbsoluteUrl(url: string | undefined | null): string {
  if (!url) return '';
  try {
    new URL(url);
    return url;
  } catch {
    return `${String(API_BASE).replace(/\/+$/, '')}/${String(url).replace(/^\/+/, '')}`;
  }
}

function isImageByExt(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].some((ext) => clean.endsWith(ext));
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
  groupedReactions = [],
}) => {
  const [showReactionsPicker, setShowReactionsPicker] = useState(false);
  const [currentReactions, setCurrentReactions] = useState<GroupedReaction[]>(groupedReactions);
  const [imageFailed, setImageFailed] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowReactionsPicker((prev) => !prev);
  };

  const handleReactionsUpdate = (reactions: GroupedReaction[]) => {
    setCurrentReactions(reactions);
  };

  const normalizedMediaUrl = toAbsoluteUrl(mediaUrl);
  const uploadsFallback =
    mediaUrl ? `/uploads/${encodeURIComponent(mediaUrl.split('/').pop() || '')}` : '';

  const isImage =
    (mediaType === 'image' || mediaType === 'gif' || isImageByExt(normalizedMediaUrl));

  return (
    <div
      className={`message-item${isOwnMessage ? ' message-item--own' : ''}`}
      onContextMenu={handleContextMenu}
    >
      <div className="message-content">
        <span className="message-content__sender">{senderUsername}:</span>
        <span className="message-content__text">{content}</span>
      </div>

      {/* Медиа — изображения и гифы: показываем <img>, плюс fallback, плюс плейсхолдер */}
      {isImage && mediaUrl && (
        <div className="message-media">
          {!imageFailed ? (
            <img
              className="message-media__image"
              src={normalizedMediaUrl}
              alt={fileName ?? 'image'}
              loading="lazy"
              onError={(e) => {
                if (uploadsFallback && (e.currentTarget as HTMLImageElement).src !== uploadsFallback) {
                  (e.currentTarget as HTMLImageElement).src = uploadsFallback;
                } else {
                  setImageFailed(true);
                }
              }}
            />
          ) : (
            <div className="message-media__placeholder">Изображение недоступно</div>
          )}
        </div>
      )}

      {/* Стикер */}
      {mediaType === 'sticker' && stickerUrl && (
        <div className="message-media">
          <img className="message-media__sticker" src={toAbsoluteUrl(stickerUrl)} alt="sticker" />
        </div>
      )}

      {/* Файл (не изображение) — иконка/ссылка (рендер оставлен как был) */}
      {mediaType === 'file' && mediaUrl && (
        <a
          href={`/uploads/${encodeURIComponent(mediaUrl.split('/').pop() || '')}`}
          download={fileName ?? undefined}
          className="message-file"
        >
          📎 {fileName}
        </a>
      )}

      {/* Реакции */}
      {currentReactions.length > 0 && (
        <div className="message-reactions-static">
          {currentReactions.map((r) => (
            <span key={r.emoji} className="message-reaction-chip">
              <span className="message-reaction-chip__emoji">{r.emoji}</span>
              <span className="message-reaction-chip__count">{r.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Попап выбора реакций — по ПКМ (или можно повесить на клик по иконке) */}
      {showReactionsPicker && (
        <div
          className="reactions-popup"
          onClick={() => setShowReactionsPicker(false)}
          role="presentation"
        >
          <MessageReactions
            messageId={messageId}
            currentUserId={currentUserId}
            onReactionsUpdate={handleReactionsUpdate}
          />
        </div>
      )}
    </div>
  );
};
