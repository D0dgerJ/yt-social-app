import prisma from "../../../infrastructure/database/prismaClient.ts";
import { sendMessageSchema } from "../../../validation/chatSchemas.ts";

type MediaKind = "image" | "video" | "file" | "gif" | "audio";

function mapMimeToType(mime?: string | null): MediaKind | undefined {
  if (!mime) return;
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return m === "image/gif" ? "gif" : "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  return "file";
}

interface SendMessageInput {
  conversationId: number;
  encryptedContent?: string | null;
  senderId: number;

  attachments?: Array<{
    url: string;
    mime: string;
    name?: string;
    size?: number;
    type?: MediaKind;
  }>;

  mediaUrl?: string | null;
  mediaType?: MediaKind | "text" | "sticker" | null;
  fileName?: string;
  gifUrl?: string | null;
  stickerUrl?: string | null;

  repliedToId?: number | null;
  clientMessageId?: string | null;

  ttlSeconds?: number | null;
  maxViewsPerUser?: number | null;
}

export const sendMessage = async (rawInput: SendMessageInput) => {
  try {
    const data = sendMessageSchema.parse(rawInput);

    const {
      conversationId,
      senderId,
      encryptedContent,
      attachments: attachmentsIn,
      mediaUrl: legacyMediaUrl,
      mediaType: legacyMediaType,
      fileName: legacyFileName,
      gifUrl,
      stickerUrl,
      repliedToId,

      ttlSeconds,
      maxViewsPerUser,
    } = data;

    const clientMessageId = rawInput.clientMessageId ?? null;

    const isParticipant = await prisma.participant.findFirst({
      where: { conversationId, userId: senderId },
      select: { id: true },
    });
    if (!isParticipant) {
      throw new Error("Вы не являетесь участником этого чата");
    }

    if (repliedToId) {
      const original = await prisma.message.findUnique({
        where: { id: repliedToId },
        select: { id: true, conversationId: true },
      });
      if (!original || original.conversationId !== conversationId) {
        throw new Error("Ответ на сообщение из другого чата запрещён");
      }
    }

    let attachments =
      (attachmentsIn && attachmentsIn.length ? attachmentsIn : undefined) ?? [];

    if (attachments.length === 0 && legacyMediaUrl) {
      const guessed = mapMimeToType((rawInput as any).mime ?? undefined);
      attachments = [
        {
          url: legacyMediaUrl,
          mime: "application/octet-stream",
          name: legacyFileName,
          type: (legacyMediaType as MediaKind) ?? guessed ?? "file",
        },
      ];
    }

    if (
      legacyMediaType &&
      legacyMediaType !== "text" &&
      !legacyMediaUrl &&
      attachments.length === 0
    ) {
      throw new Error("Для mediaType требуется mediaUrl");
    }

    const first = attachments[0];
    const messageMediaUrl = first?.url ?? legacyMediaUrl ?? null;
    const messageMediaType =
      (first?.type ?? (legacyMediaType as MediaKind | null)) ?? null;
    const messageFileName = first?.name ?? legacyFileName ?? null;

    const now = new Date();

    let expiresAt: Date | null = null;
    if (ttlSeconds && ttlSeconds > 0) {
      expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    }

    const normalizedMaxViewsPerUser =
      maxViewsPerUser && maxViewsPerUser > 0 ? maxViewsPerUser : null;

    const isEphemeral =
      (ttlSeconds != null && ttlSeconds > 0) ||
      (normalizedMaxViewsPerUser != null && normalizedMaxViewsPerUser > 0);

    try {
      const message = await prisma.$transaction(async (tx) => {
        const created = await tx.message.create({
          data: {
            clientMessageId,
            conversationId,
            senderId,
            encryptedContent: encryptedContent ?? null,

            mediaUrl: messageMediaUrl,
            mediaType: messageMediaType,
            fileName: messageFileName,

            gifUrl: gifUrl ?? null,
            stickerUrl: stickerUrl ?? null,
            repliedToId: repliedToId ?? null,

            isEphemeral,
            expiresAt,
            maxViewsPerUser: normalizedMaxViewsPerUser,
          },
          include: {
            sender: {
              select: { id: true, username: true, profilePicture: true },
            },
            repliedTo: {
              select: {
                id: true,
                senderId: true,
                encryptedContent: true,
                mediaUrl: true,
                mediaType: true,
                fileName: true,
                isDeleted: true,
                sender: {
                  select: {
                    id: true,
                    username: true,
                    profilePicture: true,
                  },
                },
              },
            },
          },
        });

        if (attachments.length > 0) {
          const rows = attachments.slice(0, 10).map((a) => ({
            url: a.url,
            type: (a.type ?? mapMimeToType(a.mime) ?? "file") as MediaKind,
            uploaderId: senderId,
            messageId: created.id,

            originalName: a.name ?? null,
            mime: a.mime ?? null,
            size: a.size ?? null,
          }));

          await Promise.all(rows.map((r) => tx.mediaFile.create({ data: r })));
        } else if (messageMediaType && messageMediaUrl) {
          await tx.mediaFile.create({
            data: {
              url: messageMediaUrl,
              type: messageMediaType as MediaKind,
              uploaderId: senderId,
              messageId: created.id,

              originalName: messageFileName ?? null,
              mime: (rawInput as any).mime ?? null,
              size: (rawInput as any).size ?? null,
            },
          });
        }

        await tx.conversation.update({
          where: { id: conversationId },
          data: { lastMessageId: created.id, updatedAt: now },
        });

        const withRelations = await tx.message.findUnique({
          where: { id: created.id },
          include: {
            sender: {
              select: { id: true, username: true, profilePicture: true },
            },
            repliedTo: {
              select: {
                id: true,
                senderId: true,
                encryptedContent: true,
                mediaUrl: true,
                mediaType: true,
                fileName: true,
                isDeleted: true,
                sender: {
                  select: {
                    id: true,
                    username: true,
                    profilePicture: true,
                  },
                },
              },
            },
            mediaFiles: {
              select: {
                id: true,
                url: true,
                type: true,
                uploadedAt: true,

                originalName: true,
                mime: true,
                size: true,
              },
            },
          },
        });

        if (!withRelations) {
          throw new Error("Не удалось получить созданное сообщение");
        }

        return {
          ...withRelations,
          content: withRelations.encryptedContent,
        };
      });

      return message;
    } catch (e: any) {
      const isP2002 = typeof e?.code === "string" && e.code === "P2002";
      if (isP2002 && clientMessageId) {
        const existing = await prisma.message.findUnique({
          where: { clientMessageId },
          include: {
            sender: {
              select: { id: true, username: true, profilePicture: true },
            },
            repliedTo: {
              select: {
                id: true,
                senderId: true,
                encryptedContent: true,
                mediaUrl: true,
                mediaType: true,
                fileName: true,
                isDeleted: true,
                sender: {
                  select: {
                    id: true,
                    username: true,
                    profilePicture: true,
                  },
                },
              },
            },
            mediaFiles: {
              select: {
                id: true,
                url: true,
                type: true,
                uploadedAt: true,

                originalName: true,
                mime: true,
                size: true,
              },
            },
          },
        });

        if (existing) {
          return {
            ...existing,
            content: existing.encryptedContent,
          };
        }
      }

      throw e;
    }
  } catch (error) {
    console.error("❌ Ошибка при отправке сообщения:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось отправить сообщение");
  }
};
