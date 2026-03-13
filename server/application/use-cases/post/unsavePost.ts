import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";
import { recordFeedInteraction } from "../../services/feed/recordFeedInteraction.ts";
import { applyFeedInterestSignal } from "../../services/feed/applyFeedInterestSignal.ts";

interface UnsavePostInput {
  userId: number;
  postId: number;
}

export const unsavePost = async ({ userId, postId }: UnsavePostInput) => {
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");

  await assertUserActionAllowed({ userId, forbidRestricted: true });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true },
  });

  if (!post) throw Errors.notFound("Post not found");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.savedPost.delete({
        where: {
          userId_postId: { userId, postId },
        },
      });

      await recordFeedInteraction({
        tx,
        userId,
        eventType: "POST_UNSAVE",
        postId,
        targetUserId: post.userId,
      });

      await applyFeedInterestSignal({
        tx,
        userId,
        postId,
        authorId: post.userId,
        eventType: "POST_UNSAVE",
      });

      return deleted;
    });

    return { unsaved: true, deleted: result };
  } catch (error: unknown) {
    const err = error as { code?: string };

    if (err.code === "P2025") {
      return { unsaved: true, alreadyUnsaved: true };
    }

    throw error;
  }
};