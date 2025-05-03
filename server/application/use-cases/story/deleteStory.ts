import prisma from "../../../infrastructure/database/prismaClient";

export const deleteStory = async (storyId: number) => {
  return prisma.story.delete({
    where: { id: storyId },
  });
};