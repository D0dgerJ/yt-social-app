import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useTyping } from '@/hooks/useTyping';
import { useComposerStore } from '@/stores/composerStore';
import { useMessageActions } from '@/hooks/useMessageActions';
import { EmojiGifPopup } from './EmojiGifPopup';
import './MessageInput.scss';

const MAX_FILES_PER_MESSAGE = 10;

const MessageInput: React.FC = () => {
  const { currentConversationId } = useChatStore();
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const replyIdNum: number | undefined =
    replyTarget?.id != null ? Number(replyTarget.id) : undefined;

  useEffect(() => {
    if (editing) {
      setText(editing.content || '');
      textareaRef.current?.focus();
    }
  }, [editing]);

  const resetComposer = useCallback(() => {
    setText('');
    setFiles([]);
    if (replyTarget) setReplyTarget(undefined);
    if (editing) endEdit();
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
    if (!currentConversationId || isSending) return;

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

    setIsSending(true);
    try {
      await send({
        conversationId: currentConversationId,
        text: trimmed || undefined,
        files,
        replyToId: replyIdNum,
      });
      resetComposer();
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
    } finally {
      setIsSending(false);
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

      <label
        className={`composer__attach ${!canAddMoreFiles ? 'composer__attach--disabled' : ''}`}
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
        placeholder={isEditMode ? 'Измените сообщение…' : 'Напишите сообщение…'}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          typingStart();
        }}
        onKeyDown={onKeyDown}
        onFocus={typingStart}
        onBlur={typingStop}
        rows={1}
        disabled={isSending}
      />

      <button
        className="composer__send"
        onClick={handleSend}
        aria-label={isEditMode ? 'Сохранить' : 'Отправить'}
        disabled={isSending}
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
