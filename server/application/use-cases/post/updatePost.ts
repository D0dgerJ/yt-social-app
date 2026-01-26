import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

interface UpdatePostInput {
  postId: number;
  userId: number;
  desc?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
}

export const updatePost = async ({
  postId,
  userId,
  desc,
  images,
  videos,
  files,
  tags,
  location,
}: UpdatePostInput) => {
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, status: true },
  });

  if (!existing) throw Errors.notFound("Post not found");
  if (existing.userId !== userId) throw Errors.forbidden("User is not the owner");

  if (existing.status === ContentStatus.DELETED) throw Errors.postDeleted();
  if (existing.status === ContentStatus.HIDDEN) throw Errors.postHidden();

  if (existing.status !== ContentStatus.ACTIVE) {
    throw Errors.forbidden("Post cannot be edited in current status");
  }

  return prisma.post.update({
    where: { id: postId },
    data: {
      ...(desc !== undefined && { desc }),
      ...(images !== undefined && { images }),
      ...(videos !== undefined && { videos }),
      ...(files !== undefined && { files }),
      ...(tags !== undefined && { tags }),
      ...(location !== undefined && { location }),
    },
  });
};
