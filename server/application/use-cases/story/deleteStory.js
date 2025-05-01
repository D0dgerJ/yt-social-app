import prisma from "../../../infrastructure/database/prismaClient.js";

export const deleteStory = async (storyId, userId) => {
  const story = await prisma.story.findUnique({ where: { id: Number(storyId) } });

  if (!story || story.userId !== Number(userId)) {
    throw new Error("Story not found or permission denied");
  }

  await prisma.story.delete({ where: { id: Number(storyId) } });
};