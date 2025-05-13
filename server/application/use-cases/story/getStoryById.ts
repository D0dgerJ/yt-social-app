import prisma from "../../../infrastructure/database/prismaClient.ts";

export const getStoryById = async (storyId: number) => {
  return prisma.story.findUnique({
    where: { id: storyId },
    include: { user: true, views: true },
  });
};