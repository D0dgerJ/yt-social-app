import prisma from "../../../infrastructure/database/prismaClient.ts";
import { createChatSchema } from "../../../validation/chatSchemas.ts";

interface CreateChatInput {
  userIds: number[];
  name?: string;
  creatorId: number;
}

export const createChat = async (data: CreateChatInput) => {
  try {
    const { userIds: rawUserIds, name, creatorId } = createChatSchema.parse(data);

    // Уникализируем и добавляем автора
    const userIds = Array.from(new Set([...rawUserIds, creatorId]));

    if (userIds.length < 2) {
      throw new Error("Нужно как минимум два участника для создания чата");
    }

    const isGroup = userIds.length > 2 || !!name;

    // 🔁 Проверка: если это личный чат, не создавать дубликат
    if (!isGroup) {
      const existing = await prisma.conversation.findMany({
        where: {
          isGroup: false,
          participants: {
            some: { userId: userIds[0] },
          },
        },
        include: { participants: true },
      });

      const found = existing.find(conv => {
        const ids = conv.participants.map(p => p.userId).sort();
        return ids.length === 2 && ids.includes(userIds[0]) && ids.includes(userIds[1]);
      });

      if (found) return found;
    }

    // ✅ Создание нового чата
    const conversation = await prisma.conversation.create({
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
          include: { user: true },
        },
      },
    });

    return conversation;
  } catch (error) {
    console.error("❌ Ошибка при создании чата:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Не удалось создать чат");
  }
};
