import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
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

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();

  const dY = d.getFullYear(),
    dM = d.getMonth(),
    dD = d.getDate();
  const tY = today.getFullYear(),
    tM = today.getMonth(),
    tD = today.getDate();

  if (dY === tY && dM === tM && dD === tD) {
    return "Сегодня";
  }

  const y = d.toLocaleDateString(undefined, { year: "numeric" });
  const m = d.toLocaleDateString(undefined, { month: "long" });
  const day = d.toLocaleDateString(undefined, { day: "2-digit" });
  return `${day} ${m} ${y}`;
}

function withDateSeparators(messages: Message[]): ListItem[] {
  const out: ListItem[] = [];
  let prevDate = "";

  const seen = new Set<string>();

  for (const m of messages) {
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
      const msgKey = m.clientMessageId
        ? `c-${m.clientMessageId}`
        : `s-${m.id}`;
      out.push({
        type: "message",
        key: msgKey,
        data: m,
      });
    }
  }

  return out;
}

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
  const items = useMemo(() => withDateSeparators(messages), [messages]);

  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const conversations = useChatStore((s) => s.conversations);

  const participants = useMemo(() => {
    const conv = conversations.find((c) => c.id === currentConversationId);
    return (conv?.participants ?? []) as any[];
  }, [conversations, currentConversationId]);

  const resolveName = useCallback(
    (userId: number) => {
      const p = participants.find(
        (p) => (p?.user?.id ?? p?.id) === userId
      );
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

  const openContextMenu = useCallback(
    (e: React.MouseEvent, m: Message) => {
      e.preventDefault();
      setMenu({ x: e.clientX, y: e.clientY, m });
    },
    []
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const handleStartReached = useCallback(() => {
    if (!isLoadingOlder && hasMoreOlder) {
      loadOlder();
    }
  }, [isLoadingOlder, hasMoreOlder, loadOlder]);

  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const didInitialScrollRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    const convId = currentConversationId;
    if (!convId) return;
    if (!items.length) return;

    if (didInitialScrollRef.current[convId]) return;

    const lastIndex = items.length - 1;

    virtuosoRef.current?.scrollToIndex({
      index: lastIndex,
      align: "end",
      behavior: "auto",
    });
  }, [items, currentConversationId]);

  const pinnedMessages = useMemo(
    () => messages.filter((m) => m.isPinned),
    [messages]
  );

  const scrollToMessage = useCallback(
    (msgId: number) => {
      const index = items.findIndex(
        (it) => it.type === "message" && (it as any).data.id === msgId
      );
      if (index >= 0) {
        virtuosoRef.current?.scrollToIndex({
          index,
          align: "center",
          behavior: "smooth",
        });
      }
    },
    [items]
  );

  useEffect(() => {
    if (!scrollToMessageId) return;
    if (!currentConversationId) return;
    if (!items.length) return;

    const index = items.findIndex(
      (it) => it.type === "message" && (it as any).data.id === scrollToMessageId
    );
    if (index < 0) return;

    virtuosoRef.current?.scrollToIndex({
      index,
      align: "center",
      behavior: "smooth",
    });

    didInitialScrollRef.current[currentConversationId] = true;
  }, [scrollToMessageId, items, currentConversationId]);

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
        console.error("Ошибка при смене пина сообщения:", err);
        const msg =
          err?.response?.data?.message ||
          "Не удалось изменить закреп сообщения";
        toast.error(msg);
      } finally {
        closeMenu();
      }
    },
    [closeMenu]
  );

  const renderItem = useCallback(
    (_index: number, item: ListItem) => {
      switch (item.type) {
        case "date":
          return <DateSeparator label={item.label} />;

        case "system":
          return (
            <SystemMessage
              text={item.text}
              time={item.time}
            />
          );

        case "message": {
          const m = item.data;
          return (
            <div
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
    [
      openContextMenu,
      meId,
      onReply,
      onEdit,
      onDelete,
      onReact,
      onOpenAttachment,
      resolveName,
    ]
  );

  const components = useMemo(() => {
    const Header: React.FC = () => (
      <div className="msg-loader-top">
        {isLoadingOlder
          ? "Загружаем сообщения…"
          : hasMoreOlder
          ? "Прокрутите вверх для истории"
          : "История закончилась"}
      </div>
    );
    return { Header };
  }, [isLoadingOlder, hasMoreOlder]);

  return (
    <div className="msg-virtuoso-wrap">
      {/* 🔹 панель закреплённых сообщений */}
      {pinnedMessages.length > 0 && (
        <div className="msg-pinned-bar">
          {pinnedMessages.map((m) => {
            const label =
              (m.content && m.content.slice(0, 40)) ||
              (m.mediaType === "image" && "📷 Изображение") ||
              (m.mediaType === "video" && "🎬 Видео") ||
              (m.mediaType === "audio" && "🎧 Аудио") ||
              (m.mediaType === "gif" && "GIF") ||
              (m.mediaType === "sticker" && "Стикер") ||
              (m.mediaType === "file" && (m.fileName || "📎 Файл")) ||
              `Сообщение #${m.id}`;

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

      <Virtuoso<ListItem>
        ref={virtuosoRef}
        data={items}
        className="msg-virtuoso"
        atTopThreshold={80}
        startReached={handleStartReached}
        itemContent={renderItem}
        components={components}
        computeItemKey={(_index, item) => item.key}
      />

      {menu && (
        <MessageContextMenu
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
          items={[
            {
              key: "reply",
              label: "Ответить",
              onClick: () => onReply?.(menu.m),
            },
            {
              key: "edit",
              label: "Редактировать",
              onClick: () => onEdit?.(menu.m),
            },
            {
              key: "del",
              label: "Удалить",
              onClick: () => onDelete?.(menu.m),
              danger: true,
            },
            {
              key: "r1",
              label: "❤️ Реакция",
              onClick: () => onReact?.(menu.m, "❤️"),
            },
            {
              key: "r2",
              label: "👍 Реакция",
              onClick: () => onReact?.(menu.m, "👍"),
            },
            {
              key: "r3",
              label: "😂 Реакция",
              onClick: () => onReact?.(menu.m, "😂"),
            },
            {
              key: menu.m.isPinned ? "unpin" : "pin",
              label: menu.m.isPinned ? "Открепить" : "Закрепить",
              onClick: () => handleTogglePinMessage(menu.m),
            },
          ]}
        />
      )}
    </div>
  );
};

export default MessageList;