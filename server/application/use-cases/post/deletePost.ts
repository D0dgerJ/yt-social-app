import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

type DeletePostInput = {
  postId: number;
  userId: number;
  reason?: string;
};

export const deletePost = async ({ postId, userId, reason }: DeletePostInput) => {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      userId,
      status: { in: [ContentStatus.ACTIVE, ContentStatus.HIDDEN] },
    },
    select: {
      id: true,
      status: true,
      userId: true,
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
    },
  });

  if (!post) {
    throw new Error("Post not found or you are not the owner");
  }

  const isHeavyCase = post.status === ContentStatus.HIDDEN;

  await prisma.$transaction(async (tx) => {
    if (isHeavyCase) {
      await tx.moderationOutbox.create({
        data: {
          eventType: "POST_AUTHOR_DELETE_WITH_SANCTIONS",
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

    await tx.commentLike.deleteMany({
      where: { comment: { postId: post.id } },
    });

    await tx.comment.deleteMany({
      where: { postId: post.id },
    });

    await tx.like.deleteMany({
      where: { postId: post.id },
    });

    await tx.savedPost.deleteMany({
      where: { postId: post.id },
    });

    await tx.post.delete({
      where: { id: post.id },
    });
  });

  return { ok: true };
};
