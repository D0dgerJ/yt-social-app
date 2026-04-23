import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/stores/chatStore";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useTyping } from "@/hooks/useTyping";
import { useComposerStore } from "@/stores/composerStore";
import { useMessageActions } from "@/hooks/useMessageActions";
import { EmojiGifPopup } from "./EmojiGifPopup";
import { VoiceRecorder } from "./VoiceRecorder";
import type { ExternalGifAttachment } from "./gifAttachment";
import "./MessageInput.scss";

const MAX_FILES_PER_MESSAGE = 10;

type EphemeralMode = "none" | "time" | "views";
type ComposerAttachment = File | ExternalGifAttachment;

type MessageInputProps = {
  conversationIdOverride?: number | null;
  compact?: boolean;
};

const isExternalGif = (value: ComposerAttachment): value is ExternalGifAttachment =>
  typeof value === "object" &&
  value !== null &&
  "kind" in value &&
  value.kind === "external-gif";

const MessageInput: React.FC<MessageInputProps> = ({
  conversationIdOverride,
  compact = false,
}) => {
  const { t } = useTranslation();

  const TTL_PRESETS = useMemo(
    () => [
      { label: "10 sec", seconds: 10 },
      { label: "30 sec", seconds: 30 },
      { label: "1 min", seconds: 60 },
      { label: "5 min", seconds: 5 * 60 },
      { label: "1 hour", seconds: 60 * 60 },
      { label: "1 day", seconds: 24 * 60 * 60 },
      { label: "7 days", seconds: 7 * 24 * 60 * 60 },
    ],
    []
  );

  const localizedTtlPresets = useMemo(
    () => [
      { label: t("chat.normal") === "Обычное" ? "10 сек" : "10 sec", seconds: 10 },
      { label: t("chat.normal") === "Обычное" ? "30 сек" : "30 sec", seconds: 30 },
      { label: t("chat.normal") === "Обычное" ? "1 мин" : "1 min", seconds: 60 },
      { label: t("chat.normal") === "Обычное" ? "5 мин" : "5 min", seconds: 5 * 60 },
      { label: t("chat.normal") === "Обычное" ? "1 час" : "1 hour", seconds: 60 * 60 },
      { label: t("chat.normal") === "Обычное" ? "1 день" : "1 day", seconds: 24 * 60 * 60 },
      { label: t("chat.normal") === "Обычное" ? "7 дней" : "7 days", seconds: 7 * 24 * 60 * 60 },
    ],
    [t]
  );

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

  const [text, setText] = useState("");
  const [files, setFiles] = useState<ComposerAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);

  const [ephemeralMode, setEphemeralMode] = useState<EphemeralMode>("none");
  const [ttlSeconds, setTtlSeconds] = useState<number>(TTL_PRESETS[2].seconds);
  const [viewsLimit, setViewsLimit] = useState<number>(1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const replyIdNum: number | undefined =
    replyTarget?.id != null ? Number(replyTarget.id) : undefined;

  useEffect(() => {
    if (editing) {
      setText(editing.content || "");
      textareaRef.current?.focus();
      setEphemeralMode("none");
    }
  }, [editing]);

  const resetComposer = useCallback(() => {
    setText("");
    setFiles([]);
    if (replyTarget) setReplyTarget(undefined);
    if (editing) endEdit();

    setEphemeralMode("none");
    setTtlSeconds(TTL_PRESETS[2].seconds);
    setViewsLimit(1);
  }, [replyTarget, setReplyTarget, editing, endEdit, TTL_PRESETS]);

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

    e.currentTarget.value = "";
  };

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

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
        console.error("Error while editing message:", err);
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
      if (ephemeralMode === "time") {
        ttlToSend = ttlSeconds > 0 ? ttlSeconds : undefined;
      } else if (ephemeralMode === "views") {
        maxViewsToSend = viewsLimit > 0 ? viewsLimit : undefined;
      }
    }

    try {
      const localFiles = files.filter((item): item is File => item instanceof File);
      const externalGifs = files.filter(isExternalGif);

      await send({
        conversationId: effectiveConversationId,
        text: trimmed || undefined,
        files: localFiles,
        externalAttachments: externalGifs.map((gif) => ({
          url: gif.url,
          mime: gif.mime,
          type: gif.type,
          name: gif.name,
        })),
        replyToId: replyIdNum,
        ttlSeconds: ttlToSend,
        maxViewsPerUser: maxViewsToSend,
      });

      resetComposer();
    } catch (err) {
      console.error("Error while sending message:", err);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const filesLeft = MAX_FILES_PER_MESSAGE - files.length;
  const canAddMoreFiles = !isEditMode && filesLeft > 0;

  const ephemeralDisabled = isEditMode;

  const attachTitle = isEditMode
    ? t("chat.editMessage")
    : canAddMoreFiles
      ? t("chat.attachFile")
      : t("chat.attachmentLimit", { count: MAX_FILES_PER_MESSAGE });

  const mainRow = compact ? (
    <div className="composer__main-row">
      <label
        className={`composer__attach ${
          !canAddMoreFiles ? "composer__attach--disabled" : ""
        }`}
        title={attachTitle}
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
            if (ephemeralMode === "time") {
              ttlToSend = ttlSeconds > 0 ? ttlSeconds : undefined;
            } else if (ephemeralMode === "views") {
              maxViewsToSend = viewsLimit > 0 ? viewsLimit : undefined;
            }
          }

          await send({
            conversationId: effectiveConversationId,
            files: [file],
            externalAttachments: [],
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
        onAddGif={(gif) => {
          if (!canAddMoreFiles) return;
          setFiles((prev) => {
            if (prev.length >= MAX_FILES_PER_MESSAGE) return prev;
            return [...prev, gif];
          });
        }}
        onTextInsert={(s) => setText((prev) => (prev ?? "") + s)}
      />

      <textarea
        ref={textareaRef}
        className="composer__input"
        placeholder={isEditMode ? t("chat.editMessage") : t("chat.writeMessage")}
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
        aria-label={isEditMode ? t("chat.saveAction") : t("chat.sendAction")}
        disabled={isSending && isEditMode}
      >
        {isEditMode ? "💾" : "➡️"}
      </button>
    </div>
  ) : (
    <>
      <label
        className={`composer__attach ${
          !canAddMoreFiles ? "composer__attach--disabled" : ""
        }`}
        title={attachTitle}
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
            if (ephemeralMode === "time") {
              ttlToSend = ttlSeconds > 0 ? ttlSeconds : undefined;
            } else if (ephemeralMode === "views") {
              maxViewsToSend = viewsLimit > 0 ? viewsLimit : undefined;
            }
          }

          await send({
            conversationId: effectiveConversationId,
            files: [file],
            externalAttachments: [],
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
        onAddGif={(gif) => {
          if (!canAddMoreFiles) return;
          setFiles((prev) => {
            if (prev.length >= MAX_FILES_PER_MESSAGE) return prev;
            return [...prev, gif];
          });
        }}
        onTextInsert={(s) => setText((prev) => (prev ?? "") + s)}
      />

      <textarea
        ref={textareaRef}
        className="composer__input"
        placeholder={isEditMode ? `${t("chat.editMessage")}…` : `${t("chat.writeMessage")}…`}
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
        aria-label={isEditMode ? t("chat.saveAction") : t("chat.sendAction")}
        disabled={isSending && isEditMode}
      >
        {isEditMode ? "💾" : "➡️"}
      </button>
    </>
  );

  return (
    <div className="composer">
      {(isReplyMode || isEditMode) && (
        <div className="composer__bar">
          {isReplyMode && (
            <div className="composer__reply">
              <span className="composer__bar-title">{t("chat.replyingToMessage")}</span>
              <span className="composer__bar-preview">
                {(replyTarget?.content || t("chat.mediaPlaceholder"))?.slice(0, 80)}
              </span>
              <button
                className="composer__bar-close"
                onClick={() => setReplyTarget(undefined)}
                aria-label={t("chat.cancelReply")}
              >
                ✕
              </button>
            </div>
          )}

          {isEditMode && (
            <div className="composer__edit">
              <span className="composer__bar-title">{t("chat.editing")}</span>
              <button
                className="composer__bar-close"
                onClick={endEdit}
                aria-label={t("chat.cancelEditing")}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      <div className="composer__ephemeral">
        <label className="composer__ephemeral-label">
          {t("chat.mode")}
          <select
            className="composer__ephemeral-select"
            value={ephemeralMode}
            disabled={ephemeralDisabled}
            onChange={(e) => {
              const mode = e.target.value as EphemeralMode;
              setEphemeralMode(mode);
            }}
          >
            <option value="none">{t("chat.normal")}</option>
            <option value="time">{t("chat.deleteByTime")}</option>
            <option value="views">{t("chat.deleteByViews")}</option>
          </select>
        </label>

        {ephemeralMode === "time" && (
          <label className="composer__ephemeral-extra">
            {t("chat.lifetime")}
            <select
              className="composer__ephemeral-select"
              disabled={ephemeralDisabled}
              value={ttlSeconds}
              onChange={(e) =>
                setTtlSeconds(Number(e.target.value) || TTL_PRESETS[2].seconds)
              }
            >
              {localizedTtlPresets.map((p) => (
                <option key={p.seconds} value={p.seconds}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {ephemeralMode === "views" && (
          <label className="composer__ephemeral-extra">
            {t("chat.viewsPerUser")}
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

      {mainRow}

      {!!files.length && (
        <div className="composer__previews">
          {files.map((f, i) => (
            <div
              key={`${isExternalGif(f) ? f.url : f.name}-${i}`}
              className="composer__preview"
              title={isExternalGif(f) ? f.name : f.name}
            >
              <span className="composer__preview-name">
                {isExternalGif(f) ? t("chat.gifFromGiphy") : f.name}
              </span>
              <button
                type="button"
                className="composer__preview-remove"
                onClick={() => removeFile(i)}
                aria-label={t("chat.removeFile")}
              >
                ✕
              </button>
            </div>
          ))}

          <div className="composer__hint">
            {filesLeft <= 0
              ? t("chat.attachmentLimit", { count: MAX_FILES_PER_MESSAGE })
              : t("chat.canAddMoreFiles", { count: filesLeft })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;