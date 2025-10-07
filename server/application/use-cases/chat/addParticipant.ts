import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

interface AddParticipantInput {
  conversationId: number;
  userId: number;
  addedById: number;
  role?: "member" | "admin" | "owner";
}

export const addParticipant = async ({
  conversationId,
  userId,
  addedById,
  role = "member",
}: AddParticipantInput) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new Error("Чат не найден");
    }

    const addedBy = conversation.participants.find(p => p.userId === addedById);
    if (!addedBy || !["admin", "owner"].includes(addedBy.role)) {
      throw new Error("У вас нет прав добавлять участников");
    }

    const existing = await prisma.participant.findFirst({
      where: { conversationId, userId },
    });
    if (existing) {
      throw new Error("Пользователь уже участвует в чате");
    }
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

    const io = getIO();
    io.to(String(conversationId)).emit("participant:added", {
      conversationId,
      participant,
    });

    return participant;
  } catch (error) {
    console.error("❌ Ошибка при добавлении участника:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось добавить участника");
  }
};
