import prisma from '../../../infrastructure/database/prismaClient.ts';

interface AddParticipantInput {
  conversationId: number;
  userId: number;
  role?: 'member' | 'admin' | 'owner'; // по умолчанию — member
}

export const addParticipant = async ({
  conversationId,
  userId,
  role = 'member',
}: AddParticipantInput) => {
  try {
    // 🔍 Проверка существования чата
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error("Чат не найден");
    }

    // 👥 Проверка: не добавлен ли уже
    const isAlreadyParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (isAlreadyParticipant) {
      throw new Error("Пользователь уже участвует в чате");
    }

    // ➕ Добавление участника
    const participant = await prisma.participant.create({
      data: {
        conversationId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    // (Опционально) WebSocket уведомление другим участникам чата
    // getIO().to(String(conversationId)).emit("participantAdded", participant);

    return participant;
  } catch (error) {
    console.error("❌ Ошибка при добавлении участника:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Не удалось добавить участника");
  }
};
