import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useUserStore } from '@/stores/userStore';
import { useMessageStore, type Message } from '@/stores/messageStore';
import { uploadFiles, sendMessage as sendMessageREST } from '@/utils/api/chat.api';
import { useSocket } from '@/context/SocketContext';

type SendOptions = {
  conversationId: number;
  text?: string;
  files?: File[];
  replyToId?: number;
  repliedToId?: number;
};

const ACK_WAIT_SOCKET_MS = 4_000;
const ACK_TIMEOUT_MS = 12_000;

type SendMessageBody = {
  clientMessageId: string;
  conversationId: number;
  encryptedContent?: string;
  content?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker' | null;
  fileName?: string;
  gifUrl?: string;
  stickerUrl?: string;
  repliedToId?: number;
};

async function encryptText(plain?: string): Promise<string | undefined> {
  if (!plain) return undefined;
  return `b64:${btoa(unescape(encodeURIComponent(plain)))}`;
}

function mimeToMediaType(mime?: string): SendMessageBody['mediaType'] {
  if (!mime) return null;
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

export function useSendMessage() {
  const me = useUserStore((s) => s.currentUser);
  const addMessage = useMessageStore((s) => s.addMessage);
  const markStatus = useMessageStore((s) => s.markStatus);
  const replaceOptimistic = useMessageStore((s) => s.replaceOptimistic);
  const { socket } = useSocket();

  const send = useCallback(
    async (opts: SendOptions) => {
      const { conversationId, text, files = [] } = opts;
      if (!me?.id) throw new Error('Not authenticated');

      const repliedToId = opts.repliedToId ?? opts.replyToId;

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
        fileName: firstFile?.name ?? null,
        gifUrl: undefined,
        stickerUrl: undefined,
        repliedToId: repliedToId ?? null, // <<< ключевой момент
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

        let mediaUrl: string | undefined;
        let mediaType: SendMessageBody['mediaType'] = text ? 'text' : null;
        let fileName: string | undefined;

        if (files.length > 0) {
          const { urls } = await uploadFiles(files);
          const u = urls?.[0];
          if (u?.url) {
            mediaUrl = u.url;
            mediaType = mimeToMediaType(u.mime || firstFile?.type);
            fileName = u.name || firstFile?.name || undefined;
          }
        }

        const body: SendMessageBody = {
          clientMessageId,
          conversationId,
          encryptedContent,
          content: undefined,
          mediaUrl: mediaUrl ?? null,
          mediaType: mediaType ?? (text ? 'text' : null),
          fileName,
          repliedToId,
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
              socket.emit(event, body, (resp?: any) => {
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
          const serverMsg = await sendMessageREST(conversationId, {
            content: text,
            mediaUrl: body.mediaUrl,
            mediaType: body.mediaType,
            fileName: body.fileName,
            repliedToId,    
            clientMessageId,
          });
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