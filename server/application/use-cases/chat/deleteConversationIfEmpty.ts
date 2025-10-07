import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

export const deleteConversationIfEmpty = async (conversationId: number): Promise<boolean> => {
  try {
    const participantCount = await prisma.participant.count({
      where: { conversationId },
    });

    if (participantCount > 0) return false;

    await prisma.$transaction(async (tx) => {
      const messages = await tx.message.findMany({
        where: { conversationId },
        select: { id: true },
      });

      const messageIds = messages.map(m => m.id);

      if (messageIds.length > 0) {
        await tx.reaction.deleteMany({
          where: { messageId: { in: messageIds } },
        });

        await tx.mediaFile.deleteMany({
          where: { messageId: { in: messageIds } },
        });

        await tx.report.deleteMany({
          where: { messageId: { in: messageIds } },
        });

        await tx.messageDelivery.deleteMany({
          where: { messageId: { in: messageIds } },
        });

        await tx.message.deleteMany({
          where: { id: { in: messageIds } },
        });
      }

      await tx.conversation.delete({
        where: { id: conversationId },
      });
    });

    const io = getIO();
    io.to(String(conversationId)).emit("chat:deleted", { conversationId });

    console.log(`🗑️ Чат ${conversationId} удалён, участников не осталось.`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при удалении пустого чата ${conversationId}:`, error);
    return false;
  }
};
