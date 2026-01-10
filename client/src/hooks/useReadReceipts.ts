import { useEffect } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useChatStore } from '@/stores/chatStore';
import { useUserStore } from '@/stores/userStore';
import { useSocket } from '@/hooks/useSocket';

export function useReadReceipts() {
  const conversationId = useChatStore((s) => s.currentConversationId);
  const messages = useMessageStore((s) => s.messages);
  const markStatus = useMessageStore((s) => s.markStatus);
  const meId = useUserStore((s) => s.currentUser?.id);
  const { socket } = useSocket();

  useEffect(() => {
    if (!conversationId || !meId) return;

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('.message-item[data-id]')
    );

    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;

          const idAttr = e.target.getAttribute('data-id');
          if (!idAttr) continue;

          const msg = messages.find(
            (m) => String(m.id) === idAttr || m.clientMessageId === idAttr
          );
          if (!msg || msg.senderId === meId || msg.isRead) continue;

          const numericId = Number(idAttr);
          const isNumeric = Number.isFinite(numericId);

          markStatus(conversationId, msg.id, { isDelivered: true, isRead: true });

          if (isNumeric && numericId > 0) {
            socket?.emit?.('messageRead', { conversationId, messageId: numericId });
          }
        }
      },
      { threshold: 0.3 }
    );

    nodes.forEach((n) => io.observe(n));

    return () => io.disconnect();
  }, [conversationId, meId, socket, messages, markStatus]);
}
