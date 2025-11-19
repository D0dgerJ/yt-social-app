import prisma from "../../../infrastructure/database/prismaClient.ts";

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
      throw new Error("Сообщение не найдено");
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
      throw new Error("Сообщение не найдено");
    }

    return message;
  }

  throw new Error(
    "Нужно указать messageId или пару clientMessageId + conversationId",
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
      throw new Error("Пользователь не найден");
    }

    const resolved = await resolveMessage({
      messageId,
      clientMessageId,
      conversationId,
    });

    if (resolved.isDeleted) {
      throw new Error("Нельзя закрепить удалённое сообщение");
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
      throw new Error("Вы не являетесь участником этого чата");
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

    throw new Error("Не удалось закрепить сообщение");
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
      throw new Error("Пользователь не найден");
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
      throw new Error("Вы не являетесь участником этого чата");
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

    throw new Error("Не удалось открепить сообщение");
  }
};
