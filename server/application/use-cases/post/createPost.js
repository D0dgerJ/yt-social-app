import prisma from "../../../infrastructure/database/prismaClient.js";

export const createPost = async ({ userId, desc, mediaUrl, mediaType }) => {
  return await prisma.post.create({
    data: {
      userId: Number(userId),
      desc,
      mediaUrl,
      mediaType,
    },
  });
};
