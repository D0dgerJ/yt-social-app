import prisma from "../../../infrastructure/database/prismaClient.js";
import { createNotification } from "./createNotification.js";

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

  await prisma.savedPost.create({
    data: {
      userId,
      postId,
    },
  });

  // Уведомление, если сохраняющий — не автор
  if (post.userId !== userId) {
    await createNotification({
      type: "save",
      content: `${post.user.username} saved your post`,
      fromUserId: userId,
      toUserId: post.userId,
    });
  }

  return { message: "Post saved" };
};
