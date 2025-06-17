import prisma from "../../../infrastructure/database/prismaClient.ts";

interface MarkDeliveredInput {
  conversationId: number;
  userId: number;
}

export const markMessagesAsDelivered = async ({ conversationId, userId }: MarkDeliveredInput) => {
  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: {
        not: userId,
      },
      isDelivered: false,
      isDeleted: false,
    },
    data: {
      isDelivered: true,
    },
  });

  return { updated: result.count };
};
