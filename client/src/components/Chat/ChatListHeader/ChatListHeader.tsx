import React, { useState } from "react";
import CreateChatModal from "../CreateChatModal/CreateChatModal";
import "./ChatListHeader.scss";

interface ChatListHeaderProps {
  onSearchChange?: (value: string) => void;
}

const ChatListHeader: React.FC<ChatListHeaderProps> = ({ onSearchChange }) => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearchChange?.(value);
  };

  return (
    <div className="chat-list-header">
      <button onClick={() => setShowModal(true)} className="create-chat-btn">
        ➕ Создать чат
      </button>
      <input
        type="text"
        placeholder="Поиск чатов..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="chat-search"
      />

      {showModal && (
        <CreateChatModal
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default ChatListHeader;
