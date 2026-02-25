import prisma from "../../../infrastructure/database/prismaClient.ts";
import { CommentStatus, ContentStatus, CommentVisibility, UserRole } from "@prisma/client";

function sanitizeDeletedComment<
  T extends { status: CommentStatus; content?: string; images?: string[]; videos?: string[]; files?: string[] }
>(c: T): T {
  if (c.status !== CommentStatus.DELETED) return c;

  return {
    ...c,
    content: "(deleted)",
    images: [],
    videos: [],
    files: [],
  };
}

function stripShadowFields<T extends Record<string, any>>(c: T): T {
  const {
    visibility,
    shadowHiddenAt,
    shadowHiddenReason,
    shadowHiddenById,
    shadowHiddenBy,
    ...rest
  } = c;
  return rest as T;
}

type ViewerCtx = { id?: number; role?: UserRole } | null | undefined;

function isStaff(viewer: ViewerCtx) {
  return viewer?.role === UserRole.MODERATOR || viewer?.role === UserRole.ADMIN || viewer?.role === UserRole.OWNER;
}

function visibilityWhere(viewer: ViewerCtx) {
  const viewerId = viewer?.id ?? null;

  if (!viewerId) {
    return { visibility: CommentVisibility.PUBLIC };
  }

  return {
    OR: [{ visibility: CommentVisibility.PUBLIC }, { visibility: CommentVisibility.SHADOW_HIDDEN, userId: viewerId }],
  };
}

export const getCommentById = async (commentId: number, viewer?: ViewerCtx) => {
  const staff = isStaff(viewer);

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      status: staff
        ? { in: [CommentStatus.ACTIVE, CommentStatus.DELETED, CommentStatus.HIDDEN] }
        : { in: [CommentStatus.ACTIVE, CommentStatus.DELETED] },
      post: { status: ContentStatus.ACTIVE },
      ...(staff ? {} : visibilityWhere(viewer)),
    },
    include: {
      user: { select: { id: true, username: true, profilePicture: true } },
      _count: { select: { likes: true } },
      likes: { select: { userId: true } },
    },
  });

  return comment ? stripShadowFields(sanitizeDeletedComment(comment as any)) : null;
};