import prisma from "../../../infrastructure/database/prismaClient.js";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { getRankedFeedPostIds } from "../../services/feed/getRankedFeedPostIds.js";

const FEED_LIMIT = 50;

type RankedWithPersonal = {
  id: number;
  score: number;
  baseScore: number;
  authorInterestBoost: number;
  tagInterestBoost: number;
};

export const getFeedPosts = async (userId: number) => {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw Errors.validation("Invalid userId");
  }

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  const ranked = await getRankedFeedPostIds({
    userId,
    followingIds,
    limit: FEED_LIMIT,
    offset: 0,
  });

  const rankedIds = ranked.map((r) => r.id);

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
      postTags: {
        select: {
          tagId: true,
          weight: true,
          confidence: true,
        },
      },
    },
  });

  const authorIds = [...new Set(posts.map((p) => p.userId))];
  const tagIds = [
    ...new Set(
      posts.flatMap((p) => p.postTags.map((pt) => pt.tagId))
    ),
  ];

  const [authorInterests, tagInterests] = await Promise.all([
    prisma.userAuthorInterest.findMany({
      where: {
        userId,
        authorId: { in: authorIds },
      },
      select: {
        authorId: true,
        score: true,
      },
    }),
    prisma.userTagInterest.findMany({
      where: {
        userId,
        tagId: { in: tagIds },
      },
      select: {
        tagId: true,
        score: true,
      },
    }),
  ]);

  const authorInterestMap = new Map(
    authorInterests.map((row) => [row.authorId, row.score])
  );

  const tagInterestMap = new Map(
    tagInterests.map((row) => [row.tagId, row.score])
  );

  const postById = new Map(posts.map((p) => [p.id, p]));

  const personalizedRanked: RankedWithPersonal[] = ranked
    .map((r) => {
      const post = postById.get(r.id);
      if (!post) return null;

      const authorInterestScore = authorInterestMap.get(post.userId) ?? 0;
      const authorInterestBoost = Math.min(authorInterestScore, 20) * 0.7;

      const rawTagAffinity = post.postTags.reduce((sum, pt) => {
        const interestScore = tagInterestMap.get(pt.tagId) ?? 0;
        const confidence = pt.confidence ?? 1;
        return sum + interestScore * pt.weight * confidence;
      }, 0);

      const tagInterestBoost = rawTagAffinity * 0.12;

      return {
        id: r.id,
        baseScore: r.score,
        authorInterestBoost,
        tagInterestBoost,
        score: r.score + authorInterestBoost + tagInterestBoost,
      };
    })
    .filter((item): item is RankedWithPersonal => item !== null)
    .sort((a, b) => b.score - a.score);

  const personalizedRankedIds = personalizedRanked.map((r) => r.id);

  const rankedOut = personalizedRanked
    .map((r) => {
      const p = postById.get(r.id);
      if (!p) return null;

      return {
        ...p,
        score: r.score,
        rankingDebug: {
          baseScore: r.baseScore,
          authorInterestBoost: r.authorInterestBoost,
          tagInterestBoost: r.tagInterestBoost,
        },
      };
    })
    .filter(Boolean);

  const fallbackOut = fallbackIds
    .filter((id) => !personalizedRankedIds.includes(id))
    .map((id) => postById.get(id))
    .filter(Boolean)
    .map((p) => ({
      ...p,
      score: null,
      rankingDebug: null,
    }));

  return [...rankedOut, ...fallbackOut];
};