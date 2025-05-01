import cron from "node-cron";
import prisma from "../infrastructure/database/prismaClient.js";

cron.schedule("0 0 * * 0", async () => {
  // Каждое воскресенье в 00:00
  try {
    const now = new Date();
    const deleted = await prisma.story.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(`[CRON] Удалено ${deleted.count} устаревших stories.`);
  } catch (err) {
    console.error("[CRON] Ошибка при удалении stories:", err.message);
  }
});
