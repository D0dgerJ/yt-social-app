import prisma from '../../../infrastructure/database/prismaClient.ts';

export const deleteMessage = async (messageId: number) => {
  return prisma.message.delete({
    where: { id: messageId },
  });
};
