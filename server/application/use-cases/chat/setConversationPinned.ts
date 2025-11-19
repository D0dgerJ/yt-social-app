import prisma from "../../../infrastructure/database/prismaClient.ts";

interface SetConversationPinnedInput {
  userId: number;
  conversationId: number;
}

export const pinConversation = async ({
  userId,
  conversationId,
}: SetConversationPinnedInput) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    const participant = await prisma.participant.findFirst({
      where: {
        userId,
        conversationId,
      },
      select: { id: true },
    });

    if (!participant) {
      throw new Error("Вы не являетесь участником этого чата");
    }

    const now = new Date();

    const pinned = await prisma.pinnedConversation.upsert({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
      update: {
        pinnedAt: now,
      },
      create: {
        userId,
        conversationId,
        pinnedAt: now,
      },
    });

    return {
      conversationId: pinned.conversationId,
      userId: pinned.userId,
      isPinned: true,
      pinnedAt: pinned.pinnedAt,
    };
  } catch (error) {
    console.error("❌ Ошибка при закреплении чата:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Не удалось закрепить чат");
  }
};

export const unpinConversation = async ({
  userId,
  conversationId,
}: SetConversationPinnedInput) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    const participant = await prisma.participant.findFirst({
      where: {
        userId,
        conversationId,
      },
      select: { id: true },
    });

    if (!participant) {
      throw new Error("Вы не являетесь участником этого чата");
    }

    await prisma.pinnedConversation.deleteMany({
      where: {
        userId,
        conversationId,
      },
    });

    return {
      conversationId,
      userId,
      isPinned: false,
      pinnedAt: null as Date | null,
    };
  } catch (error) {
    console.error("❌ Ошибка при откреплении чата:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Не удалось открепить чат");
  }
};
