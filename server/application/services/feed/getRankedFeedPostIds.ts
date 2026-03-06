import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

type RankedPost = { id: number; score: number };

type Params = {
  userId: number;
  followingIds: number[];
  limit?: number;
  offset?: number;
};

export async function getRankedFeedPostIds({
  userId,
  followingIds,
  limit = 50,
  offset = 0,
}: Params): Promise<RankedPost[]> {
  const rows = await prisma.$queryRaw<RankedPost[]>`
    SELECT
      p.id,
      (
        -- базовый engagement
        (SELECT COUNT(*) FROM "Like" l WHERE l."postId" = p.id) * 3
        +
        (SELECT COUNT(*) FROM "Comment" c WHERE c."postId" = p.id) * 5

        -- time decay
        -
        (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600.0)

        -- freshness boost (первые 24 часа)
        +
        GREATEST(
          0,
          24 - (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600.0)
        ) * 0.5

        -- personal boost: лайки этому автору за последние 30 дней
        +
        (
          SELECT COUNT(*)
          FROM "Like" l2
          INNER JOIN "Post" p2 ON p2.id = l2."postId"
          WHERE l2."userId" = ${userId}
            AND p2."userId" = p."userId"
            AND l2."createdAt" > NOW() - INTERVAL '30 days'
        ) * 2

        -- personal boost: комментарии этому автору за последние 30 дней
        +
        (
          SELECT COUNT(*)
          FROM "Comment" c2
          INNER JOIN "Post" p3 ON p3.id = c2."postId"
          WHERE c2."userId" = ${userId}
            AND p3."userId" = p."userId"
            AND c2."createdAt" > NOW() - INTERVAL '30 days'
        ) * 3

        -- diversity penalty:
        -- если у автора много активных постов в текущем feed-окне,
        -- слегка понижаем каждый пост, чтобы один автор не доминировал
        -
        GREATEST(
          0,
          (
            SELECT COUNT(*)
            FROM "Post" p4
            WHERE p4."userId" = p."userId"
              AND p4.status = CAST(${ContentStatus.ACTIVE} AS "ContentStatus")
              AND p4."createdAt" > NOW() - INTERVAL '7 days'
          ) - 1
        ) * 1.5
      )::float8 AS score
    FROM "Post" p
    WHERE
      p.status = CAST(${ContentStatus.ACTIVE} AS "ContentStatus")
      AND p."createdAt" > NOW() - INTERVAL '7 days'
      AND (
        p."userId" = ${userId}
        OR (
          ${followingIds.length} > 0
          AND p."userId" = ANY(${followingIds}::int[])
        )
      )
    ORDER BY score DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return rows;
}