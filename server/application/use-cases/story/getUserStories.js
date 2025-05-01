import prisma from "../../../infrastructure/database/prismaClient.js";

export const getUserStories = async (userId) => {
  const now = new Date();
  return await prisma.story.findMany({
    where: {
      userId: Number(userId),
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};