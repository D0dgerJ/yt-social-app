import prisma from "../../../infrastructure/database/prismaClient.ts";
import { sendMessageSchema } from "../../../validation/chatSchemas.ts";

interface SendMessageInput {
  conversationId: number;
  encryptedContent?: string;
  senderId: number;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "file" | "gif" | "audio" | "text" | "sticker";
  fileName?: string;
  gifUrl?: string;
  stickerUrl?: string;
  repliedToId?: number;
  clientMessageId?: string | null;
}

export const sendMessage = async (rawInput: SendMessageInput) => {
  try {
    const data = sendMessageSchema.parse(rawInput);

    const {
      conversationId,
      senderId,
      encryptedContent,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
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

    if (mediaType && mediaType !== "text" && !mediaUrl) {
      throw new Error("Для mediaType требуется mediaUrl");
    }

    if (clientMessageId) {
      const existing = await prisma.message.findUnique({
        where: { clientMessageId },
        include: {
          sender: { select: { id: true, username: true, profilePicture: true } },
          repliedTo: {
            select: {
              id: true,
              senderId: true,
              encryptedContent: true,
              mediaUrl: true,
              mediaType: true,
              fileName: true,
              isDeleted: true,
              sender: { select: { id: true, username: true, profilePicture: true } },
            },
          },
          mediaFiles: { select: { id: true, url: true, type: true, uploadedAt: true } },
        },
      });
      if (existing) return existing;
    }

    try {
      const message = await prisma.$transaction(async (tx) => {
        const created = await tx.message.create({
          data: {
            clientMessageId,
            conversationId,
            senderId,
            encryptedContent: encryptedContent ?? null,
            mediaUrl: mediaUrl ?? null,
            mediaType: mediaType ?? null,
            fileName: fileName ?? null,
            gifUrl: gifUrl ?? null,
            stickerUrl: stickerUrl ?? null,
            repliedToId: repliedToId ?? null,
          },
          include: {
            sender: { select: { id: true, username: true, profilePicture: true } },
            repliedTo: {
              select: {
                id: true,
                senderId: true,
                encryptedContent: true,
                mediaUrl: true,
                mediaType: true,
                fileName: true,
                isDeleted: true,
                sender: { select: { id: true, username: true, profilePicture: true } },
              },
            },
          },
        });

        if (mediaType && mediaType !== "text" && mediaUrl) {
          await tx.mediaFile.create({
            data: {
              url: mediaUrl,
              type: mediaType,
              uploaderId: senderId,
              messageId: created.id,
            },
          });
        }

        await tx.conversation.update({
          where: { id: conversationId },
          data: { lastMessageId: created.id, updatedAt: new Date() },
        });

        const withRelations = await tx.message.findUnique({
          where: { id: created.id },
          include: {
            sender: { select: { id: true, username: true, profilePicture: true } },
            repliedTo: {
              select: {
                id: true,
                senderId: true,
                encryptedContent: true,
                mediaUrl: true,
                mediaType: true,
                fileName: true,
                isDeleted: true,
                sender: { select: { id: true, username: true, profilePicture: true } },
              },
            },
            mediaFiles: { select: { id: true, url: true, type: true, uploadedAt: true } },
          },
        });

        if (!withRelations) throw new Error("Не удалось получить созданное сообщение");
        return withRelations;
      });

      return message;
    } catch (e: any) {
      const isP2002 = typeof e?.code === "string" && e.code === "P2002";
      if (isP2002 && clientMessageId) {
        const existing = await prisma.message.findUnique({
          where: { clientMessageId },
          include: {
            sender: { select: { id: true, username: true, profilePicture: true } },
            repliedTo: {
              select: {
                id: true,
                senderId: true,
                encryptedContent: true,
                mediaUrl: true,
                mediaType: true,
                fileName: true,
                isDeleted: true,
                sender: { select: { id: true, username: true, profilePicture: true } },
              },
            },
            mediaFiles: { select: { id: true, url: true, type: true, uploadedAt: true } },
          },
        });
        if (existing) return existing;
      }
      throw e;
    }
  } catch (error) {
    console.error("❌ Ошибка при отправке сообщения:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось отправить сообщение");
  }
};
