import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.ts";
import { normalizeTags } from "../../services/tags/normalizeTags.ts";
import { resolveTagAliases } from "../../services/tags/resolveTagAliases.ts";
import { syncManualPostTags } from "../../services/tags/syncManualPostTags.ts";
import { extractAutoRuleTags } from "../../services/tags/extractAutoRuleTags.ts";
import { syncAutoRulePostTags } from "../../services/tags/syncAutoRulePostTags.ts";

interface UpdatePostInput {
  postId: number;
  userId: number;
  desc?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
}

export const updatePost = async ({
  postId,
  userId,
  desc,
  images,
  videos,
  files,
  tags,
  location,
}: UpdatePostInput) => {
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");

  await assertActionAllowed({ actorId: userId, action: "POST_UPDATE" });

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, status: true, desc: true, tags: true },
  });

  if (!existing) throw Errors.notFound("Post not found");
  if (existing.userId !== userId) throw Errors.forbidden("User is not the owner");

  if (existing.status === ContentStatus.DELETED) throw Errors.postDeleted();
  if (existing.status === ContentStatus.HIDDEN) throw Errors.postHidden();

  if (existing.status !== ContentStatus.ACTIVE) {
    throw Errors.forbidden("Post cannot be edited in current status");
  }

  const normalizedTags = tags !== undefined ? normalizeTags(tags) : undefined;
  const cleanLocation = typeof location === "string" ? location.trim() : location;

  return prisma.$transaction(async (tx) => {
    const resolvedTags =
      normalizedTags !== undefined
        ? await resolveTagAliases({
            tx,
            tags: normalizedTags,
          })
        : existing.tags;

    const nextDesc = desc !== undefined ? desc : existing.desc ?? undefined;

    const updatedPost = await tx.post.update({
      where: { id: postId },
      data: {
        ...(desc !== undefined && { desc }),
        ...(images !== undefined && { images }),
        ...(videos !== undefined && { videos }),
        ...(files !== undefined && { files }),
        ...(normalizedTags !== undefined && { tags: resolvedTags }),
        ...(location !== undefined && { location: cleanLocation ? cleanLocation : null }),
      },
    });

    if (normalizedTags !== undefined) {
      await syncManualPostTags({
        tx,
        postId,
        normalizedTags: resolvedTags,
      });
    }

    if (desc !== undefined || normalizedTags !== undefined) {
      const autoRuleTags = extractAutoRuleTags({
        desc: nextDesc,
        manualTags: resolvedTags,
      }).filter((tag) => !resolvedTags.includes(tag));

      await syncAutoRulePostTags({
        tx,
        postId,
        autoTags: autoRuleTags,
      });
    }

    return updatedPost;
  });
};