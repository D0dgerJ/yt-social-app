import { useCallback, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useChatStore } from '@/stores/chatStore';

export function useTyping() {
  const { socket } = useSocket();
  const convId = useChatStore((s) => s.currentConversationId);

  const startedRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitStart = useCallback((conversationId: number) => {
    if (socket?.connected) {
      socket.emit('typing:start', { conversationId });
    }
  }, [socket]);

  const emitStop = useCallback((conversationId: number) => {
    if (socket?.connected) {
      socket.emit('typing:stop', { conversationId });
    }
  }, [socket]);

  const start = useCallback(() => {
    if (!convId) return;
    if (!startedRef.current) {
      emitStart(convId);
      startedRef.current = true;
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      if (!convId) return;
      emitStop(convId);
      startedRef.current = false;
    }, 2500);
  }, [convId, emitStart, emitStop]);

  const stop = useCallback(() => {
    if (!convId) return;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (startedRef.current) {
      emitStop(convId);
      startedRef.current = false;
    }
  }, [convId, emitStop]);

  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      startedRef.current = false;
    };
  }, []);

  return { start, stop };
}
