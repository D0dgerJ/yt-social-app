import prisma from "../../../infrastructure/database/prismaClient.ts";

interface ViewStoryInput {
  storyId: number;
  userId: number;
}

export const viewStory = async ({ storyId, userId }: ViewStoryInput) => {
  const existingView = await prisma.storyView.findUnique({
    where: {
      userId_storyId: {
        userId,
        storyId,
      },
    },
  });

  if (!existingView) {
    await prisma.storyView.create({
      data: { userId, storyId },
    });
  }
};
