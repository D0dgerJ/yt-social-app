import prisma from "../../../infrastructure/database/prismaClient.js";

interface SetMessagePinnedInput {
  userId: number;
  messageId?: number;
  clientMessageId?: string | null;
  conversationId?: number;
}

const resolveMessage = async ({
  messageId,
  clientMessageId,
  conversationId,
}: {
  messageId?: number;
  clientMessageId?: string | null;
  conversationId?: number;
}) => {
  if (messageId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
        isDeleted: true,
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    return message;
  }

  if (clientMessageId && conversationId) {
    const message = await prisma.message.findFirst({
      where: {
        conversationId,
        clientMessageId,
      },
      select: {
        id: true,
        conversationId: true,
        isDeleted: true,
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    return message;
  }

  throw new Error(
    "You must provide messageId or the pair clientMessageId + conversationId",
  );
};

export const pinMessage = async ({
  userId,
  messageId,
  clientMessageId,
  conversationId,
}: SetMessagePinnedInput) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const resolved = await resolveMessage({
      messageId,
      clientMessageId,
      conversationId,
    });

    if (resolved.isDeleted) {
      throw new Error("Cannot pin a deleted message");
    }

    const convId = resolved.conversationId;

    const participant = await prisma.participant.findFirst({
      where: {
        userId,
        conversationId: convId,
      },
      select: { id: true },
    });

    if (!participant) {
      throw new Error("You are not a participant in this chat");
    }

    const now = new Date();

    const pinned = await prisma.pinnedMessage.upsert({
      where: {
        conversationId_messageId: {
          conversationId: convId,
          messageId: resolved.id,
        },
      },
      update: {
        pinnedAt: now,
        pinnedById: userId,
      },
      create: {
        conversationId: convId,
        messageId: resolved.id,
        pinnedById: userId,
        pinnedAt: now,
      },
    });

    return {
      conversationId: pinned.conversationId,
      messageId: pinned.messageId,
      pinnedById: pinned.pinnedById,
      isPinned: true,
      pinnedAt: pinned.pinnedAt,
    };
  } catch (error) {
    console.error("❌ Ошибка при закреплении сообщения:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Failed to pin message");
  }
};

export const unpinMessage = async ({
  userId,
  messageId,
  clientMessageId,
  conversationId,
}: SetMessagePinnedInput) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const resolved = await resolveMessage({
      messageId,
      clientMessageId,
      conversationId,
    });

    const convId = resolved.conversationId;

    const participant = await prisma.participant.findFirst({
      where: {
        userId,
        conversationId: convId,
      },
      select: { id: true },
    });

    if (!participant) {
      throw new Error("You are not a participant in this chat");
    }

    await prisma.pinnedMessage.deleteMany({
      where: {
        conversationId: convId,
        messageId: resolved.id,
      },
    });

    return {
      conversationId: convId,
      messageId: resolved.id,
      isPinned: false,
      pinnedAt: null as Date | null,
    };
  } catch (error) {
    console.error("❌ Ошибка при откреплении сообщения:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Failed to unpin message");
  }
};
