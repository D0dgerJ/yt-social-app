import React from "react";
import { useChatStore } from "@/stores/chatStore";
import "./ChatHeader.scss";

const ChatHeader = () => {
  const { setCurrentConversationId } = useChatStore();

  return (
    <div className="chat-header">
      <div className="chat-title">Переписка</div>

      <button
        className="chat-close-btn"
        onClick={() => setCurrentConversationId(null)}
        aria-label="Закрыть чат"
      >
        ×
      </button>
    </div>
  );
};

export default ChatHeader;
