import prisma from "../../../infrastructure/database/prismaClient.ts";
import { createNotification } from "./createNotification.ts";

interface LikePostInput {
  userId: number;
  postId: number;
}

export const likePost = async ({ userId, postId }: LikePostInput) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  try {
    const like = await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    await createNotification({
      fromUserId: userId,
      toUserId: post.userId,
      type: "post_like",
      payload: { postId: post.id, likerId: userId },
    });

    return like;
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };

    if (err.code === "P2002" && err.meta?.target?.includes("userId_postId")) {
      throw new Error("User already liked this post");
    }

    throw error;
  }
};
