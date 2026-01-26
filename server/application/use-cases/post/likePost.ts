import prisma from "../../../infrastructure/database/prismaClient.ts";
import { createNotification } from "../notification/createNotification.ts";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

interface LikePostInput {
  userId: number;
  postId: number;
}

export const likePost = async ({ userId, postId }: LikePostInput) => {
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");

  await assertPostActionAllowed(postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, desc: true },
  });

  if (!post) throw Errors.notFound("Post not found");

  let like;
  let createdNow = false;

  try {
    like = await prisma.like.create({
      data: { userId, postId },
    });
    createdNow = true;
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };

    if (err.code === "P2002" && err.meta?.target?.includes("userId_postId")) {
      like = await prisma.like.findFirst({ where: { userId, postId } });
      if (!like) throw Errors.conflict("User already liked this post");
      return like;
    }

    throw error;
  }

  if (createdNow && post.userId !== userId) {
    try {
      const raw = (post.desc ?? "").trim();
      const snippet = raw.length > 140 ? `${raw.slice(0, 137)}…` : raw;

      await createNotification({
        fromUserId: userId,
        toUserId: post.userId,
        type: "post_like",
        payload: { postId: post.id, snippet: snippet || undefined },
      });
    } catch (notifyError) {
      console.error("[likePost] failed to create notification:", notifyError);
    }
  }

  return like;
};