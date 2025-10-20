import { useMemo, useEffect } from 'react';
import { useMessageStore, Message } from '@/stores/messageStore';
import { decryptText } from '@/utils/crypto';

const decryptCache = new Map<string, string>();

function keyForMessage(m: Message) {
  return `${m.id}|${m.updatedAt || ''}|${m.encryptedContent || ''}`;
}

function keyForReply(m: Message) {
  const rt: any = (m as any).repliedTo;
  const rid = rt?.id ?? 'x';
  const enc = rt?.encryptedContent ?? '';
  const upd = rt?.editedAt ?? rt?.updatedAt ?? '';
  return `reply:${rid}|${enc}`;
}

export function useMessagesDecrypted() {
  const activeConversationId = useMessageStore((s) => s.activeConversationId);
  const list = useMessageStore((s) => s.messages);

  useEffect(() => {
    decryptCache.clear();
  }, [activeConversationId]);

  const resolved = useMemo(() => {
    return list.map((m) => {
      let base: any = m;

      if (!base.content && base.encryptedContent) {
        const k = keyForMessage(base);
        let decoded = decryptCache.get(k);

        if (!decoded) {
          try {
            decoded = decryptText(base.encryptedContent);
          } catch (err) {
            console.error('Ошибка расшифровки сообщения:', err);
            decoded = '[Ошибка расшифровки]';
          }
          decryptCache.set(k, decoded);
        }

        base = { ...base, content: decoded };
      }

      const repliedTo = (base as any).repliedTo;
      const hasReplyEnc = repliedTo?.encryptedContent && !repliedTo?.content;

      if (hasReplyEnc) {
        const rk = keyForReply(base);
        let rdecoded = decryptCache.get(rk);

        if (!rdecoded) {
          try {
            rdecoded = decryptText(repliedTo.encryptedContent);
          } catch (err) {
            console.error('Ошибка расшифровки цитаты:', err);
            rdecoded = '[Ошибка расшифровки]';
          }
          decryptCache.set(rk, rdecoded);
        }

        base = {
          ...base,
          repliedTo: {
            ...repliedTo,
            content: rdecoded,
          },
        };
      }

      return base as Message;
    });
  }, [list]);

  return { conversationId: activeConversationId, messages: resolved };
}
