import prisma from "../../../infrastructure/database/prismaClient.js";
import { getIO } from "../../../infrastructure/websocket/socket.js";
import { Errors, ApiError } from "../../../infrastructure/errors/ApiError.js";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.js";

interface UpdateMessageInput {
  messageId?: number;
  clientMessageId?: string | null;
  conversationId?: number;

  userId: number;

  content?: string | null;
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
      content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
    } = data;

    if (!Number.isFinite(userId) || userId <= 0) {
      throw Errors.validation("Invalid userId");
    }

    await assertActionAllowed({ actorId: userId, action: "MESSAGE_UPDATE" });

    if (!messageId && !clientMessageId) {
      throw Errors.validation("messageId or clientMessageId is required");
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
      throw Errors.notFound("Message not found");
    }

    if (
      clientMessageId &&
      conversationId &&
      existingMessage.conversationId !== conversationId
    ) {
      throw Errors.validation("Invalid conversation for this clientMessageId");
    }

    if (existingMessage.senderId !== userId) {
      throw Errors.forbidden("You cannot edit this message");
    }

    if (repliedToId) {
      const repliedTo = await prisma.message.findUnique({
        where: { id: repliedToId },
        select: { id: true, conversationId: true },
      });

      if (!repliedTo || repliedTo.conversationId !== existingMessage.conversationId) {
        throw Errors.validation("Replying to a message from another chat is not allowed");
      }
    }

    const updated = await prisma.message.update({
      where: { id: existingMessage.id },
      data: {
        encryptedContent:
          content !== undefined ? content : existingMessage.encryptedContent,
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

    const response = {
      ...updated,
      content: updated.encryptedContent ?? null,
      repliedTo: updated.repliedTo
        ? {
            ...updated.repliedTo,
            content: updated.repliedTo.encryptedContent ?? null,
          }
        : null,
    };

    getIO()
      .to(String(existingMessage.conversationId))
      .emit("messageUpdated", response);

    return response;
  } catch (error) {
    console.error("❌ Ошибка при обновлении сообщения:", error);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error) throw Errors.internal(error.message);
    throw Errors.internal("Failed to update message");
  }
};