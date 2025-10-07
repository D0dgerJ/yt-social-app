import { useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useMessageStore, type Message } from '@/stores/messageStore';
import { useComposerStore } from '@/stores/composerStore';
import { deleteMessageREST, editMessageREST, toggleReactionREST } from '@/services/chatApi';
import { useSocket } from '@/hooks/useSocket';

export function useMessageActions() {
  const convId = useChatStore((s) => s.currentConversationId);
  const updateMessage = useMessageStore((s) => s.updateMessage);
  const removeMessage = useMessageStore((s) => s.removeMessage);

  const setReplyTarget = useComposerStore((s) => s.setReplyTarget);
  const beginEdit = useComposerStore((s) => s.beginEdit);
  const endEdit = useComposerStore((s) => s.endEdit);

  const { socket } = useSocket();

  const reactToMessage = useCallback(
    async (m: Message, emoji: string) => {
      if (!convId) return;

      try {
        await toggleReactionREST(convId, m.id, emoji);
      } catch (e) {
        console.error('Ошибка при реакции:', e);
      }
    },
    [convId]
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

      const patch = { id: m.id, content: newText, updatedAt: new Date().toISOString() };
      updateMessage(patch);

      try {
        await editMessageREST(convId, m.id, newText);
        endEdit();
      } catch (e) {
        console.error('Ошибка при редактировании:', e);
      }
    },
    [convId, updateMessage, endEdit]
  );

  const deleteMessage = useCallback(
    async (m: Message) => {
      if (!convId) return;

      removeMessage(m.id);

      try {
        await deleteMessageREST(convId, m.id);
      } catch (e) {
        console.error('Ошибка при удалении:', e);
      }
    },
    [convId, removeMessage]
  );

  return {
    setReplyTarget,
    beginEditMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
  };
}
