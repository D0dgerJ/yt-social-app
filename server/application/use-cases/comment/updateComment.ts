import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus, CommentStatus, CommentVisibility } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertCommentThreadActionAllowed } from "../../services/comment/assertCommentThreadActionAllowed.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";

interface UpdateCommentInput {
  commentId: number;
  actorId: number;
  content?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const updateComment = async ({ commentId, actorId, content, images, videos, files }: UpdateCommentInput) => {
  if (!Number.isFinite(commentId) || commentId <= 0) {
    throw Errors.validation("Invalid commentId");
  }

  await assertUserActionAllowed({ userId: actorId, forbidRestricted: true });
  // ✅ thread auto-lock + shadow rules
  await assertCommentThreadActionAllowed({ commentId, actorId });

  // ✅ обновлять можно только корневой коммент и только ACTIVE
  // + shadow: актор должен иметь право "видеть" этот коммент (PUBLIC или свой SHADOW_HIDDEN)
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      parentId: null,
      status: CommentStatus.ACTIVE,
      post: { status: ContentStatus.ACTIVE },
      OR: [
        { visibility: CommentVisibility.PUBLIC },
        { visibility: CommentVisibility.SHADOW_HIDDEN, userId: actorId },
      ],
    },
    select: { id: true },
  });

  if (!comment) {
    throw Errors.notFound("Comment does not exist.");
  }

  const trimmed = typeof content === "string" ? content.trim() : undefined;
  if (trimmed !== undefined && trimmed.length === 0) {
    throw Errors.validation("Content cannot be empty");
  }

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