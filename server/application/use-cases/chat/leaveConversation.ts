import prisma from '../../../infrastructure/database/prismaClient.ts';

interface LeaveConversationInput {
  conversationId: number;
  userId: number;
}

export const leaveConversation = async ({ conversationId, userId }: LeaveConversationInput) => {
  await prisma.participant.deleteMany({
    where: {
      conversationId,
      userId,
    },
  });
};
