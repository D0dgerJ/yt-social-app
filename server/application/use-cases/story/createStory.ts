import prisma from "../../../infrastructure/database/prismaClient.js";

interface CreateStoryInput {
  userId: number;
  mediaUrl: string;
  mediaType: string;
  expiresAt: Date;
}

export const createStory = async ({
  userId,
  mediaUrl,
  mediaType,
  expiresAt,
}: CreateStoryInput) => {
  return await prisma.story.create({
    data: {
      userId,
      mediaUrl,
      mediaType,
      expiresAt,
    },
  });
};
