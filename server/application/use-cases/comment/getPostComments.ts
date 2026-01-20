import prisma from "../../../infrastructure/database/prismaClient.ts";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

export const getPostComments = async (postId: number) => {
  if (!postId || postId <= 0) {
    throw Errors.validation("Invalid post ID");
  }

  await assertPostActionAllowed(postId);

  return prisma.comment.findMany({
    where: { postId, parentId: null },
    include: {
      user: {
        select: { id: true, username: true, profilePicture: true },
      },
      replies: {
        include: {
          user: {
            select: { id: true, username: true, profilePicture: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { likes: true } },
      likes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};
