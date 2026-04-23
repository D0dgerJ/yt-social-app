import React from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/stores/chatStore";
import { useFloatingChatStore } from "@/stores/floatingChatStore";
import "./ChatHeader.scss";

const ChatHeader = () => {
  const { currentConversationId, setCurrentConversationId } = useChatStore();
  const openFloating = useFloatingChatStore((s) => s.open);
  const { t } = useTranslation();

  return (
    <div className="chat-header">
      <div className="chat-header__left">
        <div className="chat-header__eyebrow">{t("chat.activeChat")}</div>
        <div className="chat-header__title">{t("chat.conversation")}</div>
      </div>

      <div className="chat-header__buttons">
        <button
          className="chat-header__icon-btn"
          onClick={() => {
            if (currentConversationId) {
              openFloating(currentConversationId);
            }
          }}
          aria-label={t("chat.openSeparateWindow")}
          type="button"
        >
          ↗
        </button>

        <button
          className="chat-header__icon-btn chat-header__icon-btn--danger"
          onClick={() => setCurrentConversationId(null)}
          aria-label={t("chat.closeChat")}
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;