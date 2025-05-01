import prisma from "../../../infrastructure/database/prismaClient.js";

export const createStory = async (userId, mediaUrl, mediaType, expiresAt) => {
    return await prisma.story.create({
      data: {
        userId: Number(userId),
        mediaUrl,
        mediaType,
        expiresAt,
      },
    });
  };