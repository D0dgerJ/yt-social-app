import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useTyping } from '@/hooks/useTyping';
import { useComposerStore } from '@/stores/composerStore';
import { useMessageActions } from '@/hooks/useMessageActions';
import { EmojiGifPopup } from './EmojiGifPopup';
import { VoiceRecorder } from './VoiceRecorder';
import './MessageInput.scss';

const MAX_FILES_PER_MESSAGE = 10;

const TTL_PRESETS = [
  { label: '10 сек', seconds: 10 },
  { label: '30 сек', seconds: 30 },
  { label: '1 мин', seconds: 60 },
  { label: '5 мин', seconds: 5 * 60 },
  { label: '1 час', seconds: 60 * 60 },
  { label: '1 день', seconds: 24 * 60 * 60 },
  { label: '7 дней', seconds: 7 * 24 * 60 * 60 },
] as const;

type EphemeralMode = 'none' | 'time' | 'views';

type MessageInputProps = {
  conversationIdOverride?: number | null;
};

const MessageInput: React.FC<MessageInputProps> = ({
  conversationIdOverride,
}) => {
  const { currentConversationId } = useChatStore();
  const effectiveConversationId =
    conversationIdOverride ?? currentConversationId;

  const { send } = useSendMessage();
  const { start: typingStart, stop: typingStop } = useTyping();

  const replyTarget = useComposerStore((s) => s.replyTarget);
  const setReplyTarget = useComposerStore((s) => s.setReplyTarget);
  const editing = useComposerStore((s) => s.editing);
  const endEdit = useComposerStore((s) => s.endEdit);

  const { editMessage } = useMessageActions();

  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  const [ephemeralMode, setEphemeralMode] = useState<EphemeralMode>('none');
  const [ttlSeconds, setTtlSeconds] = useState<number>(TTL_PRESETS[2].seconds); // по умолчанию 1 минута
  const [viewsLimit, setViewsLimit] = useState<number>(1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const replyIdNum: number | undefined =
    replyTarget?.id != null ? Number(replyTarget.id) : undefined;

  useEffect(() => {
    if (editing) {
      setText(editing.content || '');
      textareaRef.current?.focus();
      setEphemeralMode('none');
    }
  }, [editing]);

  const resetComposer = useCallback(() => {
    setText('');
    setFiles([]);
    if (replyTarget) setReplyTarget(undefined);
    if (editing) endEdit();

    setEphemeralMode('none');
    setTtlSeconds(TTL_PRESETS[2].seconds);
    setViewsLimit(1);
  }, [replyTarget, setReplyTarget, editing, endEdit]);

  const isEditMode = useMemo(() => Boolean(editing), [editing]);
  const isReplyMode = useMemo(() => Boolean(replyTarget), [replyTarget]);

  const onPickFiles: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const fl = e.currentTarget.files;
    if (!fl?.length || isEditMode) return;

    setFiles((prev) => {
      const incoming = Array.from(fl);
      const roomLeft = MAX_FILES_PER_MESSAGE - prev.length;
      const allowed = roomLeft > 0 ? incoming.slice(0, roomLeft) : [];
      return [...prev, ...allowed];
    });

    e.currentTarget.value = '';
  };

  const removeFile = useCallback(
    (idx: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== idx));
    },
    [setFiles],
  );

  const handleSend = async () => {
    if (!effectiveConversationId) return;

    const trimmed = text.trim();

    if (isEditMode && editing) {
      if (!trimmed) return;
      setIsSending(true);
      try {
        await editMessage(editing, trimmed);
        resetComposer();
      } catch (err) {
        console.error('Ошибка при редактировании:', err);
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (!trimmed && files.length === 0) {
      return;
    }

    let ttlToSend: number | undefined;
    let maxViewsToSend: number | undefined;

    if (!isEditMode) {
      if (ephemeralMode === 'time') {
        ttlToSend = ttlSeconds > 0 ? ttlSeconds : undefined;
      } else if (ephemeralMode === 'views') {
        maxViewsToSend = viewsLimit > 0 ? viewsLimit : undefined;
      }
    }

    try {
      await send({
        conversationId: effectiveConversationId,
        text: trimmed || undefined,
        files,
        replyToId: replyIdNum,
        ttlSeconds: ttlToSend,
        maxViewsPerUser: maxViewsToSend,
      });
      resetComposer();
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const filesLeft = MAX_FILES_PER_MESSAGE - files.length;
  const canAddMoreFiles = !isEditMode && filesLeft > 0;

  const ephemeralDisabled = isEditMode;

  return (
    <div className="composer">
      {(isReplyMode || isEditMode) && (
        <div className="composer__bar">
          {isReplyMode && (
            <div className="composer__reply">
              <span className="composer__bar-title">Ответ на сообщение</span>
              <span className="composer__bar-preview">
                {(replyTarget?.content || '[медиа]')?.slice(0, 80)}
              </span>
              <button
                className="composer__bar-close"
                onClick={() => setReplyTarget(undefined)}
                aria-label="Снять ответ"
              >
                ✕
              </button>
            </div>
          )}

          {isEditMode && (
            <div className="composer__edit">
              <span className="composer__bar-title">Редактирование</span>
              <button
                className="composer__bar-close"
                onClick={endEdit}
                aria-label="Отменить редактирование"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      <div className="composer__ephemeral">
        <label className="composer__ephemeral-label">
          Режим:
          <select
            className="composer__ephemeral-select"
            value={ephemeralMode}
            disabled={ephemeralDisabled}
            onChange={(e) => {
              const mode = e.target.value as EphemeralMode;
              setEphemeralMode(mode);
            }}
          >
            <option value="none">Обычное</option>
            <option value="time">Удалить по времени</option>
            <option value="views">Удалить по просмотрам</option>
          </select>
        </label>

        {ephemeralMode === 'time' && (
          <label className="composer__ephemeral-extra">
            Срок жизни:
            <select
              className="composer__ephemeral-select"
              disabled={ephemeralDisabled}
              value={ttlSeconds}
              onChange={(e) =>
                setTtlSeconds(Number(e.target.value) || TTL_PRESETS[2].seconds)
              }
            >
              {TTL_PRESETS.map((p) => (
                <option key={p.seconds} value={p.seconds}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {ephemeralMode === 'views' && (
          <label className="composer__ephemeral-extra">
            Просмотров на пользователя:
            <input
              type="number"
              min={1}
              max={100}
              className="composer__ephemeral-input"
              disabled={ephemeralDisabled}
              value={viewsLimit}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (Number.isNaN(val)) return;
                const clamped = Math.max(1, Math.min(100, val));
                setViewsLimit(clamped);
              }}
            />
          </label>
        )}
      </div>

      <label
        className={`composer__attach ${
          !canAddMoreFiles ? 'composer__attach--disabled' : ''
        }`}
        title={
          isEditMode
            ? 'Нельзя менять вложения при редактировании'
            : canAddMoreFiles
            ? 'Прикрепить файл'
            : 'Лимит 10 вложений'
        }
      >
        📎
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          disabled={!canAddMoreFiles}
          onChange={onPickFiles}
        />
      </label>

      <VoiceRecorder
        disabled={isSending || isEditMode}
        canAddMoreFiles={canAddMoreFiles}
        onSend={async (file) => {
          if (!effectiveConversationId) return;

          let ttlToSend: number | undefined;
          let maxViewsToSend: number | undefined;

          if (!isEditMode) {
            if (ephemeralMode === 'time') {
              ttlToSend = ttlSeconds > 0 ? ttlSeconds : undefined;
            } else if (ephemeralMode === 'views') {
              maxViewsToSend = viewsLimit > 0 ? viewsLimit : undefined;
            }
          }

          await send({
            conversationId: effectiveConversationId,
            files: [file],
            replyToId: replyIdNum,
            ttlSeconds: ttlToSend,
            maxViewsPerUser: maxViewsToSend,
          });
          if (replyTarget) setReplyTarget(undefined);
        }}
      />

      <EmojiGifPopup
        textareaRef={textareaRef}
        replyToId={replyIdNum}
        onAddFile={(file) => {
          if (!canAddMoreFiles) return;
          setFiles((prev) => {
            if (prev.length >= MAX_FILES_PER_MESSAGE) return prev;
            return [...prev, file];
          });
        }}
        onTextInsert={(s) => setText((prev) => (prev ?? '') + s)}
      />

      <textarea
        ref={textareaRef}
        className="composer__input"
        placeholder={
          isEditMode ? 'Измените сообщение…' : 'Напишите сообщение…'
        }
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          typingStart();
        }}
        onKeyDown={onKeyDown}
        onFocus={typingStart}
        onBlur={typingStop}
        rows={1}
        disabled={isSending && isEditMode}
      />

      <button
        className="composer__send"
        onClick={handleSend}
        aria-label={isEditMode ? 'Сохранить' : 'Отправить'}
        disabled={isSending && isEditMode}
      >
        {isEditMode ? '💾' : '➡️'}
      </button>

      {!!files.length && (
        <div className="composer__previews">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="composer__preview"
              title={f.name}
            >
              <span className="composer__preview-name">{f.name}</span>
              <button
                type="button"
                className="composer__preview-remove"
                onClick={() => removeFile(i)}
                aria-label="Убрать файл"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="composer__hint">
            {filesLeft <= 0
              ? 'Лимит вложений: 10'
              : `Можно добавить ещё ${filesLeft} файл(ов)`}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;