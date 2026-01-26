import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

type DeletePostInput = {
  postId: number;
  userId: number;
  reason?: string;
};

export const deletePost = async ({ postId, userId, reason }: DeletePostInput) => {
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      userId,
      status: { in: [ContentStatus.ACTIVE, ContentStatus.HIDDEN] },
    },
    select: {
      id: true,
      userId: true,
      status: true,
      desc: true,
      images: true,
      videos: true,
      files: true,
      tags: true,
      location: true,
      createdAt: true,
      updatedAt: true,
      hiddenAt: true,
      hiddenById: true,
      hiddenReason: true,
      deletedAt: true,
      deletedById: true,
      deletedReason: true,
    },
  });

  if (!post) {
    throw Errors.notFound("Post not found or you are not the owner");
  }

  if (post.status === ContentStatus.DELETED) {
    throw Errors.postDeleted();
  }

  const isHeavyCase = post.status === ContentStatus.HIDDEN;

  await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: post.id },
      data: {
        status: ContentStatus.DELETED,
        deletedAt: new Date(),
        deletedById: userId,
        deletedReason: reason ?? null,
      },
    });

    if (isHeavyCase) {
      await tx.moderationOutbox.create({
        data: {
          eventType: "POST_AUTHOR_SOFT_DELETE_WHILE_HIDDEN",
          entityType: "POST",
          entityId: String(post.id),
          payload: {
            postSnapshot: {
              ...post,
              createdAt: post.createdAt.toISOString(),
              updatedAt: post.updatedAt.toISOString(),
              hiddenAt: post.hiddenAt ? post.hiddenAt.toISOString() : null,
            },
            deletedByUserId: userId,
            reason: reason ?? null,
            deletedAt: new Date().toISOString(),
          },
        },
      });
    }

  });

  return { ok: true };
};
