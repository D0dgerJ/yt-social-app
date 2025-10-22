import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useTyping } from '@/hooks/useTyping';
import { useComposerStore } from '@/stores/composerStore';
import { useMessageActions } from '@/hooks/useMessageActions';
import { EmojiGifPopup } from './EmojiGifPopup';
import './MessageInput.scss';

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

  const resetComposer = () => {
    setText('');
    setFiles([]);
    if (replyTarget) setReplyTarget(undefined);
    if (editing) endEdit();
  };

  const isEditMode = useMemo(() => Boolean(editing), [editing]);
  const isReplyMode = useMemo(() => Boolean(replyTarget), [replyTarget]);

  const onPickFiles: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const fl = e.currentTarget.files;
    if (!fl?.length) return;
    setFiles((prev) => [...prev, ...Array.from(fl)]);
    e.currentTarget.value = '';
  };

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

    if (!trimmed && files.length === 0) return;

    setIsSending(true);
    try {
      await send({
        conversationId: currentConversationId,
        text: trimmed || undefined,
        files,
        replyToId: replyIdNum, // ← число
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

      <label className="composer__attach" title="Прикрепить файл">
        📎
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={onPickFiles}
        />
      </label>

      <EmojiGifPopup
        textareaRef={textareaRef}
        replyToId={replyIdNum}
        onAddFile={(file) => setFiles(prev => [...prev, file])}
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
            <div key={`${f.name}-${i}`} className="composer__preview" title={f.name}>
              {f.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
