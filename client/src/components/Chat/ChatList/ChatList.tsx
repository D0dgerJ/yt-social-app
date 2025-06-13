import React, { useEffect, useState } from "react";
import { getUserConversations } from "@/utils/api/chat.api";
import { useChatStore } from "@/stores/chatStore";

interface Conversation {
  id: number;
  name: string | null;
  isGroup: boolean;
  participants: { user: { id: number; username: string; profilePicture: string | null } }[];
  messages: { id: number; content: string | null; createdAt: string }[];
}

const ChatList: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  const { currentConversationId, setCurrentConversationId } = useChatStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUserConversations();
        setConversations(data);
      } catch (error) {
        console.error("Ошибка при загрузке чатов:", error);
      }
    };
    fetchData();
  }, []);

  const filtered = conversations.filter((conv) => {
    const title = conv.name || conv.participants.map((p) => p.user.username).join(", ");
    return title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="chat-list">
      <input
        type="text"
        placeholder="Поиск чатов..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="chat-search"
      />
      <ul className="chat-list-items">
        {filtered.map((chat) => {
          const lastMessage = chat.messages[0]?.content?.trim() || "Нет сообщений";
          const chatTitle = chat.name || chat.participants.map((p) => p.user.username).join(", ");
          const avatar = chat.participants[0]?.user.profilePicture || "/default-avatar.png";

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
                <div className="chat-title">{chatTitle}</div>
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
