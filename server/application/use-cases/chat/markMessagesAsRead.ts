import prisma from "../../../infrastructure/database/prismaClient.ts";

interface MarkAsReadInput {
  conversationId: number;
  userId: number;
}

export const markMessagesAsRead = async ({ conversationId, userId }: MarkAsReadInput) => {
  const updated = await prisma.message.updateMany({
    where: {
      conversationId,
      isDelivered: true,
      isRead: false,
      isDeleted: false,
      NOT: {
        senderId: userId,
      },
    },
    data: {
      isRead: true,
    },
  });

  return updated.count;
};
