import React, { useCallback, useMemo, useRef, useState } from 'react';
import { MessageReactions } from '../MessageReactions/MessageReactions';
import { getReactionsREST } from '@/services/chatApi';
import FileIcon from '../FileIcon/FileIcon';
import './MessageItem.scss';

interface GroupedReaction {
  emoji: string;
  count: number;
  users: { id: number; username: string; profilePicture: string | null }[];
}

interface MessageItemProps {
  conversationId?: number;
  messageId: number;
  content: string;
  currentUserId: number;
  senderId: number;
  senderUsername: string;
  isOwnMessage: boolean;

  mediaType?: 'text' | 'image' | 'video' | 'gif' | 'file' | 'sticker' | 'audio';
  mediaUrl?: string;
  stickerUrl?: string;
  fileName?: string;

  groupedReactions?: GroupedReaction[];

  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReactToggle?: (emoji: string) => void;

  resolveName?: (userId: number) => string | undefined;
}

const API_BASE = import.meta.env.VITE_API_URL ?? window.location.origin;

function toAbsoluteUrl(url?: string): string {
  if (!url) return '';
  try {
    new URL(url);
    return url;
  } catch {
    const base = String(API_BASE).replace(/\/+$/, '');
    const rel = String(url).replace(/^\/+/, '');
    return `${base}/${rel}`;
  }
}

function isImageByExt(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'].some((ext) => clean.endsWith(ext));
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
  groupedReactions,
  onReply,
  onEdit,
  onDelete,
  onReactToggle,
  resolveName,
}) => {
  const [showReactionsPopup, setShowReactionsPopup] = useState(false);
  const [reactions, setReactions] = useState<GroupedReaction[]>(groupedReactions ?? []);
  const [reactionsLoaded, setReactionsLoaded] = useState(!!(groupedReactions && groupedReactions.length));
  const [loadingReactions, setLoadingReactions] = useState(false);

  const [imageFailed, setImageFailed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  const ensureReactions = useCallback(async () => {
    if (reactionsLoaded || loadingReactions) return;
    try {
      setLoadingReactions(true);
      const data = await getReactionsREST(messageId);
      if (Array.isArray(data)) setReactions(data);
      setReactionsLoaded(true);
    } finally {
      setLoadingReactions(false);
    }
  }, [messageId, reactionsLoaded, loadingReactions]);

  const openReactionsPopup = useCallback(async () => {
    await ensureReactions();
    setShowReactionsPopup((s) => !s);
  }, [ensureReactions]);

  const normalizedMediaUrl = toAbsoluteUrl(mediaUrl);
  const uploadsFallback = useMemo(
    () => (mediaUrl ? `/uploads/${encodeURIComponent(mediaUrl.split('/').pop() || '')}` : ''),
    [mediaUrl]
  );

  const isImage =
    mediaType === 'image' ||
    mediaType === 'gif' ||
    (!!normalizedMediaUrl && isImageByExt(normalizedMediaUrl));

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    void openReactionsPopup();
  };

  const handleTouchStart = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      void openReactionsPopup();
    }, 450);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const toggleReactionQuick = useCallback(
    (emoji: string) => {
      const mine = reactions.some(r => r.emoji === emoji && r.users?.some(u => u.id === currentUserId));
      setReactions(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(r => r.emoji === emoji);
        if (idx >= 0) {
          const r = copy[idx];
          if (mine) {
            copy[idx] = {
              ...r,
              count: Math.max(0, r.count - 1),
              users: r.users.filter(u => u.id !== currentUserId),
            };
          } else {
            copy[idx] = {
              ...r,
              count: r.count + 1,
              users: [...r.users, { id: currentUserId, username: 'me', profilePicture: null }],
            };
          }
        } else {
          copy.push({
            emoji,
            count: 1,
            users: [{ id: currentUserId, username: 'me', profilePicture: null }],
          });
        }
        return copy;
      });
      onReactToggle?.(emoji);
    },
    [onReactToggle, reactions, currentUserId]
  );

  const myReactions = useMemo(() => {
    const set = new Set<string>();
    reactions.forEach((r) => {
      if (r.users?.some((u) => u.id === currentUserId)) set.add(r.emoji);
    });
    return set;
  }, [reactions, currentUserId]);

  const displayName = useMemo(() => {
    const fromResolver = resolveName?.(senderId);
    if (fromResolver && fromResolver.trim()) return fromResolver.trim();
    if (senderUsername && senderUsername !== String(senderId)) return senderUsername;
    return `User#${senderId}`;
  }, [resolveName, senderId, senderUsername]);

  return (
    <div
      className={`message-item ${isOwnMessage ? 'own' : ''}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-id={messageId}
      role="article"
      aria-label="Сообщение"
    >
      <div className="message-header">
        <span className="sender">{displayName}</span>

        {/* Меню действий справа */}
        <button
          type="button"
          className="message-actions-btn"
          aria-label="Действия над сообщением"
          onClick={() => setShowActions((s) => !s)}
        >
          ⋯
        </button>

        {showActions && (
          <div className="message-actions-menu" onMouseLeave={() => setShowActions(false)}>
            <button type="button" onClick={() => onReply?.()}>Ответить</button>
            {isOwnMessage && (
              <button type="button" onClick={() => onEdit?.()}>Редактировать</button>
            )}
            {isOwnMessage && (
              <button type="button" className="danger" onClick={() => onDelete?.()}>
                Удалить
              </button>
            )}
            <div className="message-actions-reactions">
              <button type="button" onClick={() => toggleReactionQuick('❤️')}>❤️</button>
              <button type="button" onClick={() => toggleReactionQuick('👍')}>👍</button>
              <button type="button" onClick={() => toggleReactionQuick('😂')}>😂</button>
              <button type="button" onClick={() => toggleReactionQuick('🔥')}>🔥</button>
              <button type="button" onClick={() => toggleReactionQuick('👏')}>👏</button>
            </div>
          </div>
        )}
      </div>

      {/* Текст */}
      {content && <div className="message-content">{content}</div>}

      {/* Медиа */}
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
          className="message-file"
        >
          <FileIcon nameOrUrl={fileName || mediaUrl} />
          <span className="message-file__name">
            {fileName ?? decodeURIComponent(mediaUrl.split('/').pop() || 'Файл')}
          </span>
        </a>
      )}

      {mediaType === 'audio' && mediaUrl && (
        <audio controls src={toAbsoluteUrl(mediaUrl)} className="message-audio" preload="metadata" />
      )}

      {/* Реакции */}
      {reactions.length > 0 && (
        <div className="message-reactions-static" aria-label="Реакции к сообщению">
          {reactions.map((r) => {
            const mine = myReactions.has(r.emoji);
            return (
              <button
                key={r.emoji}
                className={`reaction-chip ${mine ? 'is-mine' : ''}`}
                onClick={() => toggleReactionQuick(r.emoji)}
                aria-pressed={mine}
                title={
                  r.users?.length
                    ? `${r.emoji} · ${r.users.slice(0, 5).map(u => u.username).join(', ')}${r.users.length > 5 ? '…' : ''}`
                    : r.emoji
                }
              >
                <span className="reaction-chip__emoji">{r.emoji}</span>
                <span className="reaction-chip__count">{r.count}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="reaction-chip reaction-chip--add"
            onClick={openReactionsPopup}
            aria-label="Добавить реакцию"
          >
            +
          </button>
        </div>
      )}

      {showReactionsPopup && (
        <div
          className="reactions-popup"
          role="dialog"
          aria-label="Выбор реакции"
          onClick={() => setShowReactionsPopup(false)}
        >
          <MessageReactions
            messageId={messageId}
            currentUserId={currentUserId}
            reactions={reactions}
            onReactionsUpdate={setReactions}
            onToggleReaction={onReactToggle ? (emoji) => onReactToggle(emoji) : undefined}
          />
          {loadingReactions && <div className="reactions-loading">Загружаю…</div>}
        </div>
      )}
    </div>
  );
};