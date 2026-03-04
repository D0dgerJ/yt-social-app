import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

type RankedPost = { id: number; score: number };

type Params = {
  limit?: number;
  offset?: number;
};

export async function getRankedPostIds({ limit = 50, offset = 0 }: Params): Promise<RankedPost[]> {
  // score = likes*3 + comments*5 - hours_since_post
  // hours_since_post = EXTRACT(EPOCH FROM (NOW() - createdAt))/3600
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
    WHERE p.status = ${ContentStatus.ACTIVE}
    ORDER BY score DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return rows;
}