import prisma from '../../../infrastructure/database/prismaClient.ts';

interface SendMessageInput {
  conversationId: number;
  senderId: number;
  content: string;
}

export const sendMessage = async ({ conversationId, senderId, content }: SendMessageInput) => {
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
    },
  });

  return message;
};
