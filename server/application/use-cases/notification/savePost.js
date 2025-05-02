import prisma from "../../../infrastructure/database/prismaClient.js";

export const savePost = async ({ userId, postId }) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: true },
  });

  if (!post) throw new Error("Post not found");

  const alreadySaved = await prisma.savedPost.findFirst({
    where: { userId, postId },
  });

  if (alreadySaved) throw new Error("Post already saved");

  await prisma.savedPost.create({ data: { userId, postId } });

  return { postUserId: post.userId };
};
