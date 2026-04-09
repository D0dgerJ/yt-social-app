import prisma from "../../../infrastructure/database/prismaClient.js";
import { ContentStatus, Prisma } from "@prisma/client";
import { normalizeTags } from "../../services/tags/normalizeTags.js";
import { resolveTagAliases } from "../../services/tags/resolveTagAliases.js";

type SearchPostsInput = {
  query: string;
  limit?: number;
};

export const searchPosts = async ({
  query,
  limit = 20,
}: SearchPostsInput) => {
  const rawQuery = query.trim();

  if (!rawQuery) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const isHashtagSearch = rawQuery.startsWith("#");

  return prisma.$transaction(async (tx) => {
    let resolvedTag: string | null = null;

    if (isHashtagSearch) {
      const normalizedTags = normalizeTags([rawQuery], 1);

      if (normalizedTags.length > 0) {
        const resolvedTags = await resolveTagAliases({
          tx,
          tags: normalizedTags,
        });

        resolvedTag = resolvedTags[0] ?? normalizedTags[0] ?? null;
      }
    }

    const orConditions: Prisma.PostWhereInput[] = [
      {
        desc: {
          contains: rawQuery,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ];

    if (resolvedTag) {
      orConditions.push(
        {
          tags: {
            has: resolvedTag,
          },
        },
        {
          postTags: {
            some: {
              tag: {
                slug: resolvedTag,
              },
            },
          },
        },
        {
          desc: {
            contains: `#${resolvedTag}`,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      );
    }

    return tx.post.findMany({
      where: {
        status: ContentStatus.ACTIVE,
        OR: orConditions,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: safeLimit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        savedBy: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
  });
};