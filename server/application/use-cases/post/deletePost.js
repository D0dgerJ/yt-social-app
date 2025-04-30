import prisma from "../../../infrastructure/database/prismaClient.js";

export const deletePost = async (postId, userId) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
  });

  if (!post || post.userId !== Number(userId)) {
    throw new Error("Post not found or permission denied");
  }

  await prisma.post.delete({
    where: { id: Number(postId) },
  });
};
