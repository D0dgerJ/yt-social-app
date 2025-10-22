import { useSendMessage } from '@/hooks/useSendMessage';
import { useChatStore } from '@/stores/chatStore';
import { useComposerStore } from '@/stores/composerStore';

export function useGifSender(replyToId?: number) {
  const { currentConversationId } = useChatStore();
  const { send } = useSendMessage();
  const replyTarget = useComposerStore(s => s.replyTarget);

  const sendGif = async (url: string) => {
    if (!currentConversationId) return;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`GIF fetch failed: ${resp.status}`);
    const blob = await resp.blob();

    const mime = blob.type || 'image/gif';
    const extFromMime =
      mime.includes('webp') ? 'webp' :
      mime.includes('mp4')  ? 'mp4'  : 'gif';

    const extFromUrl = (() => {
      try {
        const u = new URL(url);
        const m = u.pathname.match(/\.(gif|webp|mp4)(?:$|\?)/i);
        return m?.[1]?.toLowerCase();
      } catch { return undefined; }
    })();

    const ext = (extFromUrl || extFromMime) as 'gif' | 'webp' | 'mp4';
    const file = new File([blob], `gif-${Date.now()}.${ext}`, { type: mime });

    const replyId: number | undefined =
      replyToId ?? (replyTarget?.id != null ? Number(replyTarget.id) : undefined);

    await send({
      conversationId: currentConversationId,
      files: [file],
      replyToId: replyId,
    });
  };

  return { sendGif };
}