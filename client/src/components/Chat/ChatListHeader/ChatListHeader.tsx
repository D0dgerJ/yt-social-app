import React, { useState } from "react";
import CreateChatModal from "../CreateChatModal/CreateChatModal";
import "./ChatListHeader.scss";

interface ChatListHeaderProps {
  value?: string;
  onSearchChange?: (value: string) => void;
}

const ChatListHeader: React.FC<ChatListHeaderProps> = ({
  value = "",
  onSearchChange,
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="chat-list-header">
      <button
        onClick={() => setShowModal(true)}
        className="create-chat-btn"
        type="button"
      >
        ➕ Создать чат
      </button>

      <input
        type="text"
        placeholder="Поиск чатов и участников..."
        value={value}
        onChange={(e) => onSearchChange?.(e.target.value)}
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