import prisma from "../../../infrastructure/database/prismaClient.js";

export const viewStory = async (userId, storyId) => {
  try {
    await prisma.storyView.upsert({
      where: {
        userId_storyId: {
          userId: Number(userId),
          storyId: Number(storyId),
        },
      },
      update: {}, // ничего не обновляем — просто игнорируем если уже есть
      create: {
        userId: Number(userId),
        storyId: Number(storyId),
      },
    });
  } catch (error) {
    throw new Error("Ошибка при добавлении просмотра: " + error.message);
  }
};
