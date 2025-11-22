import React, { useCallback, useMemo, useRef, useState } from 'react';
import { MessageReactions } from '../MessageReactions/MessageReactions';
import {
  getMessageReactions as getReactionsREST,
  transcribeMessage as transcribeMessageREST,
  registerMessageView as registerMessageViewREST,
} from '@/utils/api/chat.api';
import ReplyPreview from '@/components/Chat/ReplyPreview/ReplyPreview';
import {
  useMessageStore,
  type RepliedToLite,
  type Message,
} from '@/stores/messageStore';
import './MessageItem.scss';

interface GroupedReaction {
  emoji: string;
  count: number;
  users: { id: number; username: string; profilePicture: string | null }[];
}

interface MessageItemProps {
  conversationId?: number;

  messageId: number;
  clientMessageId?: string | null;

  currentUserId?: number;
  senderId: number;
  senderUsername?: string;
  displayName?: string;
  isOwnMessage?: boolean;

  content?: string;
  encryptedContent?: string | null;

  mediaUrl?: string | null;
  mediaType?:
    | 'image'
    | 'video'
    | 'file'
    | 'gif'
    | 'audio'
    | 'text'
    | 'sticker'
    | null;
  fileName?: string | null;

  mediaFiles?: Message['mediaFiles'];

  gifUrl?: string | null;
  stickerUrl?: string | null;

  isDelivered?: boolean;
  isRead?: boolean;
  localStatus?: 'sending' | 'sent' | 'failed';
  createdAt?: string;

  groupedReactions?: GroupedReaction[];

  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReactToggle?: (emoji: string) => void;
  onOpenAttachment?: (url: string) => void;

  resolveName?: (userId: number) => string | undefined;

  repliedToId?: number | null;
  repliedTo?: RepliedToLite | null;
  isEphemeral?: boolean;
  maxViewsPerUser?: number | null;
  remainingViewsForMe?: number | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function toAbsoluteUrl(url?: string | null): string {
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

function buildDownloadUrl(fileUrlFromMessage: string): string {
  let storedName = '';

  try {
    const u = new URL(fileUrlFromMessage);
    storedName = u.pathname.split('/').pop() || '';
  } catch {
    storedName = fileUrlFromMessage.split('/').pop() || '';
  }

  const base = String(API_BASE).replace(/\/+$/, '');
  return `${base}/api/v1/download/uploads/${storedName}`;
}

const isImageByExt = (url?: string) =>
  !!url &&
  /\.(png|jpe?g|webp|avif|gif|bmp|svg)$/i.test(
    (url.split('?')[0] ?? '').toLowerCase(),
  );

const MediaGrid: React.FC<{
  items: NonNullable<Message['mediaFiles']>;
  onOpen?: (url: string) => void;
}> = ({ items, onOpen }) => {
  if (!items?.length) return null;

  const count = Math.min(items.length, 10);
  const subset = items.slice(0, count);
  const extraCount = items.length - count;
  const cols = count <= 3 ? count : count <= 6 ? 3 : 4;

  const handleDownload = (fileUrl: string) => {
    const a = document.createElement('a');
    a.href = buildDownloadUrl(fileUrl);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const onKeyOpen = (e: React.KeyboardEvent, url: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDownload(url);
    }
  };

  function formatFileSize(bytes?: number | null): string {
    if (!bytes || bytes <= 0) return '';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  }

  return (
    <div className={`message-media-grid message-media-grid--c${cols}`}>
      {subset.map((m, idx) => {
        const isImage = m.type === 'image' || m.type === 'gif' || isImageByExt(m.url);
        const isVideo = m.type === 'video';
        const isAudio = m.type === 'audio';
        const isFile = m.type === 'file';

        const isSingleAudioOnly = isAudio && items.length === 1;

        if (isSingleAudioOnly) {
          return null;
        }

        return (
          <div
            key={m.id ?? `${m.url}-${idx}`}
            className="message-media-grid__cell"
          >
            {isImage && (
              <>
                <img
                  className="message-media-grid__img"
                  src={m.url}
                  alt={m.originalName || 'attachment'}
                  loading="lazy"
                  onClick={() => onOpen?.(m.url)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => onKeyOpen(e, m.url)}
                />
                {idx === count - 1 && extraCount > 0 && (
                  <div className="message-media-grid__more">+{extraCount}</div>
                )}
              </>
            )}

            {isVideo && (
              <video
                className="message-media-grid__video"
                src={m.url}
                controls
                preload="metadata"
                onDoubleClick={() => onOpen?.(m.url)}
              />
            )}

            {isAudio && (
              <audio
                className="message-media-grid__audio"
                src={buildDownloadUrl(m.url)}
                controls
                preload="metadata"
              />
            )}

            {isFile && (
              <button
                type="button"
                className="chat-file-bubble chat-file-bubble--grid"
                onClick={() => handleDownload(m.url)}
                onKeyDown={(e) => onKeyOpen(e, m.url)}
                title={m.originalName || 'Файл'}
              >
                <div className="chat-file-bubble__icon">
                  <div className="chat-file-bubble__icon-ext">
                    {(m.originalName || m.url).split('.').pop()?.toUpperCase() ||
                      'FILE'}
                  </div>
                </div>

                <div className="chat-file-bubble__body">
                  <div className="chat-file-bubble__name">
                    {m.originalName || 'Файл'}
                  </div>

                  <div className="chat-file-bubble__meta">
                    {formatFileSize(m.size) || 'Документ'}
                  </div>
                </div>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({
  conversationId,
  messageId,
  clientMessageId,

  currentUserId,
  senderId,
  senderUsername,
  displayName,

  content,
  encryptedContent,

  mediaUrl,
  mediaType,
  fileName,

  mediaFiles,

  gifUrl,
  stickerUrl,

  isOwnMessage,
  isDelivered,
  isRead,
  localStatus,
  createdAt,

  groupedReactions,

  onReply,
  onEdit,
  onDelete,
  onReactToggle,
  onOpenAttachment,

  resolveName,

  repliedToId,
  repliedTo,
  isEphemeral,
  maxViewsPerUser,
  remainingViewsForMe,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactionsPopup, setShowReactionsPopup] = useState(false);

  const [imageFailed, setImageFailed] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  const [reactions, setReactions] = useState<GroupedReaction[]>(
    groupedReactions ?? [],
  );
  const [reactionsLoaded, setReactionsLoaded] = useState(
    !!(groupedReactions && groupedReactions.length),
  );
  const [loadingReactions, setLoadingReactions] = useState(false);

  const [transcript, setTranscript] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);

  const getById = useMessageStore((s) => s.getById);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const updateMessageGlobal = useMessageStore((s) => s.updateMessage);

  const isEphemeralActive =
    !!isEphemeral && typeof maxViewsPerUser === 'number' && maxViewsPerUser > 0;

  const [revealed, setRevealed] = useState(!isEphemeralActive);
  const [remainingViews, setRemainingViews] = useState<number | null>(() => {
    if (!isEphemeralActive) return null;
    if (typeof remainingViewsForMe === 'number') return remainingViewsForMe;
    if (typeof maxViewsPerUser === 'number') return maxViewsPerUser;
    return null;
  });

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

  const normalizedMediaUrl = toAbsoluteUrl(mediaUrl || undefined);
  const uploadsFallback = useMemo(
    () =>
      mediaUrl ? `/uploads/${encodeURIComponent(mediaUrl.split('/').pop() || '')}` : '',
    [mediaUrl],
  );

  const isSingleImage =
    !!mediaUrl &&
    (mediaType === 'image' || mediaType === 'gif' || isImageByExt(normalizedMediaUrl));

  const displayNameComputed = useMemo(() => {
    if (displayName && displayName.trim()) return displayName.trim();
    const viaResolver = resolveName?.(senderId);
    if (viaResolver && viaResolver.trim()) return viaResolver.trim();
    if (senderUsername && senderUsername !== String(senderId)) return senderUsername;
    return `User#${senderId}`;
  }, [displayName, resolveName, senderId, senderUsername]);

  const replyData: RepliedToLite | null = useMemo(() => {
    if (repliedTo) return repliedTo;
    if (conversationId && repliedToId) {
      const original = getById(conversationId, repliedToId);
      if (original) {
        return {
          id: original.id,
          senderId: original.senderId,
          encryptedContent: original.encryptedContent ?? null,
          content: original.content,
          mediaUrl: original.mediaUrl ?? null,
          mediaType: (original.mediaType as any) ?? null,
          fileName: original.fileName ?? null,
          isDeleted: false,
          sender: original.sender
            ? {
                id: original.sender.id,
                username: original.sender.username,
                profilePicture: original.sender.profilePicture ?? null,
              }
            : null,
        };
      }
    }
    return null;
  }, [repliedTo, conversationId, repliedToId, getById]);

  const toggleReactionQuick = useCallback(
    (emoji: string) => {
      if (!currentUserId) return;
      const mine = reactions.some(
        (r) => r.emoji === emoji && r.users?.some((u) => u.id === currentUserId),
      );
      setReactions((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((r) => r.emoji === emoji);
        if (idx >= 0) {
          const r = copy[idx];
          if (mine) {
            copy[idx] = {
              ...r,
              count: Math.max(0, r.count - 1),
              users: r.users.filter((u) => u.id !== currentUserId),
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
    [onReactToggle, reactions, currentUserId],
  );

  const myReactions = useMemo(() => {
    const set = new Set<string>();
    reactions.forEach((r) => {
      if (currentUserId && r.users?.some((u) => u.id === currentUserId)) set.add(r.emoji);
    });
    return set;
  }, [reactions, currentUserId]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    void openReactionsPopup();
  };
  const handleTouchStart = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      void openReactionsPopup();
    }, 450) as unknown as number;
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const handleJumpToOriginal = useCallback(() => {
    if (!repliedToId) return;
    const el =
      document.querySelector<HTMLElement>(`[data-message-id="${repliedToId}"]`) ||
      document.querySelector<HTMLElement>(`[data-id="${repliedToId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const prevBoxShadow = el.style.boxShadow;
      el.style.boxShadow = '0 0 0 2px #10b981';
      setTimeout(() => {
        el.style.boxShadow = prevBoxShadow;
      }, 1200);
    }
  }, [repliedToId]);

  const singleFileDownloadHref = useMemo(() => {
    if (!mediaUrl || mediaType !== 'file') return undefined;
    return buildDownloadUrl(mediaUrl);
  }, [mediaUrl, mediaType]);

  const handleTranscribeClick = useCallback(async () => {
    if (transcript) {
      setIsTranscriptVisible((v) => !v);
      return;
    }

    if (!messageId) return;

    try {
      setIsTranscribing(true);
      setTranscribeError(null);

      const text = await transcribeMessageREST(messageId);

      setTranscript(text || '(пусто)');
      setIsTranscriptVisible(true);
    } catch (err: any) {
      console.error('[transcribe] error:', err);
      setTranscribeError(
        err?.message || 'Ошибка при расшифровке голосового сообщения',
      );
    } finally {
      setIsTranscribing(false);
    }
  }, [messageId, transcript]);

  const handleOpenEphemeral = useCallback(
    async (urlToOpen?: string) => {
      if (!isEphemeralActive) {
        if (urlToOpen && onOpenAttachment) onOpenAttachment(urlToOpen);
        return;
      }

      try {
        const { removed, remainingViews } = await registerMessageViewREST(messageId);

        if (removed) {
          removeMessage(messageId);
          return;
        }

        setRevealed(true);
        setRemainingViews(
          typeof remainingViews === 'number' ? remainingViews : remainingViews ?? null,
        );

        if (conversationId) {
          updateMessageGlobal({
            id: messageId,
            conversationId,
            remainingViewsForMe:
              typeof remainingViews === 'number' ? remainingViews : remainingViews ?? null,
          });
        }

        if (urlToOpen && onOpenAttachment) {
          onOpenAttachment(urlToOpen);
        }
      } catch (e) {
        console.error('[ephemeral] register view failed', e);
      }
    },
    [
      isEphemeralActive,
      messageId,
      conversationId,
      onOpenAttachment,
      removeMessage,
      updateMessageGlobal,
    ],
  );

  return (
    <div
      className={`message-item ${isOwnMessage ? 'own' : ''} ${
        isEphemeralActive ? 'message-item--ephemeral' : ''
      }`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-id={messageId}
      data-message-id={messageId}
      role="article"
      aria-label="Сообщение"
    >
      <div className="message-header">
        <span className="sender">{displayNameComputed}</span>

        {isEphemeralActive && (
          <span className="message-ephemeral-badge">
            Эфемерное
            {typeof remainingViews === 'number' && (
              <span className="message-ephemeral-badge__counter">
                · осталось {remainingViews}
              </span>
            )}
          </span>
        )}

        <button
          type="button"
          className="message-actions-btn"
          aria-label="Действия над сообщением"
          onClick={() => setShowActions((s) => !s)}
        >
          ⋯
        </button>

        {showActions && (
          <div
            className="message-actions-menu"
            onMouseLeave={() => setShowActions(false)}
          >
            <button type="button" onClick={() => onReply?.()}>
              Ответить
            </button>
            {isOwnMessage && (
              <button type="button" onClick={() => onEdit?.()}>
                Редактировать
              </button>
            )}
            {isOwnMessage && (
              <button
                type="button"
                className="danger"
                onClick={() => onDelete?.()}
              >
                Удалить
              </button>
            )}
            <div className="message-actions-reactions">
              <button type="button" onClick={() => toggleReactionQuick('❤️')}>
                ❤️
              </button>
              <button type="button" onClick={() => toggleReactionQuick('👍')}>
                👍
              </button>
              <button type="button" onClick={() => toggleReactionQuick('😂')}>
                😂
              </button>
              <button type="button" onClick={() => toggleReactionQuick('🔥')}>
                🔥
              </button>
              <button type="button" onClick={() => toggleReactionQuick('👏')}>
                👏
              </button>
            </div>
          </div>
        )}
      </div>

      {(repliedTo || repliedToId) && (
        <ReplyPreview reply={replyData} onClick={handleJumpToOriginal} />
      )}

      {/* 🔹 заглушка для эфемерных, пока не раскрыты */}
      {isEphemeralActive && !revealed && (
        <button
          type="button"
          className="message-ephemeral-placeholder"
          onClick={() => handleOpenEphemeral()}
        >
          <span className="message-ephemeral-placeholder__title">
            🔒 Эфемерное сообщение
          </span>
          {typeof remainingViews === 'number' && (
            <span className="message-ephemeral-placeholder__counter">
              Осталось просмотров: {remainingViews}
            </span>
          )}
          <span className="message-ephemeral-placeholder__hint">
            Нажмите, чтобы открыть
          </span>
        </button>
      )}

      {/* текст показываем только если не эфемерное или уже раскрыто */}
      {!isEphemeralActive && content && (
        <div className="message-content">{content}</div>
      )}

      {isEphemeralActive && revealed && content && (
        <div
          className="message-content message-content--ephemeral-visible"
          onClick={() => handleOpenEphemeral()}
        >
          {content}
        </div>
      )}

      {/* мультивложения */}
      {(!isEphemeralActive || revealed) && mediaFiles && mediaFiles.length > 0 && (
        <MediaGrid
          items={mediaFiles}
          onOpen={(url) => handleOpenEphemeral(url)}
        />
      )}

      {/* одиночное изображение */}
      {(!isEphemeralActive || revealed) &&
        isSingleImage &&
        !mediaFiles?.length && (
          <div className="message-media">
            {!imageFailed ? (
              <img
                className="message-image"
                src={normalizedMediaUrl}
                alt={fileName ?? 'image'}
                loading="lazy"
                onClick={() => handleOpenEphemeral(normalizedMediaUrl)}
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

      {/* видео / аудио / файл / стикер — тоже прячем, пока эфемерное не раскрыто */}
      {(!isEphemeralActive || revealed) &&
        !mediaFiles?.length &&
        mediaType === 'video' &&
        mediaUrl && (
          <video
            className="message-video"
            src={normalizedMediaUrl}
            controls
            preload="metadata"
            onDoubleClick={() => handleOpenEphemeral(normalizedMediaUrl)}
          />
        )}

      {(!isEphemeralActive || revealed) &&
        mediaType === 'audio' &&
        mediaUrl && (
          <div className="message-audio-block">
            <audio
              className="message-audio"
              src={buildDownloadUrl(mediaUrl)}
              controls
              preload="metadata"
            />

            <button
              type="button"
              className="message-audio-transcribe-btn"
              onClick={handleTranscribeClick}
              disabled={isTranscribing}
            >
              {isTranscribing
                ? 'Расшифровка…'
                : transcript
                ? isTranscriptVisible
                  ? 'Скрыть текст'
                  : 'Показать текст'
                : 'Транскрипция'}
            </button>

            {transcribeError && (
              <div className="message-transcript-error">{transcribeError}</div>
            )}

            {transcript && isTranscriptVisible && (
              <div className="message-transcript">{transcript}</div>
            )}
          </div>
        )}

      {(!isEphemeralActive || revealed) &&
        !mediaFiles?.length &&
        mediaType === 'file' &&
        mediaUrl && (
          <a
            className={`chat-file-bubble ${
              isOwnMessage ? 'chat-file-bubble--own' : ''
            }`}
            href={singleFileDownloadHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (isEphemeralActive) {
                e.preventDefault();
                void handleOpenEphemeral(singleFileDownloadHref);
              }
            }}
          >
            <div className="chat-file-bubble__icon">
              <div className="chat-file-bubble__icon-ext">
                {(fileName || mediaUrl).split('.').pop()?.toUpperCase() || 'FILE'}
              </div>
            </div>

            <div className="chat-file-bubble__body">
              <div className="chat-file-bubble__name">
                {fileName ?? decodeURIComponent(mediaUrl.split('/').pop() || 'Файл')}
              </div>

              <div className="chat-file-bubble__meta">Файл</div>
            </div>
          </a>
        )}

      {(!isEphemeralActive || revealed) &&
        !mediaFiles?.length &&
        mediaType === 'sticker' &&
        stickerUrl && (
          <img
            src={toAbsoluteUrl(stickerUrl)}
            alt="sticker"
            className="message-image"
            onClick={() => handleOpenEphemeral(toAbsoluteUrl(stickerUrl))}
          />
        )}

      {/* реакции */}
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
                    ? `${r.emoji} · ${r.users
                        .slice(0, 5)
                        .map((u) => u.username)
                        .join(', ')}${r.users.length > 5 ? '…' : ''}`
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
            currentUserId={currentUserId ?? -1}
            reactions={reactions}
            onReactionsUpdate={setReactions}
            onToggleReaction={
              onReactToggle ? (emoji) => onReactToggle(emoji) : undefined
            }
          />
          {loadingReactions && (
            <div className="reactions-loading">Загружаю…</div>
          )}
        </div>
      )}

      <div className="message-status">
        {localStatus === 'sending' && <span>Отправка…</span>}
        {localStatus === 'failed' && (
          <span className="danger">Не отправлено</span>
        )}
        {isDelivered && <span>Доставлено</span>}
        {isRead && <span>Прочитано</span>}
      </div>
    </div>
  );
};

export default MessageItem;
