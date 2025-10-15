import { useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useMessageStore, type Message } from '@/stores/messageStore';
import { useComposerStore } from '@/stores/composerStore';

import {
  updateMessage as updateMessageREST,
  updateMessageByClientId,
  deleteMessage as deleteMessageREST,
  reactToMessage as reactToMessageREST,
} from '@/utils/api/chat.api';

export function useMessageActions() {
  const convId = useChatStore((s) => s.currentConversationId);

  const updateMessageInStore = useMessageStore((s) => s.updateMessage);
  const removeMessage = useMessageStore((s) => s.removeMessage);

  const setReplyTarget = useComposerStore((s) => s.setReplyTarget);
  const beginEdit = useComposerStore((s) => s.beginEdit);
  const endEdit = useComposerStore((s) => s.endEdit);

  const reactToMessage = useCallback(
    async (m: Message, emoji: string) => {
      if (!emoji) return;
      try {
        await reactToMessageREST(m.id, emoji);
      } catch (e) {
        console.error('Ошибка при реакции:', e);
      }
    },
    []
  );

  const beginEditMessage = useCallback(
    (m: Message) => {
      beginEdit(m);
    },
    [beginEdit]
  );

  const editMessage = useCallback(
    async (m: Message, newText: string) => {
      if (!convId) return;

      const prev = { id: m.id, content: m.content, updatedAt: m.updatedAt };

      updateMessageInStore({
        id: m.id,
        content: newText,
        updatedAt: new Date().toISOString(),
      } as any);

      try {
        if (m.id && m.id > 0) {
          await updateMessageREST(convId, m.id, newText);
        } else if (m.clientMessageId) {
          await updateMessageByClientId(convId, m.clientMessageId, newText);
        } else {
          throw new Error('Нет ни id, ни clientMessageId у сообщения');
        }

        endEdit();
      } catch (e) {
        console.error('Ошибка при редактировании:', e);
        updateMessageInStore({
          id: prev.id,
          content: prev.content,
          updatedAt: prev.updatedAt,
        } as any);
      }
    },
    [convId, updateMessageInStore, endEdit]
  );

  const deleteMessage = useCallback(
    async (m: Message) => {
      if (!convId || !m.id) return;

      const backup = m;
      removeMessage(m.id);

      try {
        await deleteMessageREST(convId, m.id);
      } catch (e) {
        console.error('Ошибка при удалении:', e);
        updateMessageInStore(backup as any);
      }
    },
    [convId, removeMessage, updateMessageInStore]
  );

  return {
    setReplyTarget,
    beginEditMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
  };
}
