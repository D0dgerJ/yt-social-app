import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.ts";
import { normalizeTags } from "../../services/tags/normalizeTags.ts";
import { resolveTagAliases } from "../../services/tags/resolveTagAliases.ts";
import { syncManualPostTags } from "../../services/tags/syncManualPostTags.ts";
import { extractAutoRuleTags } from "../../services/tags/extractAutoRuleTags.ts";
import { syncAutoRulePostTags } from "../../services/tags/syncAutoRulePostTags.ts";

interface CreatePostInput {
  userId: number;
  desc?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
}

export const createPost = async ({
  userId,
  desc,
  images = [],
  videos = [],
  files = [],
  tags = [],
  location,
}: CreatePostInput) => {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw Errors.validation("Invalid userId");
  }

  await assertActionAllowed({ actorId: userId, action: "POST_CREATE" });

  const cleanLocation = typeof location === "string" ? location.trim() : undefined;
  const normalizedTags = normalizeTags(tags);

  return prisma.$transaction(async (tx) => {
    const resolvedTags = await resolveTagAliases({
      tx,
      tags: normalizedTags,
    });

    const autoRuleTags = extractAutoRuleTags({
      desc,
      manualTags: resolvedTags,
    }).filter((tag) => !resolvedTags.includes(tag));

    const post = await tx.post.create({
      data: {
        userId,
        desc,
        images,
        videos,
        files,
        tags: resolvedTags,
        location: cleanLocation ? cleanLocation : null,
      },
    });

    await syncManualPostTags({
      tx,
      postId: post.id,
      normalizedTags: resolvedTags,
    });

    await syncAutoRulePostTags({
      tx,
      postId: post.id,
      autoTags: autoRuleTags,
    });

    return post;
  });
};