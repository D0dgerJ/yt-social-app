import prisma from "../../../infrastructure/database/prismaClient.ts";
import { createNotification } from "../notification/createNotification.ts";
import { notifyMentions } from "../notification/notifyMentions.ts";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

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

  await assertPostActionAllowed(postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true },
  });

  if (!post) {
    throw Errors.notFound("Post not found");
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      content,
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

  const trimmed = content.trim();
  const snippet = trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed;

  try {
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, userId: true, postId: true },
      });

      if (parentComment && parentComment.userId !== userId) {
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
      content,
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