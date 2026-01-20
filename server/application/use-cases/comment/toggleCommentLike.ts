import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { createNotification } from "../notification/createNotification.ts";

interface ToggleLikeParams {
  commentId: number;
  userId: number;
}

export const toggleCommentLike = async ({ commentId, userId }: ToggleLikeParams) => {
  const existingLike = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
    select: { id: true },
  });

  if (existingLike) {
    await prisma.commentLike.delete({ where: { id: existingLike.id } });
    return { liked: false };
  }

  // ✅ одним запросом проверяем и comment, и что post ACTIVE
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      post: { status: ContentStatus.ACTIVE },
    },
    select: {
      id: true,
      userId: true,
      postId: true,
      parentId: true,
      content: true,
    },
  });

  if (!comment) {
    // не палим пользователю, что пост скрыт — просто "не найдено/нельзя"
    throw new Error("Comment does not exist.");
  }

  await prisma.commentLike.create({
    data: { userId, commentId },
  });

  try {
    if (comment.userId !== userId) {
      const raw = (comment.content ?? "").trim();
      const snippet = raw.length > 140 ? `${raw.slice(0, 137)}…` : raw;

      const type = comment.parentId == null ? "comment_like" : "reply_like";

      const existingNotif = await prisma.notification.findFirst({
        where: {
          fromUserId: userId,
          toUserId: comment.userId,
          type,
          content: { contains: `"commentId":${comment.id}` },
        },
        select: { id: true },
      });

      if (!existingNotif) {
        await createNotification({
          fromUserId: userId,
          toUserId: comment.userId,
          type,
          payload: {
            postId: comment.postId,
            commentId: comment.id,
            snippet: snippet || undefined,
          },
        });
      }
    }
  } catch (err) {
    console.error("[toggleCommentLike] notification error:", err);
  }

  return { liked: true };
};
