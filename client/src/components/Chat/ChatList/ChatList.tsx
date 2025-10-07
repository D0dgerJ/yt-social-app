import React, { useEffect, useMemo, useCallback } from "react";
import { getUserConversations } from "@/utils/api/chat.api";
import { useChatStore } from "@/stores/chatStore";
import { decryptText } from "@/utils/crypto";
import "./ChatList.scss";

interface ChatListProps {
  search?: string;
}

type ParticipantLike = {
  user?: { id: number; username?: string; profilePicture?: string | null } | null;
  id?: number;
  username?: string;
  profilePicture?: string | null;
};

type ConversationLike = {
  id: number;
  name?: string | null;
  isGroup?: boolean;
  participants?: ParticipantLike[];
  lastMessage?: {
    id: number;
    encryptedContent?: string | null;
    mediaType?: "image" | "video" | "file" | "gif" | "audio" | "text" | "sticker" | null;
    fileName?: string | null;
    createdAt?: string;
    senderId?: number;
  } | null;
  messages?: any[];
  updatedAt?: string;
};

const mediaPreview = (m?: ConversationLike["lastMessage"]) => {
  if (!m) return "";
  const type = (m.mediaType || "").toLowerCase();
  switch (type) {
    case "image":
      return "📷 Изображение";
    case "video":
      return "🎬 Видео";
    case "audio":
      return "🎧 Аудио";
    case "gif":
      return "GIF";
    case "sticker":
      return "Стикер";
    case "file":
      return m.fileName ? `📎 ${m.fileName}` : "📎 Файл";
    case "text":
    default:
      return "";
  }
};

const getAvatarFromConv = (conv?: ConversationLike): string => {
  const first = Array.isArray(conv?.participants) ? conv!.participants![0] : undefined;
  const avatar =
    first?.user?.profilePicture ??
    first?.profilePicture ??
    "/default-avatar.png";
  return avatar || "/default-avatar.png";
};

const ChatList: React.FC<ChatListProps> = ({ search = "" }) => {
  const {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    setConversations: setChatsInStore,
  } = useChatStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getUserConversations();
        if (!cancelled) setChatsInStore(data as any);
      } catch (err) {
        console.error("Ошибка при загрузке чатов:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setChatsInStore]);

  const getTitle = useCallback((conv: ConversationLike) => {
    if (conv?.name) return conv.name;
    const parts: ParticipantLike[] = Array.isArray(conv?.participants) ? conv.participants! : [];
    const names = parts
      .map((p) => p?.user?.username ?? p?.username)
      .filter(Boolean) as string[];
    return names.length ? names.join(", ") : "Без названия";
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations as ConversationLike[];
    return (conversations as ConversationLike[]).filter((conv) =>
      getTitle(conv).toLowerCase().includes(q)
    );
  }, [conversations, search, getTitle]);

  const handleSelect = useCallback(
    (id: number) => {
      if (currentConversationId === id) return;
      setCurrentConversationId(id);
    },
    [currentConversationId, setCurrentConversationId]
  );

  return (
    <div className="chat-list">
      <ul className="chat-list-items">
        {filtered.map((chat) => {
          const chatTitle = getTitle(chat);
          const avatar = getAvatarFromConv(chat);

          const lastMsg =
            chat?.lastMessage ??
            (Array.isArray(chat?.messages) && chat.messages.length > 0 ? chat.messages[0] : null);

          const mediaShort = mediaPreview(lastMsg as any);

          const decrypted =
            !mediaShort && lastMsg?.encryptedContent
              ? decryptText(lastMsg.encryptedContent)
              : "";

          const lastMessage = (mediaShort || decrypted || "").trim() || "Нет сообщений";

          const time = lastMsg?.createdAt
            ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <li
              key={chat.id}
              className={`chat-item ${currentConversationId === chat.id ? "selected" : ""}`}
              onClick={() => handleSelect(chat.id)}
            >
              <div className="chat-avatar">
                <img
                  src={avatar}
                  alt="avatar"
                  className="chat-avatar-img"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
              </div>

              <div className="chat-info">
                <div className="chat-title-row">
                  <span className="chat-title">{chatTitle}</span>
                  <span className="chat-time">{time}</span>
                </div>
                <div className="chat-preview">{lastMessage}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ChatList;
