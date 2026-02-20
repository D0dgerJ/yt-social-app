import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus, CommentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertCommentThreadActionAllowed } from "../../services/comment/assertCommentThreadActionAllowed.ts";

interface UpdateReplyInput {
  commentId: number;
  content?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const updateCommentReply = async ({
  commentId,
  content,
  images,
  videos,
  files,
}: UpdateReplyInput) => {
  if (!Number.isFinite(commentId) || commentId <= 0) {
    throw Errors.validation("Invalid commentId");
  }

  // ✅ thread auto-lock: если root НЕ ACTIVE — любые user-действия в ветке запрещены
  await assertCommentThreadActionAllowed({ commentId });

  const trimmed = typeof content === "string" ? content.trim() : undefined;
  if (trimmed !== undefined && !trimmed.length) {
    throw Errors.validation("Content cannot be empty");
  }

  const reply = await prisma.comment.findFirst({
    where: {
      id: commentId,
      parentId: { not: null },
      status: CommentStatus.ACTIVE, // ✅ нельзя обновлять DELETED/HIDDEN
      post: { status: ContentStatus.ACTIVE },
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