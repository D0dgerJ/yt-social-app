import prisma from "../../../infrastructure/database/prismaClient.js";

export const updatePost = async (postId, userId, data) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
  });

  if (!post || post.userId !== Number(userId)) {
    throw new Error("Post not found or permission denied");
  }

  return await prisma.post.update({
    where: { id: Number(postId) },
    data,
  });
};
