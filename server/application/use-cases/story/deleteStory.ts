import prisma from "../../../infrastructure/database/prismaClient.ts";

export const deleteStory = async (storyId: number) => {
  return prisma.story.delete({
    where: { id: storyId },
  });
};