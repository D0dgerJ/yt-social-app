import prisma from '../../../infrastructure/database/prismaClient.ts';

interface AddParticipantInput {
  conversationId: number;
  userId: number;
  role?: 'member' | 'admin' | 'owner'; // по умолчанию member
}

export const addParticipant = async ({ conversationId, userId, role = 'member' }: AddParticipantInput) => {
  // Проверяем, существует ли чат
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error("Чат не найден");
  }

  // Проверяем, не является ли уже участником
  const existing = await prisma.participant.findFirst({
    where: {
      conversationId,
      userId,
    },
  });

  if (existing) {
    throw new Error("Пользователь уже является участником чата");
  }

  return await prisma.participant.create({
    data: {
      conversationId,
      userId,
      role,
    },
  });
};
