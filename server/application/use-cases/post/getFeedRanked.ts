import prisma from "../../../infrastructure/database/prismaClient.js";
import { getRankedPostIds } from "../../services/feed/getRankedPostIds.js";
import { ContentStatus } from "@prisma/client";

type Params = {
  limit?: number;
  offset?: number;
  viewerId?: number | null;
};

export async function getFeedRanked({ limit = 50, offset = 0 }: Params) {
  const ranked = await getRankedPostIds({ limit, offset });
  const ids = ranked.map((r) => r.id);

  if (ids.length === 0) return [];

  // 1) достаём посты пачкой
  const posts = await prisma.post.findMany({
    where: {
      id: { in: ids },
      status: ContentStatus.ACTIVE, // на всякий случай
    },
    include: {
      user: { select: { id: true, username: true, profilePicture: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  // 2) возвращаем в нужном порядке + добавляем score
  const postById = new Map(posts.map((p) => [p.id, p]));
  return ranked
    .map((r) => {
      const p = postById.get(r.id);
      if (!p) return null;
      return { ...p, score: r.score };
    })
    .filter(Boolean);
}