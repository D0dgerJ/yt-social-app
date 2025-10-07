import { useMemo, useEffect } from 'react';
import { useMessageStore, Message } from '@/stores/messageStore';
import { decryptText } from '@/utils/crypto';

const decryptCache = new Map<string, string>();

function getDecryptKey(m: Message) {
  return `${m.id}|${m.updatedAt || ''}|${m.encryptedContent || ''}`;
}

export function useMessagesDecrypted() {
  const activeConversationId = useMessageStore(s => s.activeConversationId);
  const list = useMessageStore(s => s.messages);

  useEffect(() => {
    decryptCache.clear();
  }, [activeConversationId]);

  const resolved = useMemo(() => {
    return list.map((m) => {
      if (m.content && !m.encryptedContent) return m;
      if (!m.encryptedContent) return m;

      const key = getDecryptKey(m);
      let decoded = decryptCache.get(key);

      if (!decoded) {
        try {
          decoded = decryptText(m.encryptedContent);
        } catch (err) {
          console.error('Ошибка расшифровки:', err);
          decoded = '[Ошибка расшифровки]';
        }
        decryptCache.set(key, decoded);
      }

      return { ...m, content: decoded };
    });
  }, [list]);

  return { conversationId: activeConversationId, messages: resolved };
}
