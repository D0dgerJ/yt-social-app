import prisma from "../../../infrastructure/database/prismaClient.js";
import { getIO } from "../../../infrastructure/websocket/socket.js";
import { Errors, ApiError } from "../../../infrastructure/errors/ApiError.js";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.js";

interface DeleteMessageInput {
  messageId: number;
  userId: number;
}

export const deleteMessage = async ({ messageId, userId }: DeleteMessageInput) => {
  try {
    if (!Number.isFinite(messageId) || messageId <= 0) {
      throw Errors.validation("Invalid messageId");
    }

    if (!Number.isFinite(userId) || userId <= 0) {
      throw Errors.validation("Invalid userId");
    }

    await assertActionAllowed({ actorId: userId, action: "MESSAGE_DELETE" });

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        conversationId: true,
      },
    });

    if (!message) {
      throw Errors.notFound("Message not found");
    }

    if (message.senderId !== userId) {
      throw Errors.forbidden("You cannot delete this message");
    }

    const softDeleted = await prisma.message.update({
      where: { id: messageId },
      data: {
        encryptedContent: null,
        mediaUrl: null,
        mediaType: null,
        fileName: null,
        gifUrl: null,
        stickerUrl: null,
        audioText: null,
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    const conversation = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
      select: { lastMessageId: true },
    });

    if (conversation?.lastMessageId === messageId) {
      const previous = await prisma.message.findFirst({
        where: {
          conversationId: message.conversationId,
          isDeleted: false,
          id: { lt: messageId },
        },
        orderBy: { id: "desc" },
        select: { id: true },
      });

      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: {
          lastMessageId: previous?.id ?? null,
          updatedAt: new Date(),
        },
      });
    }

    getIO().to(String(message.conversationId)).emit("message:delete", {
      conversationId: message.conversationId,
      messageId: softDeleted.id,
    });

    return softDeleted;
  } catch (error) {
    console.error("❌ Ошибка при удалении сообщения:", error);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error) throw Errors.internal(error.message);
    throw Errors.internal("Failed to delete message");
  }
};