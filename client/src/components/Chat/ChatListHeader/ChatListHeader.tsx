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
      <div className="chat-list-header__top">
        <div className="chat-list-header__title-block">
          <h2 className="chat-list-header__title">Chats</h2>
          <p className="chat-list-header__subtitle">
            Find a conversation or start a new one
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="chat-list-header__create-btn"
          type="button"
        >
          <span>＋</span>
          <span>Create chat</span>
        </button>
      </div>

      <div className="chat-list-header__search-wrap">
        <input
          type="text"
          placeholder="Search chats and participants..."
          value={value}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="chat-list-header__search"
        />
      </div>

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