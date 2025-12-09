import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useFloatingChatStore } from "@/stores/floatingChatStore";
import { useChatStore } from "@/stores/chatStore";

import ChatWindow from "@/components/Chat/ChatWindow/ChatWindow";
import MessageInput from "@/components/Chat/MessageInput/MessageInput";

import "./FloatingChatWindow.scss";

const FloatingChatWindow: React.FC = () => {
  const {
    isOpen,
    conversationId,
    x,
    y,
    minimized,
    close,
    toggleMinimized,
    setPosition,
  } = useFloatingChatStore();

  const getConversation = useChatStore((s) => s.getConversation);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!isOpen || !conversationId) {
    return null;
  }

  const conv = getConversation(conversationId as number) as any;
  const title =
    conv?.name ||
    conv?.displayName ||
    (Array.isArray(conv?.participants) &&
      conv.participants
        .map(
          (p: any) =>
            p?.user?.displayName ||
            p?.user?.username ||
            p?.displayName ||
            p?.username
        )
        .filter(Boolean)
        .join(", ")) ||
    `Чат #${conversationId}`;

  const handleHeaderMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - x,
      y: e.clientY - y,
    };
  };

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragOffset.current.x;
    const nextY = e.clientY - dragOffset.current.y;
    setPosition(nextX, nextY);
  };

  const handleMouseUpOrLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  return createPortal(
    <div
      className="floating-chat"
      style={{ left: x, top: y }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      <div
        className="floating-chat__header"
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="floating-chat__title">{title}</span>

        <div className="floating-chat__actions">
          <button
            type="button"
            className="floating-chat__btn"
            onClick={toggleMinimized}
          >
            {minimized ? "⬆" : "⬇"}
          </button>
          <button
            type="button"
            className="floating-chat__btn"
            onClick={close}
          >
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="floating-chat__body">
          <div className="floating-chat__messages">
            <ChatWindow />
          </div>
          <div className="floating-chat__input">
            <MessageInput />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default FloatingChatWindow;