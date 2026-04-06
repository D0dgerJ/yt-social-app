import prisma from "../../../infrastructure/database/prismaClient.js";
import { ContentStatus, CommentStatus, CommentVisibility } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { assertCommentThreadActionAllowed } from "../../services/comment/assertCommentThreadActionAllowed.js";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.js";

interface UpdateReplyInput {
  commentId: number;
  actorId: number;
  content?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const updateCommentReply = async ({ commentId, actorId, content, images, videos, files }: UpdateReplyInput) => {
  if (!Number.isFinite(commentId) || commentId <= 0) {
    throw Errors.validation("Invalid commentId");
  }
  if (!Number.isFinite(actorId) || actorId <= 0) {
    throw Errors.validation("Invalid actorId");
  }

  // Anti-abuse: санкции + лимит редактирования комментариев
  await assertActionAllowed({ actorId, action: "COMMENT_UPDATE" });

  // ✅ thread auto-lock + shadow rules
  await assertCommentThreadActionAllowed({ commentId, actorId });

  const trimmed = typeof content === "string" ? content.trim() : undefined;
  if (trimmed !== undefined && !trimmed.length) {
    throw Errors.validation("Content cannot be empty");
  }

  const reply = await prisma.comment.findFirst({
    where: {
      id: commentId,
      parentId: { not: null },
      status: CommentStatus.ACTIVE,
      post: { status: ContentStatus.ACTIVE },

      // shadow moderation:
      OR: [
        { visibility: CommentVisibility.PUBLIC },
        { visibility: CommentVisibility.SHADOW_HIDDEN, userId: actorId },
      ],
    },
    select: { id: true },
  });

  if (!reply) throw Errors.notFound("Comment does not exist.");

  return prisma.comment.update({
    where: { id: commentId },
    data: {
      ...(trimmed !== undefined && { content: trimmed }),
      ...(images !== undefined && { images }),
      ...(videos !== undefined && { videos }),
      ...(files !== undefined && { files }),
    },
  });
};