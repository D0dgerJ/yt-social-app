import React from "react";
import "./ChatListHeader.scss";

interface ChatListHeaderProps {
  search: string;
  setSearch: (value: string) => void;
  setShowModal: (value: boolean) => void;
}

const ChatListHeader: React.FC<ChatListHeaderProps> = ({ search, setSearch, setShowModal }) => {
  return (
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
  );
};

export default ChatListHeader;
