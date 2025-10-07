import prisma from "../../../infrastructure/database/prismaClient.ts";

interface MarkDeliveredInput {
  conversationId: number;
  userId: number;
}

export const markMessagesAsDelivered = async ({ conversationId, userId }: MarkDeliveredInput) => {
  try {
    const participant = await prisma.participant.findFirst({
      where: { conversationId, userId },
      select: { id: true },
    });

    if (!participant) {
      throw new Error("Вы не являетесь участником этого чата");
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isDeleted: false,
      },
      select: { id: true },
    });

    if (messages.length === 0) {
      return { updated: 0 };
    }

    const messageIds = messages.map((m) => m.id);

    await prisma.messageDelivery.createMany({
      data: messageIds.map((mid) => ({
        messageId: mid,
        userId,
        status: "delivered",
        timestamp: new Date(),
      })),
      skipDuplicates: true,
    });

    const updated = await prisma.messageDelivery.updateMany({
      where: {
        messageId: { in: messageIds },
        userId,
        status: "sent",
      },
      data: {
        status: "delivered",
        timestamp: new Date(),
      },
    });

    return { updated: updated.count };
  } catch (error) {
    console.error("❌ Ошибка при обновлении delivered:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось обновить статус delivered");
  }
};
