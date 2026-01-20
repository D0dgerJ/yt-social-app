import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

export const getUserPostsByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.post.findMany({
    where: { userId: user.id, status: ContentStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      likes: { select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
};
