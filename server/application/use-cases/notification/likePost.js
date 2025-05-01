import prisma from "../../../infrastructure/database/prismaClient.js";
import { createNotification } from "./createNotification.js";

export const likePost = async ({ userId, postId }) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: true }
  });

  if (!post) throw new Error("Post not found");

  // Проверяем, поставлен ли уже лайк
  const existingLike = await prisma.like.findFirst({
    where: { userId, postId },
  });

  if (existingLike) throw new Error("Post already liked");

  await prisma.like.create({
    data: {
      userId,
      postId,
    },
  });

  // Создаем уведомление, если лайкающий не автор поста
  if (post.userId !== userId) {
    await createNotification({
      type: "like",
      content: `${post.user.username} liked your post`,
      fromUserId: userId,
      toUserId: post.userId,
    });
  }

  return { message: "Post liked" };
};
