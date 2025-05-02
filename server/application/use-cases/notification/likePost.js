import prisma from "../../../infrastructure/database/prismaClient.js";

export const likePost = async ({ userId, postId }) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: true },
  });

  if (!post) throw new Error("Post not found");

  const existingLike = await prisma.like.findFirst({
    where: { userId, postId },
  });

  if (existingLike) throw new Error("Post already liked");

  await prisma.like.create({ data: { userId, postId } });

  return { postUserId: post.userId };
};
