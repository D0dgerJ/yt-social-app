import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";

export const getMyAuthorInterests = async (userId: number) => {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw Errors.validation("Invalid userId");
  }

  const interests = await prisma.userAuthorInterest.findMany({
    where: { userId },
    orderBy: [
      { score: "desc" },
      { updatedAt: "desc" },
    ],
    include: {
      author: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
    take: 100,
  });

  return interests.map((item) => ({
    authorId: item.authorId,
    score: item.score,
    lastInteractedAt: item.lastInteractedAt,
    updatedAt: item.updatedAt,
    author: item.author,
  }));
};