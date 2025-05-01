import prisma from "../../../infrastructure/database/prismaClient.js";

export const getStoryById = async (storyId) => {
    return await prisma.story.findUnique({
      where: { id: Number(storyId) },
      include: { user: true },
    });
  };