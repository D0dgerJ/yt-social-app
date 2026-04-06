import prisma from "../../../infrastructure/database/prismaClient.js";
import { createNotification } from "../notification/createNotification.js";
import { notifyMentions } from "../notification/notifyMentions.js";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.js";
import { assertCommentThreadActionAllowed } from "../../services/comment/assertCommentThreadActionAllowed.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { CommentStatus } from "@prisma/client";
import { rateLimitConsume } from "../../../infrastructure/rateLimit/rateLimitConsume.js";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.js";
import { recordFeedInteraction } from "../../services/feed/recordFeedInteraction.js";
import { applyFeedInterestSignal } from "../../services/feed/applyFeedInterestSignal.js";

interface CreateCommentParams {
  postId: number;
  userId: number;
  content: string;
  parentId?: number;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const createComment = async ({
  postId,
  userId,
  content,
  parentId,
  images = [],
  videos = [],
  files = [],
}: CreateCommentParams) => {
  if (!postId || postId <= 0) {
    throw Errors.validation("Invalid post ID");
  }

  await assertActionAllowed({ actorId: userId, action: "COMMENT_CREATE" });

  await assertPostActionAllowed(postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true },
  });

  if (!post) {
    throw Errors.notFound("Post not found");
  }

  let parentComment: { id: number; userId: number; postId: number } | null = null;

  if (typeof parentId === "number") {
    if (!Number.isFinite(parentId) || parentId <= 0) {
      throw Errors.validation("Invalid parentId");
    }

    const thread = await assertCommentThreadActionAllowed({ commentId: parentId, actorId: userId });

    await rateLimitConsume({ key: `rl:reply:user:${userId}`, limit: 10, windowSec: 60 });
    await rateLimitConsume({
      key: `rl:reply:thread:${userId}:${thread.rootId}`,
      limit: 4,
      windowSec: 20,
    });

    parentComment = await prisma.comment.findFirst({
      where: {
        id: parentId,
        status: CommentStatus.ACTIVE,
      },
      select: { id: true, userId: true, postId: true },
    });

    if (!parentComment) {
      throw Errors.validation("Cannot reply to this comment");
    }

    if (parentComment.postId !== postId) {
      throw Errors.validation("Invalid parentId for this post");
    }
  }

  const trimmed = content?.trim() ?? "";
  if (!trimmed.length) {
    throw Errors.validation("Content is required");
  }

  const comment = await prisma.$transaction(async (tx) => {
    const createdComment = await tx.comment.create({
      data: {
        postId,
        userId,
        content: trimmed,
        parentId: parentId ?? null,
        images,
        videos,
        files,
      },
      include: {
        user: { select: { id: true, username: true, profilePicture: true } },
        _count: { select: { likes: true } },
        likes: { select: { userId: true } },
      },
    });

    await recordFeedInteraction({
      tx,
      userId,
      eventType: parentComment ? "COMMENT_REPLY" : "COMMENT_CREATE",
      postId,
      commentId: createdComment.id,
      targetUserId: post.userId,
    });

    await applyFeedInterestSignal({
      tx,
      userId,
      postId,
      authorId: post.userId,
      eventType: "COMMENT_CREATE",
    });

    return createdComment;
  });

  const snippet = trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed;

  try {
    if (parentComment) {
      if (parentComment.userId !== userId) {
        await createNotification({
          fromUserId: userId,
          toUserId: parentComment.userId,
          type: "reply_to_comment",
          payload: {
            postId: parentComment.postId,
            commentId: parentComment.id,
            replyId: comment.id,
            snippet,
          },
        });
      }
    } else {
      if (post.userId !== userId) {
        await createNotification({
          fromUserId: userId,
          toUserId: post.userId,
          type: "comment_on_post",
          payload: { postId: post.id, commentId: comment.id, snippet },
        });
      }
    }

    await notifyMentions({
      content: trimmed,
      fromUserId: userId,
      postId,
      commentId: comment.id,
      context: "comment",
    });
  } catch (err) {
    console.error("[createComment] notification error:", err);
  }

  return comment;
};