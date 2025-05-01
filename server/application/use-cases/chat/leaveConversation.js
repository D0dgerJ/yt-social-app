import prisma from "../../../infrastructure/database/prismaClient.js";

export const leaveConversation = async ({ userId, conversationId }) => {
  // Удаляем участника из беседы
  await prisma.participant.delete({
    where: {
      userId_conversationId: {
        userId,
        conversationId,
      },
    },
  });

  return { message: "You have left the conversation" };
};
