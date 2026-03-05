import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { getRankedFeedPostIds } from "../../services/feed/getRankedFeedPostIds.ts";

const FEED_LIMIT = 50;

export const getFeedPosts = async (userId: number) => {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw Errors.validation("Invalid userId");
  }

  // 0) followingIds считаем один раз (и используем для ranked + fallback)
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  // 1) ranked (7 days window внутри сервиса)
  const ranked = await getRankedFeedPostIds({
    userId,
    followingIds,
    limit: FEED_LIMIT,
    offset: 0,
  });
  const rankedIds = ranked.map((r) => r.id);

  // 2) fallback: если ranked мало — добираем по createdAt desc из той же ленты (я + following)
  let fallbackIds: number[] = [];
  if (rankedIds.length < FEED_LIMIT) {
    const need = FEED_LIMIT - rankedIds.length;

    const fallback = await prisma.post.findMany({
      where: {
        status: ContentStatus.ACTIVE,
        OR: [{ userId }, { userId: { in: followingIds } }],
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

  // 3) грузим посты
  const posts = await prisma.post.findMany({
    where: {
      id: { in: ids },
      status: ContentStatus.ACTIVE,
    },
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

      _count: {
        select: { likes: true, comments: true },
      },
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