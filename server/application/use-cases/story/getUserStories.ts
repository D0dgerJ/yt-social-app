import prisma from "../../../infrastructure/database/prismaClient";

export const getUserStories = async (userId: number) => {
  return prisma.story.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    include: { views: true },
  });
};