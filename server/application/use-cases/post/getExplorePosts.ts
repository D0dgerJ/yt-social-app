import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { getRankedPostIds } from "../../services/feed/getRankedPostIds.ts";

const LIMIT = 50;

export const getExplorePosts = async () => {
  // ranked (глобальный) — сервис уже считает score + freshness boost
  const ranked = await getRankedPostIds({ limit: LIMIT, offset: 0 });
  const rankedIds = ranked.map((r) => r.id);

  // fallback: если ranked почему-то не набрал (редко, но пусть будет)
  let fallbackIds: number[] = [];
  if (rankedIds.length < LIMIT) {
    const need = LIMIT - rankedIds.length;

    const fallback = await prisma.post.findMany({
      where: {
        status: ContentStatus.ACTIVE,
        ...(rankedIds.length > 0 ? { id: { notIn: rankedIds } } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
      take: need,
    });

    fallbackIds = fallback.map((p) => p.id);
  }

  const ids = [...rankedIds, ...fallbackIds];
  if (ids.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: {
      id: { in: ids },
      status: ContentStatus.ACTIVE,
    },
    include: {
      user: { select: { id: true, username: true, profilePicture: true } },
      likes: { select: { userId: true } },
      savedBy: { select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const byId = new Map(posts.map((p) => [p.id, p]));

  const rankedOut = ranked
    .map((r) => {
      const p = byId.get(r.id);
      if (!p) return null;
      return { ...p, score: r.score };
    })
    .filter(Boolean);

  const fallbackOut = fallbackIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p) => ({ ...p, score: null }));

  return [...rankedOut, ...fallbackOut];
};