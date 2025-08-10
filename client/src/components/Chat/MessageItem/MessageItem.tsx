import React, { useEffect, useState } from 'react';
import { MessageReactions } from '../MessageReactions/MessageReactions';
import { getMessageReactions } from '../../../utils/api/chat.api';
import './MessageItem.scss';

interface GroupedReaction {
  emoji: string;
  count: number;
  users: { id: number; username: string; profilePicture: string | null }[];
}

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

function toAbsoluteUrl(url?: string): string {
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
  senderUsername,
  isOwnMessage,
  mediaType,
  mediaUrl,
  stickerUrl,
  fileName,
  groupedReactions = [],
}) => {
  const [showReactionsPopup, setShowReactionsPopup] = useState(false);
  const [reactions, setReactions] = useState<GroupedReaction[]>(groupedReactions);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetch = async () => {
      try {
        const { reactions } = await getMessageReactions(messageId);
        if (!isCancelled) setReactions(reactions);
      } catch {
      }
    };

    fetch();
    return () => {
      isCancelled = true;
    };
  }, [messageId]);

  const normalizedMediaUrl = toAbsoluteUrl(mediaUrl);
  const uploadsFallback =
    mediaUrl ? `/uploads/${encodeURIComponent(mediaUrl.split('/').pop() || '')}` : '';
  const isImage =
    (mediaType === 'image' || mediaType === 'gif') && !!mediaUrl
      ? true
      : normalizedMediaUrl
        ? isImageByExt(normalizedMediaUrl)
        : false;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowReactionsPopup((prev) => !prev);
  };

  return (
    <div
      className={`message-item ${isOwnMessage ? 'own' : ''}`}
      onContextMenu={handleContextMenu}
    >
      <div className="message-content">
        <span className="sender">{senderUsername}:</span> {content}
      </div>

      {/* Медиа — изображение/гиф с запасным путём */}
      {isImage && mediaUrl && (
        <div className="message-media">
          {!imageFailed ? (
            <img
              className="message-image"
              src={normalizedMediaUrl}
              alt={fileName ?? 'image'}
              loading="lazy"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                if (uploadsFallback && el.src !== uploadsFallback) {
                  el.src = uploadsFallback;
                } else {
                  setImageFailed(true);
                }
              }}
            />
          ) : (
            <div className="message-image-fallback">Изображение недоступно</div>
          )}
        </div>
      )}

      {mediaType === 'sticker' && stickerUrl && (
        <img src={toAbsoluteUrl(stickerUrl)} alt="sticker" className="message-image" />
      )}

      {mediaType === 'file' && mediaUrl && (
        <a
          href={`/uploads/${encodeURIComponent(mediaUrl.split('/').pop() || '')}`}
          download={fileName ?? undefined}
          className="file-link"
        >
          📎 {fileName}
        </a>
      )}

      {/* Реакции — всегда видны, если они есть */}
      {reactions.length > 0 && (
        <div className="message-reactions-static">
          {reactions.map((r) => (
            <span key={r.emoji} className="reaction-chip">
              <span className="reaction-chip__emoji">{r.emoji}</span>
              <span className="reaction-chip__count">{r.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Попап выбора реакций (ПКМ) — обновляет состояния через onReactionsUpdate */}
      {showReactionsPopup && (
        <div className="reactions-popup" onClick={() => setShowReactionsPopup(false)}>
          <MessageReactions
            messageId={messageId}
            currentUserId={currentUserId}
            onReactionsUpdate={setReactions}
          />
        </div>
      )}
    </div>
  );
};
