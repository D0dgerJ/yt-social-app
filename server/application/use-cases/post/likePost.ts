import prisma from "../../../infrastructure/database/prismaClient.ts";
import { createNotification } from "../notification/createNotification.ts";

interface LikePostInput {
  userId: number;
  postId: number;
}

export const likePost = async ({ userId, postId }: LikePostInput) => {
  const like = await prisma.like.create({
    data: {
      userId,
      postId,
    },
  });

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, desc: true },
    });

    if (!post) {
      return like;
    }

    if (post.userId === userId) {
      return like;
    }

    const existingNotif = await prisma.notification.findFirst({
      where: {
        fromUserId: userId,
        toUserId: post.userId,
        type: "post_like",
        content: { contains: `"postId":${post.id}` },
      },
    });

    if (!existingNotif) {
      const raw = (post.desc ?? "").trim();
      const snippet =
        raw.length > 140 ? `${raw.slice(0, 137)}…` : raw;

      await createNotification({
        fromUserId: userId,
        toUserId: post.userId,
        type: "post_like",
        payload: {
          postId: post.id,
          snippet: snippet || undefined,
        },
      });
    }
  } catch (notifyError) {
    console.error("[likePost] failed to create notification:", notifyError);
  }

  return like;
};