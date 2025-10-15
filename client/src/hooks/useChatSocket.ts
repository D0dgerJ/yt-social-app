import { useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useChatStore } from '@/stores/chatStore';
import { useMessageStore } from '@/stores/messageStore';
import { useTypingStore } from '@/stores/typingStore';
import { useSocket } from '@/context/SocketContext';
import type { Message as ServerMessage } from '@/utils/types/MessageTypes';
import type { GroupedReaction } from '@/stores/messageStore';

/**
 * Единый хук подписок на чатовые события по сокету.
 * - receiveMessage / message:ack → обновление optimistic
 * - delivered/read
 * - edit/delete
 * - реакции
 * - typing start/stop
 * - join/leave при смене беседы
 */
export const useChatSocket = () => {
  const { currentUser } = useUserStore();
  const meId = currentUser?.id;
  const { currentConversationId } = useChatStore();
  const { socket, joinConversation, leaveConversation } = useSocket();

  const {
    addMessage,
    replaceOptimistic,
    markStatus,
    updateMessage,
    removeMessage,
    setActiveConversation,
    toggleReaction,
    updateMessageReactions,
    isHandled,
    markHandled,
  } = useMessageStore();

  const prevConversationIdRef = useRef<number | null>(null);
  const purgeTimerRef = useRef<number | null>(null);

  const toClientMessage = (msg: ServerMessage) => ({ ...(msg as any) });

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      if (currentConversationId != null) {
        joinConversation(currentConversationId);
      }
    };

    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket, currentConversationId, joinConversation]);

  useEffect(() => {
    if (!socket || !currentUser) return;
    const typingApi = useTypingStore.getState();

    const onReceiveMessage = (msg: ServerMessage) => {
      if (msg.conversationId !== currentConversationId) return;
      const clientMsg = toClientMessage(msg);

      if (msg.clientMessageId && isHandled?.(msg.clientMessageId)) return;
      if (msg.clientMessageId) markHandled?.(msg.clientMessageId);

      if (msg.clientMessageId) {
        replaceOptimistic?.(msg.clientMessageId, { ...clientMsg, localStatus: 'sent' });
      } else {
        addMessage?.({ ...clientMsg, localStatus: 'sent' });
      }

      const isIncoming = typeof meId === 'number' ? msg.senderId !== meId : true;
      if (isIncoming) {
        markStatus?.(msg.conversationId, msg.id, { isDelivered: true });
        socket.emit?.('messageDelivered', {
          conversationId: msg.conversationId,
          messageId: msg.id,
        });
      }
    };

    const onMessageAck = (msg: ServerMessage) => {
      if (!msg.clientMessageId || isHandled?.(msg.clientMessageId)) return;
      markHandled?.(msg.clientMessageId);
      replaceOptimistic?.(msg.clientMessageId, {
        ...toClientMessage(msg),
        localStatus: 'sent',
      });
    };

    const onMessageUpdated = (updated: ServerMessage | { message?: ServerMessage }) => {
      const msg = (updated as any)?.message ?? updated;
      if (!msg) return;
      updateMessage?.({ ...(msg as any) });
    };

    const onMessageDelete = (payload: { messageId: number }) => {
      if (!payload?.messageId) return;
      removeMessage?.(payload.messageId);
    };

    const onDelivered = (p: { conversationId: number; messageId: number }) =>
      markStatus?.(p.conversationId, p.messageId, { isDelivered: true });

    const onRead = (p: { conversationId: number; messageId: number }) =>
      markStatus?.(p.conversationId, p.messageId, { isDelivered: true, isRead: true });

    const onReactionsUpdated = (p: {
      conversationId: number;
      messageId: number;
      groupedReactions: GroupedReaction[];
    }) => {
      if (p.conversationId !== currentConversationId) return;
      updateMessageReactions?.(p.conversationId, p.messageId, p.groupedReactions, meId);
    };

    const onMessageReaction = (payload: {
      conversationId: number;
      messageId: number;
      emoji: string;
      userId: number;
      toggledOn?: boolean;
    }) => {
      if (payload.conversationId !== currentConversationId) return;
      toggleReaction?.(
        payload.conversationId,
        payload.messageId,
        payload.emoji,
        payload.userId,
        payload.toggledOn
      );
    };

    const onTypingStart = (p: {
      conversationId: number;
      userId: number;
      username?: string;
      displayName?: string;
      timestamp?: number;
    }) => {
      if (p.conversationId !== currentConversationId) return;
      if (meId && p.userId === meId) return;
      typingApi.setTyping(p.conversationId, {
        userId: p.userId,
        username: p.username,
        displayName: p.displayName,
        lastAt: p.timestamp ?? Date.now(),
      });
    };

    const onTypingStop = (p: { conversationId: number; userId: number }) => {
      if (p.conversationId !== currentConversationId) return;
      if (meId && p.userId === meId) return;
      typingApi.stopTyping(p.conversationId, p.userId);
    };

    socket.on('receiveMessage', onReceiveMessage);
    socket.on('message:ack', onMessageAck);
    socket.on('messageUpdated', onMessageUpdated);
    socket.on('message:edit', onMessageUpdated);
    socket.on('message:delete', onMessageDelete);
    socket.on('message:delivered', onDelivered);
    socket.on('message:read', onRead);
    socket.on('reaction:updated', onReactionsUpdated);
    socket.on('message:reaction', onMessageReaction);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    if (purgeTimerRef.current) {
      window.clearInterval(purgeTimerRef.current);
      purgeTimerRef.current = null;
    }
    if (currentConversationId != null) {
      purgeTimerRef.current = window.setInterval(() => {
        useTypingStore.getState().purgeOlderThan(currentConversationId, 4000);
      }, 1500) as unknown as number;
    }

    return () => {
      [
        'receiveMessage',
        'message:ack',
        'messageUpdated',
        'message:edit',
        'message:delete',
        'message:delivered',
        'message:read',
        'reaction:updated',
        'message:reaction',
        'typing:start',
        'typing:stop',
      ].forEach((e) => socket.off(e));

      if (purgeTimerRef.current) {
        window.clearInterval(purgeTimerRef.current);
        purgeTimerRef.current = null;
      }
      if (currentConversationId != null) {
        useTypingStore.getState().clear(currentConversationId);
      }
    };
  }, [
    socket,
    currentUser,
    currentConversationId,
    meId,
    addMessage,
    replaceOptimistic,
    markStatus,
    updateMessage,
    removeMessage,
    toggleReaction,
    updateMessageReactions,
    isHandled,
    markHandled,
  ]);

  useEffect(() => {
    if (!socket) return;

    const prev = prevConversationIdRef.current;
    const next = currentConversationId ?? null;

    if (prev != null && prev !== next) {
      leaveConversation(prev);
    }
    if (next != null && prev !== next) {
      joinConversation(next);
      setActiveConversation?.(next);
    }

    prevConversationIdRef.current = next;

    return () => {
      const cur = prevConversationIdRef.current;
      if (cur != null) {
        leaveConversation(cur);
      }
      prevConversationIdRef.current = null;
    };
  }, [socket, currentConversationId, setActiveConversation, joinConversation, leaveConversation]);
};
