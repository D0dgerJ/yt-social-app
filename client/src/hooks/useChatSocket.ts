import { useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useChatStore } from '@/stores/chatStore';
import { useMessageStore } from '@/stores/messageStore';
import { useTypingStore } from '@/stores/typingStore';
import { useSocket } from '@/context/SocketContext';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Message as ServerMessage } from '@/utils/types/MessageTypes';
import type { GroupedReaction } from '@/stores/messageStore';

const looksEncrypted = (s?: string | null): s is string =>
  typeof s === 'string' && s.startsWith('b64:');

const safeDecrypt = (maybeEnc?: string | null): string => {
  if (!maybeEnc) return '';
  if (!looksEncrypted(maybeEnc)) return maybeEnc;
  try {
    const raw = maybeEnc.slice(4);
    return decodeURIComponent(escape(atob(raw)));
  } catch {
    return '[Ошибка расшифровки]';
  }
};

function hasProp<T extends object, K extends PropertyKey>(
  obj: T | null | undefined,
  key: K
): obj is T & Record<K, unknown> {
  return !!obj && typeof obj === 'object' && key in obj;
}

type IncomingMessage = ServerMessage & {
  content?: string;
  repliedTo?: {
    id: number;
    senderId: number;
    encryptedContent?: string | null;
    content?: string;
    [k: string]: unknown;
  } | null;
};

function hydrateDecrypted(msg: ServerMessage): IncomingMessage {
  if (!msg) return msg as any;

  let content: string | undefined =
    hasProp(msg, 'content') && typeof (msg as any).content === 'string'
      ? ((msg as any).content as string)
      : undefined;

  if (!content || looksEncrypted(content)) {
    const enc = (hasProp(msg, 'encryptedContent')
      ? (msg as any).encryptedContent
      : undefined) as string | null | undefined;
    content = enc ? safeDecrypt(enc) : safeDecrypt(content);
  }

  let repliedTo: IncomingMessage['repliedTo'] =
    (hasProp(msg, 'repliedTo') ? (msg as any).repliedTo : undefined) as any;

  if (repliedTo && !repliedTo.content) {
    const enc = repliedTo.encryptedContent as string | null | undefined;
    if (enc) {
      repliedTo = { ...repliedTo, content: safeDecrypt(enc) };
    }
  }

  return { ...(msg as any), content, repliedTo };
}


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

  const addNotification = useNotificationStore((s) => s.addNotification);

  const prevConversationIdRef = useRef<number | null>(null);
  const purgeTimerRef = useRef<number | null>(null);

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

    const onNotificationNew = (notification: any) => {
      try {
        addNotification(notification);
      } catch (e) {
        console.error('[useChatSocket] failed to add notification:', e);
      }
    };

    const onReceiveMessage = (raw: ServerMessage) => {
      if (raw.conversationId !== currentConversationId) return;

      const m = hydrateDecrypted(raw);

      if (m.clientMessageId && isHandled?.(m.clientMessageId)) return;
      if (m.clientMessageId) markHandled?.(m.clientMessageId);

      if (m.clientMessageId) {
        replaceOptimistic?.(m.clientMessageId, { ...(m as any), localStatus: 'sent' });
      } else {
        addMessage?.({ ...(m as any), localStatus: 'sent' });
      }

      const isIncoming = typeof meId === 'number' ? m.senderId !== meId : true;
      if (isIncoming) {
        markStatus?.(m.conversationId, m.id, { isDelivered: true });
        socket.emit?.('messageDelivered', {
          conversationId: m.conversationId,
          messageId: m.id,
        });
      }
    };

    const onMessageAck = (raw: ServerMessage) => {
      if (!raw.clientMessageId || isHandled?.(raw.clientMessageId)) return;
      markHandled?.(raw.clientMessageId);

      const m = hydrateDecrypted(raw);

      replaceOptimistic?.(raw.clientMessageId, {
        ...(m as any),
        localStatus: 'sent',
      });
    };

    const onMessageUpdated = (updated: ServerMessage | { message?: ServerMessage }) => {
      const raw = (updated as any)?.message ?? updated;
      if (!raw) return;
      const m = hydrateDecrypted(raw);
      updateMessage?.({ ...(m as any) });
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

    socket.on('notification:new', onNotificationNew);
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
        'notification:new',
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
    addNotification,
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