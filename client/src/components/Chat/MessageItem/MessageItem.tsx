import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from "react-i18next";
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
import AudioWaveform from './AudioWaveform';
import { env } from '@/config/env';
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

  content?: string | null;

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

const API_BASE = env.SERVER_ORIGIN;

function toAbsoluteUrl(url?: string | null): string {
  if (!url) return '';

  try {
    return new URL(url).toString();
  } catch {
    const base = String(API_BASE).replace(/\/+$/, '');
    const rel = String(url).replace(/^\/+/, '');
    return `${base}/${rel}`;
  }
}

function buildDownloadUrl(fileUrlFromMessage: string): string {
  return toAbsoluteUrl(fileUrlFromMessage);
}

const isImageByExt = (url?: string) =>
  !!url &&
  /\.(png|jpe?g|webp|avif|gif|bmp|svg)$/i.test(
    (url.split('?')[0] ?? '').toLowerCase(),
  );

const MediaGrid: React.FC<{
  items: NonNullable<Message["mediaFiles"]>;
  onOpen?: (url: string) => void;
}> = ({ items, onOpen }) => {
  const { t } = useTranslation();
  if (!items?.length) return null;

  const count = Math.min(items.length, 10);
  const subset = items.slice(0, count);
  const extraCount = items.length - count;
  const cols = count <= 3 ? count : count <= 6 ? 3 : 4;

  const handleDownload = (fileUrl: string) => {
    const a = document.createElement('a');
    a.href = buildDownloadUrl(fileUrl);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
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
        const absoluteUrl = toAbsoluteUrl(m.url);
        const downloadableUrl = buildDownloadUrl(m.url);

        const isImage =
          m.type === 'image' || m.type === 'gif' || isImageByExt(absoluteUrl);
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
                  src={absoluteUrl}
                  alt={m.originalName || 'attachment'}
                  loading="lazy"
                  onClick={() => onOpen?.(absoluteUrl)}
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
                src={absoluteUrl}
                controls
                preload="metadata"
                onDoubleClick={() => onOpen?.(absoluteUrl)}
              />
            )}

            {isAudio && (
              <audio
                className="message-media-grid__audio"
                src={downloadableUrl}
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
                title={m.originalName || t("common.file")}
              >
                <div className="chat-file-bubble__icon">
                  <div className="chat-file-bubble__icon-ext">
                    {(m.originalName || m.url).split('.').pop()?.toUpperCase() ||
                      'FILE'}
                  </div>
                </div>

                <div className="chat-file-bubble__body">
                  <div className="chat-file-bubble__name">
                    {m.originalName || t("common.file")}
                  </div>

                  <div className="chat-file-bubble__meta">
                    {formatFileSize(m.size) || t("common.document")}
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
  const { t } = useTranslation();
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const normalizeTime = (sec: number): number => {
    if (!Number.isFinite(sec) || Number.isNaN(sec) || sec < 0) {
      return 0;
    }
    return sec;
  };

  const safeDuration = normalizeTime(audioDuration);
  const safeCurrentTime = normalizeTime(audioCurrentTime);

  const audioProgress =
    audioDuration > 0 ? audioCurrentTime / audioDuration : 0;

  const handleAudioLoadedMetadata = () => {
    if (!audioRef.current) return;
    const dur = normalizeTime(audioRef.current.duration);
    setAudioDuration(dur);
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const t = normalizeTime(audioRef.current.currentTime);
    setAudioCurrentTime(t);
  };

  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
    setAudioCurrentTime(0);
  };

  const toggleAudioPlay = () => {
    const node = audioRef.current;
    if (!node) return;

    if (node.paused) {
      void node.play().catch(() => {});
    } else {
      node.pause();
    }
  };

  const formatTime = (sec: number) => {
    const normalized = normalizeTime(sec);
    const total = Math.floor(normalized);
    const mm = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const ss = (total % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

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
          content: original.content ?? null,
          mediaUrl: original.mediaUrl ?? null,
          mediaType: original.mediaType ?? null,
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

      setTranscript(text || "(empty)");
      setIsTranscriptVisible(true);
    } catch (err: any) {
      console.error('[transcribe] error:', err);
      setTranscribeError(
        err?.message || t("chat.transcript"),
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
      aria-label={t("chat.message")}
    >
      <div className="message-header">
        <span className="sender">{displayNameComputed}</span>

        {isEphemeralActive && (
          <span className="message-ephemeral-badge">
            {t("chat.ephemeral")}
            {typeof remainingViews === 'number' && (
              <span className="message-ephemeral-badge__counter">
                · {t("chat.leftCount", { count: remainingViews })}
              </span>
            )}
          </span>
        )}

        <button
          type="button"
          className="message-actions-btn"
          aria-label={t("chat.messageActions")}
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
              {t("chat.reply")}
            </button>
            {isOwnMessage && (
              <button type="button" onClick={() => onEdit?.()}>
                {t("chat.edit")}
              </button>
            )}
            {isOwnMessage && (
              <button
                type="button"
                className="danger"
                onClick={() => onDelete?.()}
              >
                {t("chat.delete")}
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

      {isEphemeralActive && !revealed && (
        <button
          type="button"
          className="message-ephemeral-placeholder"
          onClick={() => handleOpenEphemeral()}
        >
          <span className="message-ephemeral-placeholder__title">
            🔒 {t("chat.ephemeralMessage")}
          </span>
          {typeof remainingViews === 'number' && (
            <span className="message-ephemeral-placeholder__counter">
              {t("chat.viewsRemaining", { count: remainingViews })}
            </span>
          )}
          <span className="message-ephemeral-placeholder__hint">
            {t("chat.clickToOpen")}
          </span>
        </button>
      )}

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

      {(!isEphemeralActive || revealed) && mediaFiles && mediaFiles.length > 0 && (
        <MediaGrid
          items={mediaFiles}
          onOpen={(url) => handleOpenEphemeral(url)}
        />
      )}

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
                onError={() => {
                  setImageFailed(true);
                }}
              />
            ) : (
              <div className="message-image-fallback">{t("chat.imageUnavailable")}</div>
            )}
          </div>
        )}

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
            <div className="message-audio-player">
              <button
                type="button"
                className="message-audio-play"
                onClick={toggleAudioPlay}
              >
                {isAudioPlaying ? '⏸' : '▶️'}
              </button>

              <AudioWaveform
                audioUrl={buildDownloadUrl(mediaUrl)}
                progress={audioProgress}
              />

              <div className="message-audio-time">
                {formatTime(safeCurrentTime)}
                {safeDuration > 0 && <> / {formatTime(safeDuration)}</>}
              </div>

              <audio
                ref={audioRef}
                className="message-audio-hidden"
                src={buildDownloadUrl(mediaUrl)}
                preload="metadata"
                onLoadedMetadata={handleAudioLoadedMetadata}
                onTimeUpdate={handleAudioTimeUpdate}
                onPlay={() => setIsAudioPlaying(true)}
                onPause={() => setIsAudioPlaying(false)}
                onEnded={handleAudioEnded}
              />
            </div>

            <button
              type="button"
              className="message-audio-transcribe-btn"
              onClick={handleTranscribeClick}
              disabled={isTranscribing}
            >
              {isTranscribing
                ? t("chat.transcribing")
                : transcript
                ? isTranscriptVisible
                  ? t("chat.hideText")
                  : t("chat.showText")
                : t("chat.transcript")}
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
                {fileName ?? decodeURIComponent(mediaUrl.split("/").pop() || t("common.file"))}
              </div>

              <div className="chat-file-bubble__meta">{t("common.file")}</div>
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

      {reactions.length > 0 && (
        <div className="message-reactions-static" aria-label={t("chat.reaction")}>
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
            aria-label={t("chat.addReaction")}
          >
            +
          </button>
        </div>
      )}

      {showReactionsPopup && (
        <div
          className="reactions-popup"
          role="dialog"
          aria-label={t("chat.reactionPicker")}
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
            <div className="reactions-loading">{t("common.loading")}</div>
          )}
        </div>
      )}

      <div className="message-status">
        {localStatus === "sending" && <span>{t("chat.sending")}</span>}
        {localStatus === 'failed' && (
          <span className="danger">{t("chat.notSent")}</span>
        )}
        {isDelivered && <span>{t("chat.delivered")}</span>}
        {isRead && <span>{t("chat.read")}</span>}
      </div>
    </div>
  );
};

export default MessageItem;