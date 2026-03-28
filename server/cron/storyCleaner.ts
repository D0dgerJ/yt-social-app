import prisma from "../infrastructure/database/prismaClient.ts";
import { env } from "../config/env.ts";

const STORY_CLEAN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

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

    if (!env.isProd) {
      console.log("🧹 Expired stories cleaned");
    }
  } catch (error) {
    console.error("❌ Error cleaning expired stories:", error);
  }
};

if (env.STORY_CLEANER_ENABLED) {
  setInterval(cleanExpiredStories, STORY_CLEAN_INTERVAL_MS);
} else if (!env.isProd) {
  console.log("[storyCleaner] disabled by env");
}