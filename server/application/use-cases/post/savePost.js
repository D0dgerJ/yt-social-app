import prisma from "../../../infrastructure/database/prismaClient.js";

export const savePost = async ({ postId, userId }) => {
  const existing = await prisma.savedPost.findFirst({
    where: { postId: Number(postId), userId: Number(userId) },
  });

  if (existing) {
    throw new Error("Post already saved");
  }

  return await prisma.savedPost.create({
    data: {
      postId: Number(postId),
      userId: Number(userId),
    },
  });
};