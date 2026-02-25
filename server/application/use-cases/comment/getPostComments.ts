import prisma from "../../../infrastructure/database/prismaClient.ts";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { CommentStatus, CommentVisibility, UserRole } from "@prisma/client";

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

// Важно: не отдаём наружу поля shadow moderation
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

  // Аноним: только PUBLIC
  if (!viewerId) {
    return { visibility: CommentVisibility.PUBLIC };
  }

  // Логин: PUBLIC + свои SHADOW_HIDDEN
  return {
    OR: [{ visibility: CommentVisibility.PUBLIC }, { visibility: CommentVisibility.SHADOW_HIDDEN, userId: viewerId }],
  };
}

export const getPostComments = async (postId: number, viewer?: ViewerCtx) => {
  if (!postId || postId <= 0) {
    throw Errors.validation("Invalid post ID");
  }

  await assertPostActionAllowed(postId);

  const staff = isStaff(viewer);

  const rootWhere: any = {
    postId,
    parentId: null,
    status: staff
      ? { in: [CommentStatus.ACTIVE, CommentStatus.DELETED, CommentStatus.HIDDEN] }
      : { in: [CommentStatus.ACTIVE, CommentStatus.DELETED] },
    ...(staff ? {} : visibilityWhere(viewer)),
  };

  const replyWhere: any = {
    status: staff
      ? { in: [CommentStatus.ACTIVE, CommentStatus.DELETED, CommentStatus.HIDDEN] }
      : { in: [CommentStatus.ACTIVE, CommentStatus.DELETED] },
    ...(staff ? {} : visibilityWhere(viewer)),
  };

  const items = await prisma.comment.findMany({
    where: rootWhere,
    include: {
      user: {
        select: { id: true, username: true, profilePicture: true },
      },
      replies: {
        where: replyWhere,
        include: {
          user: {
            select: { id: true, username: true, profilePicture: true },
          },
          _count: { select: { likes: true } },
          likes: { select: { userId: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { likes: true } },
      likes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((c) => {
    const root = stripShadowFields(sanitizeDeletedComment(c as any));
    const replies = (c.replies ?? []).map((r: any) => stripShadowFields(sanitizeDeletedComment(r)));
    return { ...root, replies };
  });
};