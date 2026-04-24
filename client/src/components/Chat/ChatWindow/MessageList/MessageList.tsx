import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { Message } from "@/stores/messageStore";
import { DateSeparator } from "./DateSeparator";
import { SystemMessage } from "./SystemMessage";
import MessageItem from "@/components/Chat/MessageItem/MessageItem";
import MessageContextMenu from "@/components/Chat/MessageItem/MessageContextMenu";
import { useChatStore } from "@/stores/chatStore";
import { useMessageStore } from "@/stores/messageStore";
import {
  pinMessage as pinMessageApi,
  unpinMessage as unpinMessageApi,
} from "@/utils/api/chat.api";
import { toast } from "react-toastify";
import "./MessageList.scss";

type ListItem =
  | { type: "date"; key: string; label: string }
  | { type: "system"; key: string; text: string; time?: string }
  | { type: "message"; key: string; data: Message };

type Props = {
  meId: number;
  messages: Message[];
  isLoadingOlder: boolean;
  hasMoreOlder: boolean;
  loadOlder: () => void;
  onRetry?: (m: Message) => void;
  onReply?: (m: Message) => void;
  onReact?: (m: Message, emoji: string) => void;
  onOpenAttachment?: (url: string) => void;
  onEdit?: (m: Message) => void;
  onDelete?: (m: Message) => void;
  scrollToMessageId?: number;
};

const MessageList: React.FC<Props> = ({
  meId,
  messages,
  isLoadingOlder,
  hasMoreOlder,
  loadOlder,
  onReply,
  onReact,
  onOpenAttachment,
  onEdit,
  onDelete,
  scrollToMessageId,
}) => {
  const { t } = useTranslation();

  const formatDateLabel = useCallback(
    (iso: string) => {
      const d = new Date(iso);
      const today = new Date();

      const dY = d.getFullYear();
      const dM = d.getMonth();
      const dD = d.getDate();
      const tY = today.getFullYear();
      const tM = today.getMonth();
      const tD = today.getDate();

      if (dY === tY && dM === tM && dD === tD) {
        return t("chat.today");
      }

      const y = d.toLocaleDateString(undefined, { year: "numeric" });
      const m = d.toLocaleDateString(undefined, { month: "long" });
      const day = d.toLocaleDateString(undefined, { day: "2-digit" });
      return `${day} ${m} ${y}`;
    },
    [t]
  );

  const withDateSeparators = useCallback(
    (sourceMessages: Message[]): ListItem[] => {
      const out: ListItem[] = [];
      let prevDate = "";
      const seen = new Set<string>();

      for (const m of sourceMessages) {
        const sig = m.clientMessageId ? `c:${m.clientMessageId}` : `s:${m.id}`;
        if (seen.has(sig)) continue;
        seen.add(sig);

        const dayKey = new Date(m.createdAt).toDateString();
        if (dayKey !== prevDate) {
          prevDate = dayKey;
          out.push({
            type: "date",
            key: `date-${dayKey}`,
            label: formatDateLabel(m.createdAt),
          });
        }

        const isSystem = (m as any).kind === "system";
        if (isSystem) {
          out.push({
            type: "system",
            key: `sys-${m.id}`,
            text: m.content || "[system]",
            time: m.createdAt,
          });
        } else {
          const msgKey = m.clientMessageId ? `c-${m.clientMessageId}` : `s-${m.id}`;
          out.push({
            type: "message",
            key: msgKey,
            data: m,
          });
        }
      }

      return out;
    },
    [formatDateLabel]
  );

  const items = useMemo(() => withDateSeparators(messages), [messages, withDateSeparators]);

  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const conversations = useChatStore((s) => s.conversations);

  const participants = useMemo(() => {
    const conv = conversations.find((c) => c.id === currentConversationId);
    return (conv?.participants ?? []) as any[];
  }, [conversations, currentConversationId]);

  const resolveName = useCallback(
    (userId: number) => {
      const p = participants.find((p) => (p?.user?.id ?? p?.id) === userId);
      return (
        p?.user?.displayName ??
        p?.displayName ??
        p?.user?.username ??
        p?.username ??
        undefined
      );
    },
    [participants]
  );

  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    m: Message;
  } | null>(null);

  const openContextMenu = useCallback((e: React.MouseEvent, m: Message) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, m });
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = useRef<Record<number, boolean>>({});

  const pinnedMessages = useMemo(
    () => messages.filter((m) => m.isPinned),
    [messages]
  );

  useLayoutEffect(() => {
    const convId = currentConversationId;
    if (!convId) return;
    if (!items.length) return;
    if (didInitialScrollRef.current[convId]) return;

    const el = scrollRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
    didInitialScrollRef.current[convId] = true;
  }, [items.length, currentConversationId]);

  useEffect(() => {
    if (!scrollToMessageId) return;
    if (!currentConversationId) return;

    const target = document.querySelector(
      `[data-message-id="${scrollToMessageId}"]`
    ) as HTMLElement | null;

    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    didInitialScrollRef.current[currentConversationId] = true;
  }, [scrollToMessageId, currentConversationId, items]);

  useEffect(() => {
    const root = scrollRef.current;
    const topNode = topSentinelRef.current;

    if (!root || !topNode) return;
    if (!hasMoreOlder || isLoadingOlder) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          loadOlder();
        }
      },
      {
        root,
        threshold: 0.1,
      }
    );

    observer.observe(topNode);

    return () => observer.disconnect();
  }, [loadOlder, hasMoreOlder, isLoadingOlder, items.length]);

  const scrollToMessage = useCallback((msgId: number) => {
    const target = document.querySelector(
      `[data-message-id="${msgId}"]`
    ) as HTMLElement | null;

    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const handleTogglePinMessage = useCallback(
    async (m: Message) => {
      try {
        if (m.isPinned) {
          await unpinMessageApi(m.conversationId, m.id);
          useMessageStore.getState().updateMessage({
            id: m.id,
            conversationId: m.conversationId,
            isPinned: false,
            pinnedAt: null,
          });
        } else {
          await pinMessageApi(m.conversationId, m.id);
          useMessageStore.getState().updateMessage({
            id: m.id,
            conversationId: m.conversationId,
            isPinned: true,
            pinnedAt: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error("Error changing message pin:", err);
        const msg =
          err?.response?.data?.message || "Failed to change message pin status";
        toast.error(msg);
      } finally {
        closeMenu();
      }
    },
    [closeMenu]
  );

  const renderItem = useCallback(
    (item: ListItem) => {
      switch (item.type) {
        case "date":
          return <DateSeparator label={item.label} />;

        case "system":
          return <SystemMessage text={item.text} time={item.time} />;

        case "message": {
          const m = item.data;
          return (
            <div
              data-message-id={m.id}
              className={
                m.isPinned
                  ? "msg-item-wrapper msg-item-wrapper--pinned"
                  : "msg-item-wrapper"
              }
              onContextMenu={(e) => openContextMenu(e, m)}
            >
              <MessageItem
                conversationId={m.conversationId}
                messageId={m.id}
                clientMessageId={m.clientMessageId}
                content={m.content || ""}
                currentUserId={meId}
                senderId={m.senderId}
                senderUsername={
                  (m as any).senderUsername ??
                  resolveName(m.senderId) ??
                  String(m.senderId)
                }
                isOwnMessage={m.senderId === meId}
                mediaType={m.mediaType as any}
                mediaUrl={m.mediaUrl ?? undefined}
                fileName={m.fileName}
                stickerUrl={m.stickerUrl}
                mediaFiles={(m as any).mediaFiles ?? undefined}
                groupedReactions={(m as any).groupedReactions ?? []}
                onReply={() => onReply?.(m)}
                onEdit={() => onEdit?.(m)}
                onDelete={() => onDelete?.(m)}
                onReactToggle={(emoji) => onReact?.(m, emoji)}
                onOpenAttachment={onOpenAttachment}
                resolveName={resolveName}
                repliedToId={m.repliedToId ?? null}
                repliedTo={(m as any).repliedTo ?? null}
                isEphemeral={m.isEphemeral}
                maxViewsPerUser={m.maxViewsPerUser}
                remainingViewsForMe={m.remainingViewsForMe}
              />
            </div>
          );
        }
      }
    },
    [openContextMenu, meId, onReply, onEdit, onDelete, onReact, onOpenAttachment, resolveName]
  );

  return (
    <div className="msg-virtuoso-wrap">
      {pinnedMessages.length > 0 && (
        <div className="msg-pinned-bar">
          {pinnedMessages.map((m) => {
            const label =
              (m.content && m.content.slice(0, 40)) ||
              (m.mediaType === "image" && `📷 ${t("chat.image")}`) ||
              (m.mediaType === "video" && `🎬 ${t("chat.video")}`) ||
              (m.mediaType === "audio" && `🎧 ${t("chat.audio")}`) ||
              (m.mediaType === "gif" && "GIF") ||
              (m.mediaType === "sticker" && t("chat.sticker")) ||
              (m.mediaType === "file" && (m.fileName || `📎 ${t("common.file")}`)) ||
              t("chat.messageNumber", { id: m.id });

            return (
              <button
                key={m.id}
                className="msg-pinned-chip"
                onClick={() => scrollToMessage(m.id)}
              >
                📌 {label}
              </button>
            );
          })}
        </div>
      )}

      <div ref={scrollRef} className="msg-fallback-scroll">
        <div ref={topSentinelRef} className="msg-top-sentinel" />

        <div className="msg-loader-top">
          {isLoadingOlder
            ? t("chat.loadingMessages")
            : hasMoreOlder
              ? t("chat.scrollForHistory")
              : t("chat.noMoreHistory")}
        </div>

        {items.map((item) => (
          <React.Fragment key={item.key}>{renderItem(item)}</React.Fragment>
        ))}
      </div>

      {menu && (
        <MessageContextMenu
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
          items={[
            {
              key: "reply",
              label: t("chat.reply"),
              onClick: () => onReply?.(menu.m),
            },
            {
              key: "edit",
              label: t("chat.edit"),
              onClick: () => onEdit?.(menu.m),
            },
            {
              key: "del",
              label: t("chat.delete"),
              onClick: () => onDelete?.(menu.m),
              danger: true,
            },
            {
              key: "r1",
              label: `❤️ ${t("chat.reaction")}`,
              onClick: () => onReact?.(menu.m, "❤️"),
            },
            {
              key: "r2",
              label: `👍 ${t("chat.reaction")}`,
              onClick: () => onReact?.(menu.m, "👍"),
            },
            {
              key: "r3",
              label: `😂 ${t("chat.reaction")}`,
              onClick: () => onReact?.(menu.m, "😂"),
            },
            {
              key: menu.m.isPinned ? "unpin" : "pin",
              label: menu.m.isPinned ? t("chat.unpin") : t("chat.pin"),
              onClick: () => handleTogglePinMessage(menu.m),
            },
          ]}
        />
      )}
    </div>
  );
};

export default MessageList;