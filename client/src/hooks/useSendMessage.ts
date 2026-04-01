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

async function encryptText(plain?: string): Promise<string | undefined> {
  if (!plain) return undefined;
  return `b64:${btoa(unescape(encodeURIComponent(plain)))}`;
}

function decryptBase64Payload(enc?: string): string | undefined {
  if (!enc) return undefined;
  if (!enc.startsWith('b64:')) return enc;
  const raw = enc.slice(4);
  try {
    return decodeURIComponent(escape(atob(raw)));
  } catch {
    return enc;
  }
}

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

        const optimisticMediaFilesFromFiles =
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

        const optimisticMediaFilesFromExternal =
          chunkIndex === 0 && externalAttachments.length > 0
            ? externalAttachments.map((a, index) => ({
                id: (Math.floor(Math.random() * 1_000_000) + index + 1) * -1,
                url: a.url,
                type: a.type ?? mapMimeToType(a.mime),
                uploadedAt: createdAt,
                originalName: a.name ?? null,
                mime: a.mime ?? null,
                size: a.size ?? null,
              }))
            : [];

        const optimisticMediaFiles = [
          ...optimisticMediaFilesFromFiles,
          ...optimisticMediaFilesFromExternal,
        ];

        const optimistic: Message = {
          id: -1,
          conversationId,
          clientMessageId,
          senderId: me.id,

          content: chunkIndex === 0 ? trimmed : undefined,
          encryptedContent: undefined,

          mediaUrl: null,
          mediaType: null,
          fileName: null,

          mediaFiles: optimisticMediaFiles as any,

          gifUrl: null,
          stickerUrl: null,

          repliedToId: repliedToId ?? null,
          repliedTo: null,

          isDelivered: false,
          isRead: false,
          localStatus: 'sending',

          createdAt,
          editedAt: null as any,
          deletedAt: null as any,
          groupedReactions: [],
          sender: {
            id: me.id,
            username: (me as any).username,
            profilePicture: (me as any).profilePicture ?? null,
          },
        };

        addMessage(optimistic);

        let acked = false;
        let failTimer: ReturnType<typeof setTimeout> | null = null;

        const finalizeOk = (serverMsg: any, fallbackPlainText?: string) => {
          if (acked) return;
          acked = true;

          const decryptedText =
            fallbackPlainText && fallbackPlainText.trim()
              ? fallbackPlainText.trim()
              : decryptBase64Payload(serverMsg?.encryptedContent);

          const hydratedMsg = {
            ...serverMsg,
            content: decryptedText ?? serverMsg?.content ?? '',
            localStatus: 'sent',
          };

          replaceOptimistic(clientMessageId, hydratedMsg);

          if (failTimer) {
            clearTimeout(failTimer);
            failTimer = null;
          }
        };

        failTimer = setTimeout(() => {
          if (!acked) {
            markStatus(conversationId, clientMessageId, { localStatus: 'failed' });
          }
        }, ACK_TIMEOUT_MS);

        const uploadChunk = async () => {
          if (chunk.length === 0) {
            return {
              urls: [] as Array<{ url: string; mime: string; name?: string; size?: number }>,
            };
          }

          const key = `${clientMessageId}-c${chunkIndex}`;
          const cached = uploadedCacheRef.current.get(key);
          if (cached) return cached;

          const res = await uploadFiles(chunk);
          uploadedCacheRef.current.set(key, res);
          return res;
        };

        const buildAttachments = async (): Promise<Attachment[]> => {
          const uploaded = await uploadChunk();

          const uploadedAttachments: Attachment[] = uploaded.urls.map((u, i) => ({
            url: u.url,
            mime: u.mime || chunk[i]?.type || 'application/octet-stream',
            name: u.name || chunk[i]?.name || `file-${i + 1}`,
            size: u.size ?? chunk[i]?.size ?? undefined,
            type: mapMimeToType(u.mime || chunk[i]?.type),
          }));

          const extraAttachments: Attachment[] =
            chunkIndex === 0
              ? externalAttachments.map((a) => ({
                  url: a.url,
                  mime: a.mime || 'image/gif',
                  name: a.name || 'external.gif',
                  size: a.size,
                  type: a.type ?? mapMimeToType(a.mime),
                }))
              : [];

          return [...uploadedAttachments, ...extraAttachments];
        };

        const trySocket = async (): Promise<boolean> => {
          if (!socket?.connected) return false;

          const complete = (serverMsg: any) => {
            const m = serverMsg?.message ?? serverMsg;
            if (m?.clientMessageId !== clientMessageId) return;

            socket.off('message:ack', complete);
            socket.off('receiveMessage', complete);

            finalizeOk(m, chunkIndex === 0 ? trimmed : undefined);
          };

          socket.on('message:ack', complete);
          socket.on('receiveMessage', complete);

          try {
            const body: SendMessageBody & { conversationId: number } = {
              conversationId,
              clientMessageId,
              encryptedContent: await encryptText(
                chunkIndex === 0 ? trimmed : undefined,
              ),
              content: undefined,
              repliedToId,
              ttlSeconds,
              maxViewsPerUser,
            };

            const attachments = await buildAttachments();
            if (attachments.length) {
              body.attachments = attachments;
            }

            socket.emit('message:send', body, (resp?: any) => {
              if (
                resp?.status === 'ok' &&
                resp.message?.clientMessageId === clientMessageId
              ) {
                socket.off('message:ack', complete);
                socket.off('receiveMessage', complete);

                finalizeOk(resp.message, chunkIndex === 0 ? trimmed : undefined);
              }
            });

            await new Promise<void>((r) => setTimeout(r, ACK_WAIT_SOCKET_MS));
          } finally {
            socket.off('message:ack', complete);
            socket.off('receiveMessage', complete);
          }

          return acked;
        };

        try {
          const okBySocket = await trySocket();

          if (!okBySocket && !acked) {
            const encryptedContent = await encryptText(
              chunkIndex === 0 ? trimmed : undefined,
            );

            const attachments = await buildAttachments();

            const body: SendMessageBody & { conversationId: number } = {
              conversationId,
              clientMessageId,
              encryptedContent,
              content: undefined,
              repliedToId,
              attachments: attachments.length ? attachments : undefined,
              ttlSeconds,
              maxViewsPerUser,
            };

            const serverMessage = await sendMessageREST(conversationId, body);

            if (serverMessage?.id) {
              finalizeOk(
                serverMessage,
                chunkIndex === 0 ? trimmed : undefined,
              );
            } else {
              throw new Error('sendMessageREST returned no id');
            }
          }
        } catch (e) {
          console.error('Send message failed:', e);
          if (!acked) {
            markStatus(conversationId, clientMessageId, { localStatus: 'failed' });
          }
        } finally {
          optimisticMediaFilesFromFiles.forEach((m) => {
            if (typeof m.url === 'string' && m.url.startsWith('blob:')) {
              URL.revokeObjectURL(m.url);
            }
          });
        }
      }
    },
    [me?.id, addMessage, replaceOptimistic, markStatus, socket],
  );

  return { send };
}