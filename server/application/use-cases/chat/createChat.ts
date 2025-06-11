import prisma from "../../../infrastructure/database/prismaClient";
import { createChatSchema } from "../../../validation/chatSchemas";

interface CreateChatInput {
  participantIds: number[];
  name?: string;
}

export const createChat = async (data: CreateChatInput) => {
  const { participantIds, name } = createChatSchema.parse(data);

  if (participantIds.length < 2) {
    throw new Error("Минимум два участника для создания чата");
  }

  const isGroup = participantIds.length > 2 || !!name;

  // Проверка на существующий приватный чат
  if (!isGroup) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: participantIds },
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
        create: participantIds.map((id) => ({ userId: id })),
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
