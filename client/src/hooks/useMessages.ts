import { useMemo } from 'react';
import { useMessageStore, Message } from '@/stores/messageStore';

export function useMessagesDecrypted() {
  const activeConversationId = useMessageStore((s) => s.activeConversationId);
  const list = useMessageStore((s) => s.messages);

  const resolved = useMemo(() => {
    return list.map((m) => {
      const base: Message = {
        ...m,
        content: m.content ?? null,
      };

      if (base.repliedTo) {
        return {
          ...base,
          repliedTo: {
            ...base.repliedTo,
            content: base.repliedTo.content ?? null,
          },
        };
      }

      return base;
    });
  }, [list]);

  return { conversationId: activeConversationId, messages: resolved };
}