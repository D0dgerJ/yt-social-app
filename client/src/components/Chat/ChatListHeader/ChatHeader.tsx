import React from "react";
import { useChatStore } from "@/stores/chatStore";
import { useFloatingChatStore } from "@/stores/floatingChatStore";
import "./ChatHeader.scss";

const ChatHeader = () => {
  const { currentConversationId, setCurrentConversationId } = useChatStore();
  const openFloating = useFloatingChatStore((s) => s.open);

  return (
    <div className="chat-header">
      <div className="chat-title">Переписка</div>

      <div className="chat-header-buttons">
        <button
          className="chat-popout-btn"
          onClick={() => {
            if (currentConversationId) {
              openFloating(currentConversationId);
            }
          }}
          aria-label="Открыть в отдельном окне"
        >
          ↗
        </button>

        <button
          className="chat-close-btn"
          onClick={() => setCurrentConversationId(null)}
          aria-label="Закрыть чат"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;