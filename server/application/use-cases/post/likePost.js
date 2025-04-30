import prisma from "../../../infrastructure/database/prismaClient.js";

export const likePost = async ({ postId, userId }) => {
  const existing = await prisma.like.findFirst({
    where: { postId: Number(postId), userId: Number(userId) },
  });

  if (existing) {
    // Удалить лайк (toggle)
    await prisma.like.delete({
      where: { id: existing.id },
    });
    return { liked: false };
  }

  await prisma.like.create({
    data: {
      postId: Number(postId),
      userId: Number(userId),
    },
  });

  return { liked: true };
};