import prisma from "../../../infrastructure/database/prismaClient.ts";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";
import { recordFeedInteraction } from "../../services/feed/recordFeedInteraction.ts";
import { applyFeedInterestSignal } from "../../services/feed/applyFeedInterestSignal.ts";

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