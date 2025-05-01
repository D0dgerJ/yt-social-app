import prisma from "../../../infrastructure/database/prismaClient.js";
import { createNotification } from "./createNotification.js";

export const createComment = async ({ userId, postId, content }) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: true },
  });

  if (!post) throw new Error("Post not found");

  const comment = await prisma.comment.create({
    data: {
      content,
      userId,
      postId,
    },
  });

  // Отправить уведомление, если пользователь комментирует чужой пост
  if (post.userId !== userId) {
    await createNotification({
      type: "comment",
      content: `New comment on your post: \"${content}\"`,
      fromUserId: userId,
      toUserId: post.userId,
    });
  }

  return comment;
};
