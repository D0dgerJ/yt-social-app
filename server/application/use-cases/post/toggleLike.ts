import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.js";
import { likePost } from "./likePost.js";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.js";
import { recordFeedInteraction } from "../../services/feed/recordFeedInteraction.js";
import { applyFeedInterestSignal } from "../../services/feed/applyFeedInterestSignal.js";

interface ToggleLikeInput {
  userId: number;
  postId: number;
}

export const toggleLike = async ({ userId, postId }: ToggleLikeInput) => {
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");

  await assertActionAllowed({ actorId: userId, action: "REACTION_ADD" });
  await assertPostActionAllowed(postId);

  const existing = await prisma.like.findFirst({
    where: { userId, postId },
    select: { id: true },
  });

  if (existing) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) throw Errors.notFound("Post not found");

    await prisma.$transaction(async (tx) => {
      await tx.like.delete({ where: { id: existing.id } });

      await recordFeedInteraction({
        tx,
        userId,
        eventType: "POST_UNLIKE",
        postId,
        targetUserId: post.userId,
      });

      await applyFeedInterestSignal({
        tx,
        userId,
        postId,
        authorId: post.userId,
        eventType: "POST_UNLIKE",
      });
    });

    return { liked: false };
  }

  const like = await likePost({ userId, postId });
  return { liked: true, like };
};