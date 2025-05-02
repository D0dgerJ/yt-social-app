import prisma from "../../../infrastructure/database/prismaClient.js";

export const createComment = async ({ userId, postId, content }) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: true },
  });

  if (!post) throw new Error("Post not found");

  const comment = await prisma.comment.create({
    data: { content, userId, postId },
  });

  return { ...comment, postUserId: post.userId };
};
