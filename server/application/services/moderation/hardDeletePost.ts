import prisma from "../../../infrastructure/database/prismaClient.ts";

type HardDeletePostInput = {
  actorId: number;
  postId: number;
  reason?: string;
};

export async function hardDeletePost({ actorId, postId, reason }: HardDeletePostInput) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      desc: true,
      images: true,
      videos: true,
      files: true,
      tags: true,
      location: true,
      status: true,
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
    const err = new Error("Post not found");
    // @ts-expect-error - emulate prisma not found
    err.code = "P2025";
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    // 1) Снапшот в outbox (админское удаление)
    await tx.moderationOutbox.create({
      data: {
        eventType: "POST_ADMIN_HARD_DELETE",
        entityType: "POST",
        entityId: String(post.id),
        payload: {
          postSnapshot: post,
          reason: reason ?? null,
          deletedByAdminId: actorId,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    // 2) Удаляем зависимости
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

    // 3) Удаляем сам пост
    await tx.post.delete({
      where: { id: post.id },
    });
  });

  return { postId: post.id };
}
