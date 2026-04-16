import { useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useUserStore } from '@/stores/userStore';
import { useMessageStore, type Message } from '@/stores/messageStore';
import {
  uploadFiles,
  sendMessage as sendMessageREST,
  type Attachment,
  type SendMessageBody,
} from '@/utils/api/chat.api';
import { useSocket } from '@/context/SocketContext';

type ExternalAttachment = {
  url: string;
  mime: string;
  name?: string;
  size?: number;
  type?: Attachment['type'];
};

type SendOptions = {
  conversationId: number;
  text?: string;
  files?: File[];
  externalAttachments?: ExternalAttachment[];
  replyToId?: number;
  repliedToId?: number;
  ttlSeconds?: number;
  maxViewsPerUser?: number;
};

const ACK_WAIT_SOCKET_MS = 4_000;
const ACK_TIMEOUT_MS = 12_000;

function mapMimeToType(mime?: string | null): Attachment['type'] {
  if (!mime) return 'file';
  const m = mime.toLowerCase();
  if (m.startsWith('image/')) return m === 'image/gif' ? 'gif' : 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  return 'file';
}

export function useSendMessage() {
  const me = useUserStore((s) => (s as any).me ?? (s as any).currentUser);

  const addMessage = useMessageStore((s) => s.addMessage);
  const replaceOptimistic = useMessageStore((s) => s.replaceOptimistic);
  const markStatus = useMessageStore((s) => s.markStatus);

  const { socket } = useSocket();

  const uploadedCacheRef = useRef<
    Map<string, { urls: Array<{ url: string; mime: string; name?: string; size?: number }> }>
  >(new Map());

  const send = useCallback(
    async (opts: SendOptions) => {
      const {
        conversationId,
        text,
        files = [],
        externalAttachments = [],
        ttlSeconds,
        maxViewsPerUser,
      } = opts;

      if (!me?.id) throw new Error('Not authenticated');

      const repliedToId = opts.repliedToId ?? opts.replyToId;
      const trimmed = text?.trim();

      if (!trimmed && files.length === 0 && externalAttachments.length === 0) {
        return;
      }

      const CHUNK = 10;
      const fileChunks: File[][] =
        files.length > 0
          ? Array.from({ length: Math.ceil(files.length / CHUNK) }, (_, i) =>
              files.slice(i * CHUNK, i * CHUNK + CHUNK),
            )
          : [[]];

      for (let chunkIndex = 0; chunkIndex < fileChunks.length; chunkIndex++) {
        const chunk = fileChunks[chunkIndex];

        const clientMessageId = `optimistic-${nanoid(8)}`;
        const createdAt = new Date().toISOString();

        const optimisticMediaFiles =
          chunk.length > 0
            ? chunk.map((f) => ({
                id: Math.floor(Math.random() * 1_000_000) * -1,
                url: URL.createObjectURL(f),
                type: mapMimeToType(f.type),
                uploadedAt: createdAt,
                originalName: f.name,
                mime: f.type || null,
                size: typeof f.size === 'number' ? f.size : null,
              }))
            : [];

        const optimistic: Message = {
          id: -1,
          conversationId,
          clientMessageId,
          senderId: me.id,

          content: chunkIndex === 0 ? trimmed : undefined,

          mediaFiles: optimisticMediaFiles as any,

          gifUrl: null,
          stickerUrl: null,

          repliedToId: repliedToId ?? null,
          repliedTo: null,

          isDelivered: false,
          isRead: false,
          localStatus: 'sending',

          createdAt,
          sender: {
            id: me.id,
            username: (me as any).username,
            profilePicture: (me as any).profilePicture ?? null,
          },
        };

        addMessage(optimistic);

        let acked = false;

        const finalizeOk = (serverMsg: any, fallback?: string) => {
          if (acked) return;
          acked = true;

          replaceOptimistic(clientMessageId, {
            ...serverMsg,
            content: fallback ?? serverMsg?.content ?? '',
            localStatus: 'sent',
          });
        };

        setTimeout(() => {
          if (!acked) {
            markStatus(conversationId, clientMessageId, { localStatus: 'failed' });
          }
        }, ACK_TIMEOUT_MS);

        const buildAttachments = async (): Promise<Attachment[]> => {
          if (chunk.length === 0) return [];

          const res = await uploadFiles(chunk);

          return res.urls.map((u, i) => ({
            url: u.url,
            mime: u.mime || chunk[i]?.type || 'application/octet-stream',
            name: u.name || chunk[i]?.name,
            size: u.size ?? chunk[i]?.size,
            type: mapMimeToType(u.mime || chunk[i]?.type),
          }));
        };

        try {
          const attachments = await buildAttachments();

          const body: SendMessageBody & { conversationId: number } = {
            conversationId,
            clientMessageId,
            content: chunkIndex === 0 ? trimmed : undefined,
            repliedToId,
            attachments: attachments.length ? attachments : undefined,
            ttlSeconds,
            maxViewsPerUser,
          };

          const serverMessage = await sendMessageREST(conversationId, body);

          finalizeOk(serverMessage, chunkIndex === 0 ? trimmed : undefined);
        } catch (e) {
          console.error('Send message failed:', e);
          markStatus(conversationId, clientMessageId, { localStatus: 'failed' });
        }
      }
    },
    [me?.id, addMessage, replaceOptimistic, markStatus, socket],
  );

  return { send };
}