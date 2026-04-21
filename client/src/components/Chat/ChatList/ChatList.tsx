import React, { useEffect, useMemo, useCallback } from "react";
import {
  getUserConversations,
  pinConversation,
  unpinConversation,
} from "@/utils/api/chat.api";
import { useChatStore } from "@/stores/chatStore";
import noProfilePic from "../../../assets/profile/user.png";
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
    content?: string | null;
    mediaType?:
      | "image"
      | "video"
      | "file"
      | "gif"
      | "audio"
      | "text"
      | "sticker"
      | null;
    fileName?: string | null;
    createdAt?: string;
    senderId?: number;
  } | null;
  messages?: any[];
  updatedAt?: string;

  isPinned?: boolean;
  pinnedAt?: string | null;
};

const norm = (s: string) => (s ?? "").toLowerCase().trim();

const mediaPreview = (m?: ConversationLike["lastMessage"]) => {
  if (!m) return "";
  const type = (m.mediaType || "").toLowerCase();
  switch (type) {
    case "image":
      return "📷 Image";
    case "video":
      return "🎬 Video";
    case "audio":
      return "🎧 Audio";
    case "gif":
      return "GIF";
    case "sticker":
      return "Sticker";
    case "file":
      return m.fileName ? `📎 ${m.fileName}` : "📎 File";
    case "text":
    default:
      return "";
  }
};

const getAvatarFromConv = (conv?: ConversationLike): string => {
  const first = Array.isArray(conv?.participants)
    ? conv.participants[0]
    : undefined;

  return first?.user?.profilePicture || first?.profilePicture || noProfilePic;
};

const getParticipantNames = (conv: ConversationLike) => {
  const parts: ParticipantLike[] = Array.isArray(conv?.participants)
    ? conv.participants
    : [];

  return parts
    .map((p) => p?.user?.username ?? p?.username ?? "")
    .filter(Boolean)
    .join(" ");
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

    const parts: ParticipantLike[] = Array.isArray(conv?.participants)
      ? conv.participants
      : [];

    const names = parts
      .map((p) => p?.user?.username ?? p?.username)
      .filter(Boolean) as string[];

    return names.length ? names.join(", ") : "Untitled";
  }, []);

  const filteredChats = useMemo(() => {
    const q = norm(search);
    if (!q) return conversations as ConversationLike[];

    return (conversations as ConversationLike[]).filter((conv) => {
      const title = getTitle(conv);
      const people = getParticipantNames(conv);
      return norm(`${title} ${people}`).includes(q);
    });
  }, [conversations, search, getTitle]);

  const handleSelect = useCallback(
    (id: number) => {
      if (currentConversationId === id) return;
      setCurrentConversationId(id);
    },
    [currentConversationId, setCurrentConversationId]
  );

  const handleTogglePin = useCallback(
    async (chat: ConversationLike, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        if (chat.isPinned) {
          await unpinConversation(chat.id);
        } else {
          await pinConversation(chat.id);
        }
        const data = await getUserConversations();
        setChatsInStore(data as any);
      } catch (err) {
        console.error("Error changing chat pin:", err);
      }
    },
    [setChatsInStore]
  );

  return (
    <div className="chat-list">
      <ul className="chat-list-items">
        {filteredChats.map((chat) => {
          const chatTitle = getTitle(chat);
          const avatar = getAvatarFromConv(chat);

          const lastMsg =
            chat?.lastMessage ??
            (Array.isArray(chat?.messages) && chat.messages.length > 0
              ? chat.messages[0]
              : null);

          const mediaShort = mediaPreview(lastMsg as any);
          const textPreview =
            !mediaShort && typeof lastMsg?.content === "string"
              ? lastMsg.content
              : "";

          const lastMessage =
            (mediaShort || textPreview || "").trim() || "No messages";

          const time = lastMsg?.createdAt
            ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <li
              key={chat.id}
              className={`chat-item ${
                chat.isPinned ? "chat-item--pinned" : ""
              } ${currentConversationId === chat.id ? "selected" : ""}`}
              onClick={() => handleSelect(chat.id)}
            >
              <div className="chat-avatar">
                <img
                  src={avatar}
                  alt="avatar"
                  className="chat-avatar-img"
                  onError={(e) => {
                    e.currentTarget.src = noProfilePic;
                  }}
                />
              </div>

              <div className="chat-info">
                <div className="chat-title-row">
                  <span className="chat-title">{chatTitle}</span>

                  <button
                    className={`chat-pin-btn ${
                      chat.isPinned ? "chat-pin-btn--active" : ""
                    }`}
                    title={
                      chat.isPinned ? "Unpin chat" : "Pin chat to top"
                    }
                    onClick={(e) => handleTogglePin(chat, e)}
                    type="button"
                  >
                    {chat.isPinned ? "📌" : "📍"}
                  </button>

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