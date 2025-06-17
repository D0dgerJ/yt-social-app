import prisma from "../../../infrastructure/database/prismaClient.ts";

interface UpdateMessageInput {
  messageId: number;
  userId: number;

  content?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker' | null;
  fileName?: string | null;
  gifUrl?: string | null;
  stickerUrl?: string | null;
  repliedToId?: number | null;
}

export const updateMessage = async (data: UpdateMessageInput) => {
  const {
    messageId,
    userId,
    content,
    mediaUrl,
    mediaType,
    fileName,
    gifUrl,
    stickerUrl,
    repliedToId,
  } = data;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) throw new Error("Сообщение не найдено");
  if (message.senderId !== userId) throw new Error("Вы не можете редактировать это сообщение");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
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
    },
  });

  return updated;
};
