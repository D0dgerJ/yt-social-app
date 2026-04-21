import prisma from "../../../infrastructure/database/prismaClient.js";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.js";

interface RegisterMessageViewInput {
  messageId: number;
  userId: number;
}

export const registerMessageView = async ({
  messageId,
  userId,
}: RegisterMessageViewInput) => {
  try {
    // Anti-abuse: санкции + rate limit на регистрации просмотров
    await assertActionAllowed({ actorId: userId, action: "MESSAGE_VIEW" });

    return await prisma.$transaction(async (tx) => {
      const msg = await tx.message.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          conversationId: true,
          isDeleted: true,
          isEphemeral: true,
          maxViewsPerUser: true,
        },
      });

      if (!msg || msg.isDeleted) {
        throw new Error("Message not found");
      }

      const participant = await tx.participant.findFirst({
        where: { conversationId: msg.conversationId, userId },
        select: { id: true },
      });

      if (!participant) {
        throw new Error("No access to this message");
      }

      if (!msg.isEphemeral || msg.maxViewsPerUser == null) {
        return {
          removed: false,
          remainingViews: null,
        };
      }

      const existing = await tx.messageView.findUnique({
        where: {
          messageId_userId: { messageId, userId },
        },
      });

      const prevCount = existing?.viewCount ?? 0;

      if (prevCount >= msg.maxViewsPerUser) {
        return {
          removed: true,
          remainingViews: 0,
        };
      }

      const newCount = prevCount + 1;

      if (!existing) {
        await tx.messageView.create({
          data: {
            messageId,
            userId,
            viewCount: newCount,
            lastViewedAt: new Date(),
          },
        });
      } else {
        await tx.messageView.update({
          where: { id: existing.id },
          data: {
            viewCount: newCount,
            lastViewedAt: new Date(),
          },
        });
      }

      const remaining = Math.max(0, msg.maxViewsPerUser - newCount);

      return {
        removed: false,
        remainingViews: remaining,
      };
    });
  } catch (error) {
    console.error("❌ Ошибка при регистрации просмотра сообщения:", error);

    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Failed to register message view");
  }
};