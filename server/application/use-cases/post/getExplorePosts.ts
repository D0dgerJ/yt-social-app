import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { getRankedPostIds } from "../../services/feed/getRankedPostIds.ts";

const LIMIT = 50;

type RankedWithPersonal = {
  id: number;
  score: number;
  baseScore: number;
  authorInterestBoost: number;
  tagInterestBoost: number;
  noveltyBoost: number;
};

export const getExplorePosts = async (viewerId?: number | null) => {
  const ranked = await getRankedPostIds({ limit: LIMIT, offset: 0 });
  const rankedIds = ranked.map((r) => r.id);

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

  let authorInterestMap = new Map<number, number>();
  let tagInterestMap = new Map<number, number>();

  if (viewerId) {
    const [authorInterests, tagInterests] = await Promise.all([
      prisma.userAuthorInterest.findMany({
        where: {
          userId: viewerId,
          authorId: { in: authorIds },
        },
        select: {
          authorId: true,
          score: true,
        },
      }),
      prisma.userTagInterest.findMany({
        where: {
          userId: viewerId,
          tagId: { in: tagIds },
        },
        select: {
          tagId: true,
          score: true,
        },
      }),
    ]);

    authorInterestMap = new Map(
      authorInterests.map((row) => [row.authorId, row.score])
    );

    tagInterestMap = new Map(
      tagInterests.map((row) => [row.tagId, row.score])
    );
  }

  const byId = new Map(posts.map((p) => [p.id, p]));

  const personalizedRanked: RankedWithPersonal[] = ranked
    .map((r) => {
      const post = byId.get(r.id);
      if (!post) return null;

      const authorInterestScore = authorInterestMap.get(post.userId) ?? 0;
      const authorInterestBoost = Math.min(authorInterestScore, 10) * 0.25;

      const rawTagAffinity = post.postTags.reduce((sum, pt) => {
        const interestScore = tagInterestMap.get(pt.tagId) ?? 0;
        const confidence = pt.confidence ?? 1;
        return sum + interestScore * pt.weight * confidence;
      }, 0);

      const tagInterestBoost = rawTagAffinity * 0.18;
      const noveltyBoost =
        tagInterestBoost > 0 && authorInterestBoost < 2 ? 1.2 : 0;

      return {
        id: r.id,
        baseScore: r.score,
        authorInterestBoost,
        tagInterestBoost,
        noveltyBoost,
        score: r.score + authorInterestBoost + tagInterestBoost + noveltyBoost,
      };
    })
    .filter((item): item is RankedWithPersonal => item !== null)
    .sort((a, b) => b.score - a.score);

  const personalizedRankedIds = personalizedRanked.map((r) => r.id);

  const rankedOut = personalizedRanked
    .map((r) => {
      const p = byId.get(r.id);
      if (!p) return null;

      return {
        ...p,
        score: r.score,
        rankingDebug: {
          baseScore: r.baseScore,
          authorInterestBoost: r.authorInterestBoost,
          tagInterestBoost: r.tagInterestBoost,
          noveltyBoost: r.noveltyBoost,
        },
      };
    })
    .filter(Boolean);

  const fallbackOut = fallbackIds
    .filter((id) => !personalizedRankedIds.includes(id))
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p) => ({
      ...p,
      score: null,
      rankingDebug: null,
    }));

  return [...rankedOut, ...fallbackOut];
};