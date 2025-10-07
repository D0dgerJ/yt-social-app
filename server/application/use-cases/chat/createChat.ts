import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";
import { createChatSchema } from "../../../validation/chatSchemas.ts";

interface CreateChatInput {
  userIds: number[];
  name?: string;
  creatorId: number;
}

export const createChat = async (data: CreateChatInput) => {
  try {
    const { userIds: rawUserIds, name, creatorId } = createChatSchema.parse(data);

    const userIds = Array.from(new Set([...rawUserIds, creatorId])).sort();

    if (userIds.length < 2) {
      throw new Error("Нужно как минимум два участника для создания чата");
    }

    const isGroup = userIds.length > 2 || !!name;

    if (!isGroup) {
      const [userA, userB] = userIds;

      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              OR: [{ userId: userA }, { userId: userB }],
            },
          },
        },
        include: {
          participants: { include: { user: true } },
        },
      });

      if (existing) return existing;
    }

    const [conversation] = await prisma.$transaction([
      prisma.conversation.create({
        data: {
          name: isGroup ? name || "Групповой чат" : null,
          isGroup,
          participants: {
            create: userIds.map(userId => ({
              user: { connect: { id: userId } },
              role: userId === creatorId ? "owner" : "member",
            })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const io = getIO();
    for (const participant of conversation.participants) {
      io.to(String(participant.userId)).emit("chat:created", {
        conversation,
      });
    }

    return conversation;
  } catch (error) {
    console.error("❌ Ошибка при создании чата:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось создать чат");
  }
};
