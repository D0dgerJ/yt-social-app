import prisma from "../../../infrastructure/database/prismaClient";

export const getRepliesCountForMany = async (commentIds: number[]) => {
  const groupedCounts = await prisma.comment.groupBy({
    by: ['parentId'],
    where: {
      parentId: { in: commentIds },
    },
    _count: true,
  });

  const countMap: Record<number, number> = {};
  groupedCounts.forEach((group) => {
    if (group.parentId !== null) {
      countMap[group.parentId] = group._count;
    }
  });

  return countMap;
};