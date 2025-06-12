import prisma from "../../../infrastructure/database/prismaClient.ts";

interface MarkDeliveredInput {
  conversationId: number;
  userId: number;
}

export const markMessagesAsDelivered = async ({ conversationId, userId }: MarkDeliveredInput) => {
  const messages = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: {
        not: userId,
      },
      isDelivered: false,
    },
    data: {
      isDelivered: true,
    },
  });

  return messages;
};
