import React, { useEffect, useState } from "react";
import { getUserConversations } from "@/utils/api/chat.api";
import { useChatStore } from "@/stores/chatStore";
import CreateChatModal from "../CreateChatModal/CreateChatModal";
import { formatDistanceToNowStrict } from "date-fns";
import "./ChatList.scss";

interface Conversation {
  id: number;
  name: string | null;
  isGroup: boolean;
  participants: {
    user: { id: number; username: string; profilePicture: string | null };
  }[];
  messages: { id: number; content: string | null; createdAt: string }[];
}

const ChatList: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { currentConversationId, setCurrentConversationId } = useChatStore();

  const fetchConversations = async () => {
    try {
      const data = await getUserConversations();
      setConversations(data);
    } catch (error) {
      console.error("Ошибка при загрузке чатов:", error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const filtered = conversations.filter((conv) => {
    const title = conv.name || conv.participants.map((p) => p.user.username).join(", ");
    return title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <button onClick={() => setShowModal(true)} className="create-chat-btn">
          ➕ Создать чат
        </button>
        <input
          type="text"
          placeholder="Поиск чатов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="chat-search"
        />
      </div>

      <ul className="chat-list-items">
        {filtered.map((chat) => {
          const chatTitle = chat.name || chat.participants.map((p) => p.user.username).join(", ");
          const avatar =
            Array.isArray(chat.participants) &&
            chat.participants.length > 0 &&
            chat.participants[0].user.profilePicture
              ? chat.participants[0].user.profilePicture
              : "/default-avatar.png";

          const lastMsg = chat.messages?.[0];
          const lastMessage = lastMsg?.content?.trim() || "Нет сообщений";
          const time = lastMsg?.createdAt
            ? formatDistanceToNowStrict(new Date(lastMsg.createdAt), { addSuffix: true })
            : "";

          return (
            <li
              key={chat.id}
              className={`chat-item ${currentConversationId === chat.id ? "selected" : ""}`}
              onClick={() => setCurrentConversationId(chat.id)}
            >
              <div className="chat-avatar">
                <img src={avatar} alt="avatar" className="chat-avatar-img" />
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

      {showModal && (
        <CreateChatModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            fetchConversations();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatList;
