import prisma from "../../../infrastructure/database/prismaClient.js";
import { publicUserSelect } from "../../serializers/user.select.js";

type SearchUsersInput = {
  query: string;
  currentUserId?: number;
  limit?: number;
};

export const searchUsers = async ({
  query,
  currentUserId,
  limit = 10,
}: SearchUsersInput) => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 20);

  const users = await prisma.user.findMany({
    where: {
      AND: [
        currentUserId ? { id: { not: currentUserId } } : {},
        {
          username: {
            contains: normalizedQuery,
            mode: "insensitive",
          },
        },
      ],
    },
    select: publicUserSelect,
    take: safeLimit,
    orderBy: {
      username: "asc",
    },
  });

  return users;
};