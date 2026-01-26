import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

export const getUserPostsByUsername = async (username: string) => {
  const clean = typeof username === "string" ? username.trim() : "";
  if (!clean) {
    throw Errors.validation("Invalid username");
  }

  const user = await prisma.user.findUnique({
    where: { username: clean },
    select: { id: true },
  });

  if (!user) {
    throw Errors.notFound("User not found");
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
      savedBy: { select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
};
