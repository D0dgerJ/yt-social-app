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
        <div className="chat-header__eyebrow">Active chat</div>
        <div className="chat-header__title">Conversation</div>
      </div>

      <div className="chat-header__buttons">
        <button
          className="chat-header__icon-btn"
          onClick={() => {
            if (currentConversationId) {
              openFloating(currentConversationId);
            }
          }}
          aria-label="Open in separate window"
          type="button"
        >
          ↗
        </button>

        <button
          className="chat-header__icon-btn chat-header__icon-btn--danger"
          onClick={() => setCurrentConversationId(null)}
          aria-label="Close chat"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;