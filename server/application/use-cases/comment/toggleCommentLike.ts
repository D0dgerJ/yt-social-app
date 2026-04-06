import prisma from "../../../infrastructure/database/prismaClient.js";
import { ContentStatus, CommentStatus, CommentVisibility } from "@prisma/client";
import { createNotification } from "../notification/createNotification.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { assertCommentThreadActionAllowed } from "../../services/comment/assertCommentThreadActionAllowed.js";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.js";
import { recordFeedInteraction } from "../../services/feed/recordFeedInteraction.js";
import { applyFeedInterestSignal } from "../../services/feed/applyFeedInterestSignal.js";

interface ToggleLikeParams {
  commentId: number;
  userId: number;
}

export const toggleCommentLike = async ({ commentId, userId }: ToggleLikeParams) => {
  if (!Number.isFinite(commentId) || commentId <= 0) {
    throw Errors.validation("Invalid commentId");
  }
  if (!Number.isFinite(userId) || userId <= 0) {
    throw Errors.validation("Invalid userId");
  }

  await assertActionAllowed({ actorId: userId, action: "REACTION_ADD" });
  await assertCommentThreadActionAllowed({ commentId, actorId: userId });

  const existingLike = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
    select: { id: true },
  });

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      status: CommentStatus.ACTIVE,
      post: { status: ContentStatus.ACTIVE },
      OR: [
        { visibility: CommentVisibility.PUBLIC },
        { visibility: CommentVisibility.SHADOW_HIDDEN, userId },
      ],
    },
    select: {
      id: true,
      userId: true,
      postId: true,
      parentId: true,
      content: true,
      post: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!comment) {
    throw Errors.notFound("Comment does not exist.");
  }

  if (existingLike) {
    await prisma.$transaction(async (tx) => {
      await tx.commentLike.delete({ where: { id: existingLike.id } });

      await recordFeedInteraction({
        tx,
        userId,
        eventType: "COMMENT_UNLIKE",
        postId: comment.postId,
        commentId: comment.id,
        targetUserId: comment.post.userId,
      });

      await applyFeedInterestSignal({
        tx,
        userId,
        postId: comment.postId,
        authorId: comment.post.userId,
        eventType: "COMMENT_UNLIKE",
      });
    });

    return { liked: false };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commentLike.create({
      data: { userId, commentId },
    });

    await recordFeedInteraction({
      tx,
      userId,
      eventType: "COMMENT_LIKE",
      postId: comment.postId,
      commentId: comment.id,
      targetUserId: comment.post.userId,
    });

    await applyFeedInterestSignal({
      tx,
      userId,
      postId: comment.postId,
      authorId: comment.post.userId,
      eventType: "COMMENT_LIKE",
    });
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