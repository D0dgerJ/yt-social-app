import React from "react";
import { useChatStore } from "@/stores/chatStore";
import { useFloatingChatStore } from "@/stores/floatingChatStore";
import "./ChatHeader.scss";

const ChatHeader = () => {
  const { currentConversationId, setCurrentConversationId } = useChatStore();
  const openFloating = useFloatingChatStore((s) => s.open);

  return (
    <div className="chat-header">
      <div className="chat-header__left">
        <div className="chat-header__eyebrow">Активный чат</div>
        <div className="chat-header__title">Переписка</div>
      </div>

      <div className="chat-header__buttons">
        <button
          className="chat-header__icon-btn"
          onClick={() => {
            if (currentConversationId) {
              openFloating(currentConversationId);
            }
          }}
          aria-label="Открыть в отдельном окне"
          type="button"
        >
          ↗
        </button>

        <button
          className="chat-header__icon-btn chat-header__icon-btn--danger"
          onClick={() => setCurrentConversationId(null)}
          aria-label="Закрыть чат"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;