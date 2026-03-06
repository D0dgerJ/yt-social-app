import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

type RankedPost = { id: number; score: number };

type Params = {
  limit?: number;
  offset?: number;
};

export async function getRankedPostIds({
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

        -- diversity penalty:
        -- если у автора много активных постов за последние 7 дней,
        -- каждый его пост слегка понижаем
        -
        GREATEST(
          0,
          (
            SELECT COUNT(*)
            FROM "Post" p2
            WHERE p2."userId" = p."userId"
              AND p2.status = CAST(${ContentStatus.ACTIVE} AS "ContentStatus")
              AND p2."createdAt" > NOW() - INTERVAL '7 days'
          ) - 1
        ) * 1.5

        -- лёгкая рандомизация, чтобы explore не был статичным
        +
        ((random() * 2.0) - 1.0)
      )::float8 AS score
    FROM "Post" p
    WHERE p.status = CAST(${ContentStatus.ACTIVE} AS "ContentStatus")
    ORDER BY score DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return rows;
}