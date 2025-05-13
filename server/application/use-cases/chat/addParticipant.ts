import prisma from '../../../infrastructure/database/prismaClient.ts';

interface AddParticipantInput {
  conversationId: number;
  userId: number;
}

export const addParticipant = async ({ conversationId, userId }: AddParticipantInput) => {
  return prisma.participant.create({
    data: {
      conversationId,
      userId,
    },
  });
};
