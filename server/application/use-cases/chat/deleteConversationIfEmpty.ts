import prisma from '../../../infrastructure/database/prismaClient.ts';

export const deleteConversationIfEmpty = async (conversationId: number): Promise<boolean> => {
  const count = await prisma.participant.count({
    where: { conversationId },
  });

  if (count === 0) {
    await prisma.message.deleteMany({ where: { conversationId } });
    await prisma.conversation.delete({
      where: { id: conversationId },
    });
    return true;
  }

  return false;
};
