import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";
import { deleteConversationIfEmpty } from "./deleteConversationIfEmpty.ts";

interface LeaveConversationInput {
  conversationId: number;
  userId: number;
  requestedById: number;
}

export const leaveConversation = async ({
  conversationId,
  userId,
  requestedById,
}: LeaveConversationInput) => {
  try {
    const participant = await prisma.participant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new Error("Пользователь не является участником этого чата");
    }

    if (requestedById !== userId) {
      const requester = await prisma.participant.findFirst({
        where: { conversationId, userId: requestedById },
      });

      if (!requester || !["admin", "owner"].includes(requester.role)) {
        throw new Error("Недостаточно прав для удаления участника");
      }

      if (participant.role === "owner") {
        throw new Error("Нельзя удалить владельца чата");
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.participant.delete({ where: { id: participant.id } });

      if (participant.role === "owner") {
        const next = await tx.participant.findFirst({
          where: { conversationId },
          orderBy: { joinedAt: "asc" },
        });

        if (next) {
          await tx.participant.update({
            where: { id: next.id },
            data: { role: "owner" },
          });
        }
      }
    });

    const io = getIO();
    io.to(String(conversationId)).emit("participant:removed", {
      conversationId,
      userId,
      removedBy: requestedById,
    });

    const conversationDeleted = await deleteConversationIfEmpty(conversationId);

    return { conversationDeleted };
  } catch (error) {
    console.error("❌ Ошибка при выходе из чата:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось выйти из чата");
  }
};
