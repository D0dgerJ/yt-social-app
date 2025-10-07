import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useUserStore } from '@/stores/userStore';
import { useMessageStore, type Message } from '@/stores/messageStore';
import { uploadFiles, sendMessageREST } from '@/services/chatApi';
import { useSocket } from '@/hooks/useSocket';

type SendOptions = {
  conversationId: number;
  text?: string;
  files?: File[];
  replyToId?: number;
};

const ACK_WAIT_SOCKET_MS = 4_000;
const ACK_TIMEOUT_MS = 12_000;

type SendMessageDto = {
  clientMessageId: string;
  conversationId: number;
  encryptedContent?: string;
  content?: string;
  media?: { url: string; name: string; mime: string };
  replyToId?: number;
};

async function encryptText(plain?: string): Promise<string | undefined> {
  if (!plain) return undefined;
  return `b64:${btoa(unescape(encodeURIComponent(plain)))}`;
}

export function useSendMessage() {
  const me = useUserStore((s) => s.currentUser);
  const addMessage = useMessageStore((s) => s.addMessage);
  const markStatus = useMessageStore((s) => s.markStatus);
  const replaceOptimistic = useMessageStore((s) => s.replaceOptimistic);
  const { socket } = useSocket();

  const send = useCallback(
    async (opts: SendOptions) => {
      const { conversationId, text, files = [], replyToId } = opts;
      if (!me?.id) throw new Error('Not authenticated');

      const clientMessageId = `optimistic-${nanoid(8)}`;
      const createdAt = new Date().toISOString();

      const guessMediaType = (f?: File): Message['mediaType'] => {
        if (!f) return text ? 'text' : 'file';
        if (f.type.startsWith('image/')) return 'image';
        if (f.type.startsWith('video/')) return 'video';
        if (f.type.startsWith('audio/')) return 'audio';
        return 'file';
      };

      const firstFile = files[0];
      const optimistic: Message = {
        id: -1,
        clientMessageId,
        conversationId,
        senderId: me.id,
        content: text,
        encryptedContent: undefined,
        mediaUrl: firstFile ? URL.createObjectURL(firstFile) : null,
        mediaType: guessMediaType(firstFile),
        fileName: firstFile?.name,
        gifUrl: undefined,
        stickerUrl: undefined,
        repliedToId: replyToId,
        isDelivered: false,
        isRead: false,
        localStatus: 'sending',
        createdAt,
        updatedAt: createdAt,
      };

      addMessage(optimistic);

      let acked = false;
      let failTimer: ReturnType<typeof setTimeout> | null = null;

      const finalizeOk = (serverMsg: any) => {
        if (acked) return;
        acked = true;

        replaceOptimistic(clientMessageId, {
          ...(serverMsg as any),
          localStatus: 'sent',
        });

        if (optimistic.mediaUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(optimistic.mediaUrl);
        }
        if (failTimer) {
          clearTimeout(failTimer);
          failTimer = null;
        }
      };

      failTimer = setTimeout(() => {
        if (!acked) {
          markStatus(conversationId, clientMessageId, { localStatus: 'failed' });
          if (optimistic.mediaUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(optimistic.mediaUrl);
          }
        }
      }, ACK_TIMEOUT_MS);

      try {
        const encryptedContent = await encryptText(text);

        let uploaded: SendMessageDto['media'] | undefined;
        if (files.length > 0) {
          const { urls } = await uploadFiles(files);
          const u = urls?.[0];
          if (u?.url) {
            const mime = u.mime || firstFile?.type || 'application/octet-stream';
            const name = u.name || firstFile?.name || '';
            uploaded = { url: u.url, name, mime };
          }
        }

        const payload: SendMessageDto = {
          clientMessageId,
          conversationId,
          encryptedContent,
          content: undefined,
          media: uploaded,
          replyToId,
        };

        const trySocket = async () => {
          if (!socket?.connected) return false;

          const complete = (serverMsg: any) => {
            if (serverMsg?.clientMessageId !== clientMessageId) return;
            socket.off('message:ack', complete);
            socket.off('receiveMessage', complete);
            finalizeOk(serverMsg);
          };

          socket.on('message:ack', complete);
          socket.on('receiveMessage', complete);

          try {
            const emitVariants = ['message:send', 'sendMessage'];

            for (const event of emitVariants) {
              socket.emit(event, payload, (resp?: any) => {
                if (resp?.status === 'ok' && resp.message?.clientMessageId === clientMessageId) {
                  socket.off('message:ack', complete);
                  socket.off('receiveMessage', complete);
                  finalizeOk(resp.message);
                }
              });
            }

            await new Promise<void>((resolve) => setTimeout(resolve, ACK_WAIT_SOCKET_MS));
          } finally {
            socket.off('message:ack', complete);
            socket.off('receiveMessage', complete);
          }

          return acked;
        };

        const okBySocket = await trySocket();

        if (!okBySocket && !acked) {
          const serverMsg = await sendMessageREST(payload);
          if (serverMsg?.id) {
            finalizeOk(serverMsg);
          } else {
            throw new Error('sendMessageREST returned no id');
          }
        }
      } catch (err) {
        console.error(err);
        if (!acked) {
          markStatus(conversationId, clientMessageId, { localStatus: 'failed' });
          if (optimistic.mediaUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(optimistic.mediaUrl);
          }
          if (failTimer) {
            clearTimeout(failTimer);
            failTimer = null;
          }
        }
      }
    },
    [me?.id, addMessage, replaceOptimistic, markStatus, socket]
  );

  return { send };
}
