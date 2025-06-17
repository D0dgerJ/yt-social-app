import prisma from "../../../infrastructure/database/prismaClient.ts";
import { createChatSchema } from "../../../validation/chatSchemas.ts";

interface CreateChatInput {
  userIds: number[];
  name?: string;
  creatorId: number;
}

export const createChat = async (data: CreateChatInput) => {
  const { userIds, name, creatorId } = createChatSchema.parse(data);

  if (!userIds.includes(creatorId)) {
    userIds.push(creatorId);
  }

  if (userIds.length < 2) {
    throw new Error("Минимум два участника для создания чата");
  }

  const isGroup = userIds.length > 2 || !!name;

  // 🔁 Проверка на существующий личный чат
  if (!isGroup) {
    const existing = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        participants: {
          some: { userId: userIds[0] },
        },
      },
      include: {
        participants: true,
      },
    });

    const found = existing.find(conv => {
      const ids = conv.participants.map(p => p.userId).sort();
      return ids.length === 2 && ids[0] === userIds[0] && ids[1] === userIds[1];
    });

    if (found) return found;
  }

  // 🆕 Создаём чат
  const conversation = await prisma.conversation.create({
    data: {
      name: isGroup ? name : null,
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
        include: { user: true },
      },
    },
  });

  return conversation;
};
