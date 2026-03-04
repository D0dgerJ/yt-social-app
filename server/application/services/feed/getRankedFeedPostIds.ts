import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

type RankedPost = { id: number; score: number };

type Params = {
  userId: number;
  limit?: number;
  offset?: number;
};

export async function getRankedFeedPostIds({
  userId,
  limit = 50,
  offset = 0,
}: Params): Promise<RankedPost[]> {
  const rows = await prisma.$queryRaw<RankedPost[]>`
    SELECT
      p.id,
      (
        (SELECT COUNT(*) FROM "Like" l WHERE l."postId" = p.id) * 3
        +
        (SELECT COUNT(*) FROM "Comment" c WHERE c."postId" = p.id) * 5
        -
        (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600.0)
      )::float8 AS score
    FROM "Post" p
    WHERE
      p.status = ${ContentStatus.ACTIVE}
      AND p."createdAt" > NOW() - INTERVAL '7 days'
      AND (
        p."userId" = ${userId}
        OR p."userId" IN (
          SELECT f."followingId"
          FROM "Follow" f
          WHERE f."followerId" = ${userId}
        )
      )
    ORDER BY score DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return rows;
}