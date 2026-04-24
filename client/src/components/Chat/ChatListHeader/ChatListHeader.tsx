import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CreateChatModal from "../CreateChatModal/CreateChatModal";
import { useChatStore } from "@/stores/chatStore";
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
  const { t } = useTranslation();
  const currentConversationId = useChatStore((s) => s.currentConversationId);

  const hasActiveChat = !!currentConversationId;

  return (
    <div
      className={`chat-list-header ${
        hasActiveChat ? "chat-list-header--has-active-chat" : ""
      }`}
    >
      <div className="chat-list-header__top">
        <div className="chat-list-header__title-block">
          <h2 className="chat-list-header__title">{t("chat.chats")}</h2>
          <p className="chat-list-header__subtitle">
            {t("chat.chatSubtitle")}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="chat-list-header__create-btn"
          type="button"
        >
          <span>＋</span>
          <span>{t("chat.createChat")}</span>
        </button>
      </div>

      <div className="chat-list-header__search-wrap">
        <input
          type="text"
          placeholder={t("chat.searchChats")}
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