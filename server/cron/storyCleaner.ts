import prisma from "../infrastructure/database/prismaClient.ts";

export const cleanExpiredStories = async (): Promise<void> => {
  try {
    const now = new Date();
    await prisma.story.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    console.log("🧹 Expired stories cleaned");
  } catch (error) {
    console.error("❌ Error cleaning expired stories:", error);
  }
};

// Очистка раз в неделю (7 дней * 24 часа * 60 минут * 60 секунд * 1000 мс)
setInterval(cleanExpiredStories, 7 * 24 * 60 * 60 * 1000);
