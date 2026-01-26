import { ContentStatus, ModerationActionType, ModerationTargetType } from "@prisma/client";
import prisma from "../../../infrastructure/database/prismaClient.ts";
import { logModerationAction } from "./logModerationAction.ts";

type ModeratePostInput = {
  actorId: number;
  postId: number;
  reason?: string;
};

export async function hidePost({ actorId, postId, reason }: ModeratePostInput) {
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      status: ContentStatus.HIDDEN,
      hiddenAt: new Date(),
      hiddenById: actorId,
      hiddenReason: reason ?? null,
    },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_HIDDEN,
    targetType: ModerationTargetType.POST,
    targetId: String(postId),
    reason: reason ?? null,
    metadata: { mode: "hide" },
  });

  return post;
}

export async function unhidePost({ actorId, postId, reason }: ModeratePostInput) {
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      status: ContentStatus.ACTIVE,
      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,
    },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_UNHIDDEN,
    targetType: ModerationTargetType.POST,
    targetId: String(postId),
    reason: reason ?? null,
    metadata: { mode: "unhide" },
  });

  return post;
}

export async function softDeletePost({ actorId, postId, reason }: ModeratePostInput) {
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      status: ContentStatus.DELETED,
      deletedAt: new Date(),
      deletedById: actorId,
      deletedReason: reason ?? null,
    },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_DELETED,
    targetType: ModerationTargetType.POST,
    targetId: String(postId),
    reason: reason ?? null,
    metadata: { mode: "soft" },
  });

  return post;
}
