import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

interface AddReactionInput {
  userId: number;
  messageId: number;
  emoji: string;
}

export const addOrUpdateReaction = async ({ userId, messageId, emoji }: AddReactionInput) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, isDeleted: true, conversationId: true },
    });

    if (!message || message.isDeleted) {
      throw new Error("Сообщение не найдено или было удалено");
    }

    const isParticipant = await prisma.participant.findFirst({
      where: {
        conversationId: message.conversationId,
        userId,
      },
    });

    if (!isParticipant) {
      throw new Error("Вы не можете взаимодействовать с этим сообщением");
    }

    const existing = await prisma.reaction.findFirst({
      where: { userId, messageId },
    });

    let toggledOn = true;

    if (existing) {
      if (existing.emoji === emoji) {
        await prisma.reaction.delete({ where: { id: existing.id } });
        toggledOn = false;
      } else {
        await prisma.reaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
      }
    } else {
      await prisma.reaction.create({
        data: {
          userId,
          messageId,
          emoji,
        },
      });
    }

    const groupedReactions = await prisma.reaction.groupBy({
      by: ["emoji"],
      where: { messageId },
      _count: true,
    });

    const io = getIO();

    io.to(String(message.conversationId)).emit("message:reaction", {
      conversationId: message.conversationId,
      messageId,
      emoji,
      userId,
      toggledOn,
    });

    io.to(String(message.conversationId)).emit("reaction:updated", {
      conversationId: message.conversationId,
      messageId,
      groupedReactions: groupedReactions.map((r) => ({
        emoji: r.emoji,
        count: r._count,
      })),
    });

    return { toggledOn };
  } catch (error) {
    console.error("❌ Ошибка при добавлении/обновлении реакции:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось обработать реакцию");
  }
};
