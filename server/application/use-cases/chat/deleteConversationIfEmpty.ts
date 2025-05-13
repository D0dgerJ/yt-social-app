import prisma from '../../../infrastructure/database/prismaClient.ts';

export const deleteConversationIfEmpty = async (conversationId: number) => {
  const participants = await prisma.participant.findMany({
    where: { conversationId },
  });

  if (participants.length === 0) {
    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
};
