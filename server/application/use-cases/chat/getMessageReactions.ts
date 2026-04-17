import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors, ApiError } from "../../../infrastructure/errors/ApiError.js";

interface GroupedReaction {
  emoji: string;
  count: number;
  users: {
    id: number;
    username: string;
    profilePicture: string | null;
  }[];
  isMyReaction?: boolean;
}

interface GetMessageReactionsInput {
  messageId: number;
  userId?: number;
}

export const getMessageReactions = async ({
  messageId,
  userId,
}: GetMessageReactionsInput): Promise<GroupedReaction[]> => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, isDeleted: true, conversationId: true },
    });

    if (!message || message.isDeleted) {
      throw Errors.notFound("Message not found");
    }

    if (userId) {
      const participant = await prisma.participant.findFirst({
        where: {
          conversationId: message.conversationId,
          userId,
        },
        select: { id: true },
      });

      if (!participant) {
        throw Errors.forbidden("Forbidden");
      }
    }

    const reactions = await prisma.reaction.findMany({
      where: { messageId },
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

    if (reactions.length === 0) return [];

    const groupedMap = new Map<string, GroupedReaction>();

    for (const { emoji, user } of reactions) {
      const userInfo = {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
      };

      if (!groupedMap.has(emoji)) {
        groupedMap.set(emoji, {
          emoji,
          count: 1,
          users: [userInfo],
          isMyReaction: userId ? userId === user.id : undefined,
        });
      } else {
        const group = groupedMap.get(emoji)!;
        group.count++;
        group.users.push(userInfo);

        if (userId && user.id === userId) {
          group.isMyReaction = true;
        }
      }
    }

    return Array.from(groupedMap.values()).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("❌ Ошибка при получении реакций:", error);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error) throw Errors.internal(error.message);
    throw Errors.internal("Failed to get message reactions");
  }
};