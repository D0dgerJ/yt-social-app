import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

interface UpdateMessageInput {
  messageId?: number;
  clientMessageId?: string | null;
  conversationId?: number;

  userId: number;

  encryptedContent?: string;
  mediaUrl?: string | null;
  mediaType?:
    | "image"
    | "video"
    | "file"
    | "gif"
    | "audio"
    | "text"
    | "sticker"
    | null;
  fileName?: string | null;
  gifUrl?: string | null;
  stickerUrl?: string | null;
  repliedToId?: number | null;
}

export const updateMessage = async (data: UpdateMessageInput) => {
  try {
    const {
      messageId,
      clientMessageId,
      conversationId,
      userId,
      encryptedContent,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
    } = data;

    if (!messageId && !clientMessageId) {
      throw new Error("Нужно указать messageId или clientMessageId");
    }

    const existingMessage = messageId
      ? await prisma.message.findUnique({
          where: { id: messageId },
          include: { conversation: true },
        })
      : await prisma.message.findFirst({
          where: { clientMessageId: clientMessageId ?? undefined, conversationId },
          include: { conversation: true },
        });

    if (!existingMessage) {
      throw new Error("Сообщение не найдено");
    }

    if (clientMessageId && conversationId && existingMessage.conversationId !== conversationId) {
      throw new Error("Неверный чат для данного clientMessageId");
    }

    if (existingMessage.senderId !== userId) {
      throw new Error("Вы не можете редактировать это сообщение");
    }

    if (repliedToId) {
      const repliedTo = await prisma.message.findUnique({
        where: { id: repliedToId },
      });

      if (!repliedTo || repliedTo.conversationId !== existingMessage.conversationId) {
        throw new Error("Ответ на сообщение из другого чата запрещён");
      }
    }

    const updated = await prisma.message.update({
      where: { id: existingMessage.id },
      data: {
        encryptedContent:
          encryptedContent !== undefined
            ? encryptedContent
            : existingMessage.encryptedContent,
        mediaUrl: mediaUrl !== undefined ? mediaUrl : existingMessage.mediaUrl,
        mediaType: mediaType !== undefined ? mediaType : existingMessage.mediaType,
        fileName: fileName !== undefined ? fileName : existingMessage.fileName,
        gifUrl: gifUrl !== undefined ? gifUrl : existingMessage.gifUrl,
        stickerUrl:
          stickerUrl !== undefined ? stickerUrl : existingMessage.stickerUrl,
        repliedToId:
          repliedToId !== undefined ? repliedToId : existingMessage.repliedToId,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: { id: true, username: true, profilePicture: true },
        },
        repliedTo: {
          select: {
            id: true,
            encryptedContent: true,
            senderId: true,
            mediaUrl: true,
            mediaType: true,
            fileName: true,    
            isDeleted: true,  
            sender: {   
              select: { id: true, username: true, profilePicture: true },
            },
          },
        },
        mediaFiles: {
          select: { id: true, url: true, type: true, uploadedAt: true },
        },
      },
    });

    getIO().to(String(existingMessage.conversationId)).emit("messageUpdated", updated);

    return updated;
  } catch (error) {
    console.error("❌ Ошибка при обновлении сообщения:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Не удалось обновить сообщение");
  }
};
