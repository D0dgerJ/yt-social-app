import React, { useEffect, useState } from "react";
import { getUserConversations } from "@/utils/api/chat.api";
import { useChatStore } from "@/stores/chatStore";
import "./ChatList.scss";

interface ChatListProps {
  search?: string;
}

const ChatList: React.FC<ChatListProps> = ({ search = "" }) => {
  const [conversations, setConversations] = useState<any[]>([]);
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
    const title = conv.name || conv.participants.map((p: any) => p.user.username).join(", ");
    return title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="chat-list">
      <ul className="chat-list-items">
        {filtered.map((chat) => {
          const chatTitle = chat.name || chat.participants.map((p: any) => p.user.username).join(", ");
          const avatar =
            chat.participants[0]?.user.profilePicture || "/default-avatar.png";
          const lastMsg = chat.messages?.[0];
          const lastMessage = lastMsg?.content?.trim() || "Нет сообщений";
          const time = lastMsg?.createdAt
            ? new Date(lastMsg.createdAt).toLocaleTimeString()
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
    </div>
  );
};

export default ChatList;
