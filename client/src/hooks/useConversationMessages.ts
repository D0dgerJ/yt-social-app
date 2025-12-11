import { useMemo } from "react";
import { useMessageStore, Message } from "@/stores/messageStore";
import { decryptText } from "@/utils/crypto";

const decryptCache = new Map<string, string>();

function keyForMessage(m: Message) {
  return `${m.id}|${m.updatedAt || ""}|${m.encryptedContent || ""}`;
}

function keyForReply(m: Message) {
  const rt: any = (m as any).repliedTo;
  const rid = rt?.id ?? "x";
  const enc = rt?.encryptedContent ?? "";
  const upd = rt?.editedAt ?? rt?.updatedAt ?? "";
  return `reply:${rid}|${enc}|${upd}`;
}

export function useConversationMessages(conversationId: number | null) {
  const list = useMessageStore((state) =>
    conversationId ? state.byConv[conversationId] ?? [] : []
  );

  const resolved = useMemo(() => {
    if (!conversationId) return [];

    return list.map((m) => {
      let base: any = m;

      if (!base.content && base.encryptedContent) {
        const k = keyForMessage(base);
        let decoded = decryptCache.get(k);

        if (!decoded) {
          try {
            decoded = decryptText(base.encryptedContent);
          } catch (err) {
            console.error("Ошибка расшифровки сообщения", err);
            decoded = "";
          }
          decryptCache.set(k, decoded);
        }

        base = {
          ...base,
          content: decoded,
        };
      }

      const repliedTo: any = base.repliedTo;
      const hasReplyEnc =
        repliedTo && repliedTo.encryptedContent && !repliedTo.content;

      if (hasReplyEnc) {
        const rk = keyForReply(base);
        let rdecoded = decryptCache.get(rk);

        if (!rdecoded) {
          try {
            rdecoded = decryptText(repliedTo.encryptedContent);
          } catch (err) {
            console.error("Ошибка расшифровки ответа", err);
            rdecoded = "";
          }
          decryptCache.set(rk, rdecoded);
        }

        return {
          ...base,
          repliedTo: {
            ...repliedTo,
            content: rdecoded,
          },
        } as Message;
      }

      return base as Message;
    });
  }, [list, conversationId]);

  return resolved;
}