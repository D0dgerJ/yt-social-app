import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { useChatStore } from "@/stores/chatStore";
import { useMessageStore } from "@/stores/messageStore";
import { useMessagesDecrypted } from "@/hooks/useMessages";
import MessageList from "./MessageList/MessageList";
import TypingIndicator from "@/components/Chat/Indicators/TypingIndicator";
import { useReadReceipts } from "@/hooks/useReadReceipts";
import { useMessageActions } from "@/hooks/useMessageActions";
import { getChatMessages } from "@/services/chatApi";
import "./ChatWindow.scss";

const PAGE_SIZE = 30;

interface ChatWindowProps {
  scrollToMessageId?: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ scrollToMessageId }) => {
  const meId = useUserStore((s) => s.currentUser?.id) as number | undefined;
  const { currentConversationId } = useChatStore();

  const { conversationId, messages } = useMessagesDecrypted();
  const { loadHistory, setActiveConversation, removeMessage } =
    useMessageStore.getState();

  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const oldestCursorRef = useRef<number | null>(null);
  const loadedOnceRef = useRef<Record<number, boolean>>({});

  useReadReceipts();
  const {
    reactToMessage,
    setReplyTarget,
    beginEditMessage,
    deleteMessage,
  } = useMessageActions();

  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      const now = Date.now();

      messages.forEach((m) => {
        if (!m.isEphemeral) return;
        if (!m.expiresAt) return;

        const expires = Date.parse(m.expiresAt);
        if (isFinite(expires) && expires <= now) {
          removeMessage(m.id);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId, messages, removeMessage]);

  const initialLoad = useCallback(
    async (convId: number) => {
      setIsLoadingOlder(true);
      try {
        const res = await getChatMessages(convId, { limit: PAGE_SIZE });
        loadHistory(convId, res.messages, true);

        oldestCursorRef.current = res.nextCursor ?? null;
        setHasMoreOlder(Boolean(res.nextCursor));
        loadedOnceRef.current[convId] = true;
      } finally {
        setIsLoadingOlder(false);
      }
    },
    [loadHistory]
  );

  useEffect(() => {
    if (!currentConversationId) return;

    setActiveConversation(currentConversationId);

    if (!loadedOnceRef.current[currentConversationId]) {
      void initialLoad(currentConversationId);
    }
  }, [currentConversationId, setActiveConversation, initialLoad]);

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
  }, [conversationId, hasMoreOlder, isLoadingOlder, loadHistory]);

  if (!currentConversationId || !meId) return null;

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
        scrollToMessageId={scrollToMessageId}
      />

      <TypingIndicator conversationId={currentConversationId} />
    </div>
  );
};

export default ChatWindow;