import prisma from '../../../infrastructure/database/prismaClient';

interface UpdateMessageInput {
  messageId: number;
  content: string;
}

export const updateMessage = async ({ messageId, content }: UpdateMessageInput) => {
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content },
  });

  return updated;
};
