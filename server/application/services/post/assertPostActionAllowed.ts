import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

export async function assertPostActionAllowed(postId: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, status: true },
  });

  if (!post) throw Errors.notFound("Post not found");

  if (post.status === ContentStatus.HIDDEN) throw Errors.postHidden();
  if (post.status === ContentStatus.DELETED) throw Errors.postDeleted();

  // ACTIVE -> ok
  return post;
}