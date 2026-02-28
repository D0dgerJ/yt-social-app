import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus, CommentStatus, CommentVisibility } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertCommentThreadActionAllowed } from "../../services/comment/assertCommentThreadActionAllowed.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";

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

  await assertUserActionAllowed({ userId: actorId, forbidRestricted: true });

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