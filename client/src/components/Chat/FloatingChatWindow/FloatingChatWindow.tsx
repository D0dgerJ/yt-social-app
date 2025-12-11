import React, { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

import { useFloatingChatStore } from "@/stores/floatingChatStore";
import { useChatStore } from "@/stores/chatStore";

import MessageInput from "@/components/Chat/MessageInput/MessageInput";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useUserStore } from "@/stores/userStore";
import { useMessageStore } from "@/stores/messageStore";
import { useMessageActions } from "@/hooks/useMessageActions";
import TypingIndicator from "@/components/Chat/Indicators/TypingIndicator";
import MessageList from "@/components/Chat/ChatWindow/MessageList/MessageList";
import { getChatMessages } from "@/services/chatApi";

import "./FloatingChatWindow.scss";

const PAGE_SIZE = 30;

interface PopupBodyProps {
  conversationId: number;
}

const PopupChatBody: React.FC<PopupBodyProps> = ({ conversationId }) => {
  const meId = useUserStore((s) => s.currentUser?.id) as number | undefined;
  const messages = useConversationMessages(conversationId);
  const { loadHistory, removeMessage } = useMessageStore.getState();

  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const oldestCursorRef = useRef<number | null>(null);
  const loadedOnceRef = useRef(false);

  const {
    reactToMessage,
    setReplyTarget,
    beginEditMessage,
    deleteMessage,
  } = useMessageActions();

  useEffect(() => {
    if (!conversationId || loadedOnceRef.current) return;

    (async () => {
      setIsLoadingOlder(true);
      try {
        const res = await getChatMessages(conversationId, { limit: PAGE_SIZE });
        loadHistory(conversationId, res.messages, true);
        oldestCursorRef.current = res.nextCursor ?? null;
        setHasMoreOlder(Boolean(res.nextCursor));
        loadedOnceRef.current = true;
      } finally {
        setIsLoadingOlder(false);
      }
    })();
  }, [conversationId, loadHistory]);

  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      const now = Date.now();
      messages.forEach((m) => {
        if (!m.isEphemeral || !m.expiresAt) return;
        const expires = Date.parse(m.expiresAt);
        if (isFinite(expires) && expires <= now) {
          removeMessage(m.id);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId, messages, removeMessage]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || isLoadingOlder || !hasMoreOlder) return;

    setIsLoadingOlder(true);
    try {
      const res = await getChatMessages(conversationId, {
        limit: PAGE_SIZE,
        cursorId: oldestCursorRef.current ?? undefined,
        direction: "backward",
      });

      if (res.messages.length) {
        loadHistory(conversationId, res.messages, true);
        oldestCursorRef.current = res.nextCursor ?? null;
        setHasMoreOlder(Boolean(res.nextCursor));
      } else {
        setHasMoreOlder(false);
      }
    } finally {
      setIsLoadingOlder(false);
    }
  }, [conversationId, isLoadingOlder, hasMoreOlder, loadHistory]);

  if (!conversationId || !meId) return null;

  return (
    <div className="chat-window chat-scroll">
      <MessageList
        meId={meId}
        messages={messages}
        isLoadingOlder={isLoadingOlder}
        hasMoreOlder={hasMoreOlder}
        loadOlder={loadOlder}
        onRetry={(m) => console.log("retry", m)}
        onReply={(m) => setReplyTarget(m)}
        onReact={(m, emoji) => reactToMessage(m, emoji)}
        onOpenAttachment={(url) => window.open(url, "_blank")}
        onEdit={(m) => beginEditMessage(m)}
        onDelete={(m) => deleteMessage(m)}
      />
      <TypingIndicator conversationId={conversationId} />
    </div>
  );
};

interface SingleWindowProps {
  id: string;
  conversationId: number;
  x: number;
  y: number;
  minimized: boolean;
}

const SingleFloatingChatWindow: React.FC<SingleWindowProps> = ({
  id,
  conversationId,
  x,
  y,
  minimized,
}) => {
  const getConversation = useChatStore((s) => s.getConversation);
  const close = useFloatingChatStore((s) => s.close);
  const toggleMinimized = useFloatingChatStore((s) => s.toggleMinimized);
  const setPosition = useFloatingChatStore((s) => s.setPosition);

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const conv = getConversation(conversationId) as any;
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
    setPosition(id, nextX, nextY);
  };

  const handleMouseUpOrLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  return (
    <div
      className={`floating-chat ${
        minimized ? "floating-chat--minimized" : ""
      }`}
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
            onClick={() => toggleMinimized(id)}
          >
            {minimized ? "⬆" : "⬇"}
          </button>
          <button
            type="button"
            className="floating-chat__btn"
            onClick={() => close(id)}
          >
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="floating-chat__body">
          <div className="floating-chat__messages">
            <PopupChatBody conversationId={conversationId} />
          </div>
          <div className="floating-chat__input">
            <MessageInput
              conversationIdOverride={conversationId}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
};

const FloatingChatWindow: React.FC = () => {
  const windows = useFloatingChatStore((s) => s.windows);

  if (!windows.length) return null;

  return createPortal(
    <>
      {windows.map((w) => (
        <SingleFloatingChatWindow
          key={w.id}
          id={w.id}
          conversationId={w.conversationId}
          x={w.x}
          y={w.y}
          minimized={w.minimized}
        />
      ))}
    </>,
    document.body
  );
};

export default FloatingChatWindow;