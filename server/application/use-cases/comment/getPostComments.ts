import prisma from "../../../infrastructure/database/prismaClient.js";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { CommentStatus, CommentVisibility, UserRole } from "@prisma/client";

function sanitizeDeletedComment<
  T extends {
    status: CommentStatus;
    content?: string;
    images?: string[];
    videos?: string[];
    files?: string[];
  }
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
  return (
    viewer?.role === UserRole.MODERATOR ||
    viewer?.role === UserRole.ADMIN ||
    viewer?.role === UserRole.OWNER
  );
}

function visibilityWhere(viewer: ViewerCtx) {
  const viewerId = viewer?.id ?? null;

  // Аноним: только PUBLIC
  if (!viewerId) {
    return { visibility: CommentVisibility.PUBLIC };
  }

  // Логин: PUBLIC + свои SHADOW_HIDDEN
  return {
    OR: [
      { visibility: CommentVisibility.PUBLIC },
      { visibility: CommentVisibility.SHADOW_HIDDEN, userId: viewerId },
    ],
  };
}

type RawComment = {
  id: number;
  parentId: number | null;
  createdAt: Date;
  status: CommentStatus;
  content?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  user: {
    id: number;
    username: string;
    profilePicture: string | null;
  };
  _count: { likes: number };
  likes: { userId: number }[];
} & Record<string, any>;

type TreeComment = Omit<RawComment, "createdAt"> & {
  createdAt: Date;
  replies: TreeComment[];
};

function buildCommentTree(flat: TreeComment[]): TreeComment[] {
  const byId = new Map<number, TreeComment>();

  for (const item of flat) {
    byId.set(item.id, { ...item, replies: [] });
  }

  const roots: TreeComment[] = [];

  for (const item of flat) {
    const current = byId.get(item.id)!;

    if (item.parentId == null) {
      roots.push(current);
      continue;
    }

    const parent = byId.get(item.parentId);

    if (parent) {
      parent.replies.push(current);
    } else {
      roots.push(current);
    }
  }

  const sortRepliesAsc = (nodes: TreeComment[]) => {
    nodes.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const node of nodes) {
      if (node.replies?.length) {
        sortRepliesAsc(node.replies);
      }
    }
  };

  sortRepliesAsc(roots);

  roots.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return roots;
}

export const getPostComments = async (postId: number, viewer?: ViewerCtx) => {
  if (!postId || postId <= 0) {
    throw Errors.validation("Invalid post ID");
  }

  await assertPostActionAllowed(postId);

  const staff = isStaff(viewer);

  const where: any = {
    postId,
    status: staff
      ? { in: [CommentStatus.ACTIVE, CommentStatus.DELETED, CommentStatus.HIDDEN] }
      : { in: [CommentStatus.ACTIVE, CommentStatus.DELETED] },
    ...(staff ? {} : visibilityWhere(viewer)),
  };

  const flatItems = await prisma.comment.findMany({
    where,
    include: {
      user: {
        select: { id: true, username: true, profilePicture: true },
      },
      _count: { select: { likes: true } },
      likes: { select: { userId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const prepared: TreeComment[] = flatItems.map((c) => {
    const cleaned = stripShadowFields(sanitizeDeletedComment(c as any));
    return {
      ...(cleaned as any),
      replies: [],
    };
  });

  return buildCommentTree(prepared);
};