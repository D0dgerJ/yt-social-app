import { useEffect, useRef } from "react";
import { useUserStore } from "@/stores/userStore";
import { useChatStore } from "@/stores/chatStore";
import { useMessageStore } from "@/stores/messageStore";
import { useSocket } from "@/hooks/useSocket";
import { Message } from "@/utils/types/MessageTypes";

export const useChatSocket = () => {
  const { currentUser } = useUserStore();
  const { currentConversationId } = useChatStore();
  const { addMessage } = useMessageStore();
  const { socket } = useSocket();

  const prevConversationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socket || !currentUser || currentConversationId === null) return;

    // Подписка на входящие сообщения
    const handleReceiveMessage = (message: Message) => {
      if (message.conversationId === currentConversationId) {
        addMessage(message);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    // Переподключение к комнате
    if (prevConversationIdRef.current !== currentConversationId) {
      if (prevConversationIdRef.current !== null) {
        socket.emit("leaveConversation", prevConversationIdRef.current);
      }

      socket.emit("joinConversation", currentConversationId);
      prevConversationIdRef.current = currentConversationId;
    }

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);

      if (currentConversationId !== null) {
        socket.emit("leaveConversation", currentConversationId);
      }

      prevConversationIdRef.current = null;
    };
  }, [socket, currentUser, currentConversationId, addMessage]);
};
