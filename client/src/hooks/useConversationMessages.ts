import { useMemo } from "react";
import { useMessageStore, Message } from "@/stores/messageStore";

export function useConversationMessages(conversationId: number | null) {
  const list = useMessageStore((state) =>
    conversationId ? state.byConv[conversationId] ?? [] : []
  );

  const resolved = useMemo(() => {
    if (!conversationId) return [];

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
        } as Message;
      }

      return base;
    });
  }, [list, conversationId]);

  return resolved;
}