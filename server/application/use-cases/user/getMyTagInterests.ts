import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";

export const getMyTagInterests = async (userId: number) => {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw Errors.validation("Invalid userId");
  }

  const interests = await prisma.userTagInterest.findMany({
    where: { userId },
    orderBy: [
      { score: "desc" },
      { updatedAt: "desc" },
    ],
    include: {
      tag: {
        select: {
          id: true,
          slug: true,
          label: true,
          category: true,
          isActive: true,
        },
      },
    },
    take: 100,
  });

  return interests.map((item) => ({
    tagId: item.tagId,
    score: item.score,
    positiveScore: item.positiveScore,
    negativeScore: item.negativeScore,
    lastInteractedAt: item.lastInteractedAt,
    updatedAt: item.updatedAt,
    tag: item.tag,
  }));
};