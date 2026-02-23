import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus, CommentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertCommentThreadActionAllowed } from "../../services/comment/assertCommentThreadActionAllowed.ts";

interface UpdateCommentInput {
  commentId: number;
  content?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const updateComment = async ({
  commentId,
  content,
  images,
  videos,
  files,
}: UpdateCommentInput) => {
  if (!Number.isFinite(commentId) || commentId <= 0) {
    throw Errors.validation("Invalid commentId");
  }

  // ✅ thread auto-lock (если root не ACTIVE — нельзя)
  await assertCommentThreadActionAllowed({ commentId });

  // ✅ обновлять можно только корневой коммент и только ACTIVE
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      parentId: null,
      status: CommentStatus.ACTIVE,
      post: { status: ContentStatus.ACTIVE },
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