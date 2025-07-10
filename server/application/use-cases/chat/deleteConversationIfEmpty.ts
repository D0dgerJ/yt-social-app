import prisma from '../../../infrastructure/database/prismaClient.ts';

/**
 * Удаляет чат и связанные с ним сообщения, если в нём больше не осталось участников.
 * @param conversationId ID чата
 * @returns true, если чат был удалён; false, если участники ещё есть
 */
export const deleteConversationIfEmpty = async (conversationId: number): Promise<boolean> => {
  try {
    const participantCount = await prisma.participant.count({
      where: { conversationId },
    });

    if (participantCount === 0) {
      // Удаляем все связанные сообщения
      await prisma.message.deleteMany({
        where: { conversationId },
      });

      // Удаляем сам чат
      await prisma.conversation.delete({
        where: { id: conversationId },
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Ошибка при попытке удалить чат ${conversationId}:`, error);
    return false;
  }
};
