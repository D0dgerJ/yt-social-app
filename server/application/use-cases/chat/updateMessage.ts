import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

interface UpdateMessageInput {
  messageId: number;
  userId: number;
  encryptedContent?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker' | null;
  fileName?: string | null;
  gifUrl?: string | null;
  stickerUrl?: string | null;
  repliedToId?: number | null;
}

export const updateMessage = async (data: UpdateMessageInput) => {
  try {
    const {
      messageId,
      userId,
      encryptedContent,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
    } = data;

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!existingMessage) {
      throw new Error("Сообщение не найдено");
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
      where: { id: messageId },
      data: {
        encryptedContent: encryptedContent ?? existingMessage.encryptedContent,
        mediaUrl: mediaUrl ?? existingMessage.mediaUrl,
        mediaType: mediaType ?? existingMessage.mediaType,
        fileName: fileName ?? existingMessage.fileName,
        gifUrl: gifUrl ?? existingMessage.gifUrl,
        stickerUrl: stickerUrl ?? existingMessage.stickerUrl,
        repliedToId: repliedToId ?? existingMessage.repliedToId,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        repliedTo: {
          select: {
            id: true,
            encryptedContent: true,
            senderId: true,
            mediaUrl: true,
            mediaType: true,
          },
        },
        mediaFiles: {
          select: {
            id: true,
            url: true,
            type: true,
            uploadedAt: true,
          },
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
