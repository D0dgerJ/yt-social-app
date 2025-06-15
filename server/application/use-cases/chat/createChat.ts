import prisma from "../../../infrastructure/database/prismaClient.ts";
import { createChatSchema } from "../../../validation/chatSchemas.ts";

interface CreateChatInput {
  userIds: number[];
  name?: string;
}

export const createChat = async (data: CreateChatInput) => {
  console.log('[createChat] Входные данные:', data);

   const { userIds, name } = createChatSchema.parse(data);

  console.log('[createChat] После валидации:', userIds, name);

  if (userIds.length < 2) {
    throw new Error("Минимум два участника для создания чата");
  }

  const isGroup = userIds.length > 2 || !!name;

  // Проверка на существующий приватный чат
  if (!isGroup) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: userIds },
          },
        },
      },
      include: { participants: true },
    });

    if (existing) return existing;
  }

  const conversation = await prisma.conversation.create({
    data: {
      name: isGroup ? name : null,
      isGroup,
      participants: {
        create: userIds.map((id) => ({ userId: id })),
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
  });

  return conversation;
};
