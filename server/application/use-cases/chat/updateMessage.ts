import prisma from '../../../infrastructure/database/prismaClient';

interface UpdateMessageInput {
  messageId: number;
  text: string;
}

export const updateMessage = async ({ messageId, text }: UpdateMessageInput) => {
  return prisma.message.update({
    where: { id: messageId },
    data: { text },
  });
};
