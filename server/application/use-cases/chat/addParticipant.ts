import prisma from "../../../infrastructure/database/prismaClient.js";
import { getIO } from "../../../infrastructure/websocket/socket.js";
import { createNotification } from "../notification/createNotification.js";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.js";

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
    // Anti-abuse: санкции + лимит инвайтов
    await assertActionAllowed({ actorId: addedById, action: "CHAT_INVITE" });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new Error("Chat not found");
    }

    const addedBy = conversation.participants.find((p) => p.userId === addedById);
    if (!addedBy || !["admin", "owner"].includes(addedBy.role)) {
      throw new Error("You do not have permission to add participants");
    }

    const existing = await prisma.participant.findFirst({
      where: { conversationId, userId },
    });
    if (existing) {
      throw new Error("User is already a participant in this chat");
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

    try {
      await createNotification({
        fromUserId: addedById,
        toUserId: userId,
        type: "added_to_conversation",
        payload: {
          conversationId,
          conversationName: conversation.name ?? null,
        },
      });
    } catch (notifError) {
      console.error(
        "❌ Ошибка при создании уведомления added_to_conversation:",
        notifError,
      );
    }

    return participant;
  } catch (error) {
    console.error("❌ Ошибка при добавлении участника:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Failed to add participant");
  }
};