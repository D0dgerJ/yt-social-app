import prisma from "../database/prismaClient.ts";

export const cleanupEmptyPosts = async () => {
  try {
    const result = await prisma.post.deleteMany({
      where: {
        desc: null,
        images: { equals: [] },
        videos: { equals: [] },
        files: { equals: [] },
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`🧹 Удалено пустых постов: ${result.count}`);
    }
  } catch (error) {
    console.error("❌ Ошибка при очистке постов:", error);
  }
};
