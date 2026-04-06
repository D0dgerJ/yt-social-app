import prisma from "../../../infrastructure/database/prismaClient.js";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.js";
import { recordFeedInteraction } from "../../services/feed/recordFeedInteraction.js";
import { applyFeedInterestSignal } from "../../services/feed/applyFeedInterestSignal.js";

interface SavePostInput {
  userId: number;
  postId: number;
}

export const savePost = async ({ userId, postId }: SavePostInput) => {
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");

  await assertUserActionAllowed({ userId, forbidRestricted: true });
  await assertPostActionAllowed(postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true },
  });

  if (!post) throw Errors.notFound("Post not found");

  try {
    return await prisma.$transaction(async (tx) => {
      const saved = await tx.savedPost.create({
        data: { userId, postId },
      });

      await recordFeedInteraction({
        tx,
        userId,
        eventType: "POST_SAVE",
        postId,
        targetUserId: post.userId,
      });

      await applyFeedInterestSignal({
        tx,
        userId,
        postId,
        authorId: post.userId,
        eventType: "POST_SAVE",
      });

      return saved;
    });
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };

    if (err.code === "P2002" && err.meta?.target?.includes("userId_postId")) {
      return { alreadySaved: true };
    }

    throw error;
  }
};