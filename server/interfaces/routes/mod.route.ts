import { Router } from "express";
import prisma from "../../infrastructure/database/prismaClient.ts";
import type { Prisma } from "@prisma/client";
import { Errors } from "../../infrastructure/errors/ApiError.ts";

import { hidePost, softDeletePost, unhidePost } from "../../application/services/moderation/moderatePost.ts";
import { hardDeletePost } from "../../application/services/moderation/hardDeletePost.ts";

import { logModerationAction } from "../../application/services/moderation/logModerationAction.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { requireModerator, requireAdmin } from "../../infrastructure/middleware/requireRole.ts";

import {
  ModerationActionType,
  ModerationTargetType,
  ReportStatus,
  UserSanctionType,
  UserRole,
} from "@prisma/client";

import { applyUserSanction } from "../../application/services/moderation/applyUserSanction.ts";
import { liftUserSanction } from "../../application/services/moderation/liftUserSanction.ts";
import { getUserSanctions } from "../../application/services/moderation/getUserSanctions.ts";
import { getModerationUsers } from "../../application/services/moderation/getModerationUsers.ts";
import { getModerationUserById } from "../../application/services/moderation/getModerationUserById.ts";

const router = Router();

const ROLE_RANK: Record<UserRole, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

function getEffectiveRole(dbRole: UserRole, isAdmin: boolean): UserRole {
  if (isAdmin && ROLE_RANK[dbRole] < ROLE_RANK[UserRole.ADMIN]) {
    return UserRole.ADMIN;
  }

  return dbRole;
}

function parseId(raw: unknown, message: string) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw Errors.validation(message);
  return n;
}

/**
 * reason — в модераторских действиях это "обоснование решения"
 * (не путать с reason репортера в PostReport.reason)
 */
function getReason(body: any): string | undefined {
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  return reason.length ? reason : undefined;
}

function getMessage(body: any): string | undefined {
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  return message.length ? message : undefined;
}

async function assertHasApprovedReport(postId: number) {
  const count = await prisma.postReport.count({
    where: { postId, status: ReportStatus.APPROVED },
  });

  if (count <= 0) {
    throw Errors.forbidden("Forbidden: requires approved report");
  }
}

function getEndsAt(body: any): Date | null | undefined {
  const raw = typeof body?.endsAt === "string" ? body.endsAt.trim() : "";
  if (!raw) return undefined;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw Errors.validation("Invalid endsAt");
  return d;
}

function getSanctionType(body: any): UserSanctionType {
  const raw = typeof body?.type === "string" ? body.type.trim() : "";
  if (!raw) throw Errors.validation("type is required");

  const allowed = Object.values(UserSanctionType) as string[];
  if (!allowed.includes(raw)) throw Errors.validation("Invalid sanction type");

  return raw as UserSanctionType;
}

function getEvidence(body: any): any | undefined {
  return body?.evidence;
}

// -------------------- healthcheck --------------------

router.get("/ping", authMiddleware, requireModerator, (req, res) => {
  res.status(200).json({
    ok: true,
    message: "mod pong",
    user: { id: req.user?.id, role: req.user?.role },
  });
});

// -------------------- post moderation actions --------------------

router.post("/posts/:id/hide", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const postId = parseId(req.params.id, "Invalid post id");
    const reason = getReason(req.body);

    await assertHasApprovedReport(postId);

    const post = await hidePost({ actorId: req.user!.id, postId, reason });
    res.status(200).json({ ok: true, post });
  } catch (err) {
    next(err);
  }
});

router.post("/posts/:id/unhide", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const postId = parseId(req.params.id, "Invalid post id");
    const reason = getReason(req.body);

    await assertHasApprovedReport(postId);

    const post = await unhidePost({ actorId: req.user!.id, postId, reason });
    res.status(200).json({ ok: true, post });
  } catch (err) {
    next(err);
  }
});

/**
 * SOFT DELETE: ADMIN+
 * Только если есть APPROVED report
 * reason ОБЯЗАТЕЛЕН
 */
router.post("/posts/:id/soft-delete", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const postId = parseId(req.params.id, "Invalid post id");

    const reason = getReason(req.body);
    if (!reason) throw Errors.validation("Reason is required");

    await assertHasApprovedReport(postId);

    const post = await softDeletePost({ actorId: req.user!.id, postId, reason });
    res.status(200).json({ ok: true, post });
  } catch (err) {
    next(err);
  }
});

/**
 * HARD DELETE: ADMIN+
 * Только если есть APPROVED report
 * reason ОБЯЗАТЕЛЕН
 */
router.delete("/posts/:id/hard-delete", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const postId = parseId(req.params.id, "Invalid post id");

    const reason = getReason(req.body);
    if (!reason) throw Errors.validation("Reason is required");

    await assertHasApprovedReport(postId);

    const result = await hardDeletePost({ actorId: req.user!.id, postId, reason });
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// -------------------- post reports (UI table) --------------------

router.get("/reports/posts", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const statusRaw = typeof req.query.status === "string" ? req.query.status : "PENDING";
    const status = (Object.values(ReportStatus) as string[]).includes(statusRaw)
      ? (statusRaw as ReportStatus)
      : ReportStatus.PENDING;

    const postId = req.query.postId ? parseId(req.query.postId, "Invalid postId") : undefined;

    const takeRaw = Number(req.query.take ?? 20);
    const skipRaw = Number(req.query.skip ?? 0);
    const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 100) : 20;
    const skip = Number.isFinite(skipRaw) ? Math.max(skipRaw, 0) : 0;

    const groupsRaw = await prisma.postReport.groupBy({
      by: ["postId"],
      where: {
        status,
        ...(postId ? { postId } : {}),
      },
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      skip,
      take,
    });

    const groups = groupsRaw.filter(
      (g): g is (typeof groupsRaw)[number] & { postId: number } =>
        typeof g.postId === "number" && Number.isFinite(g.postId)
    );

    const totalRaw = await prisma.postReport.groupBy({
      by: ["postId"],
      where: {
        status,
        ...(postId ? { postId } : {}),
      },
      _count: { _all: true },
    });

    const total = totalRaw.filter(
      (g): g is (typeof totalRaw)[number] & { postId: number } =>
        typeof g.postId === "number" && Number.isFinite(g.postId)
    );

    const postIds = groups.map((g) => g.postId);

    const lastReports = postIds.length
      ? await prisma.postReport.findMany({
          where: { postId: { in: postIds }, status },
          orderBy: { createdAt: "desc" },
          distinct: ["postId"],
          select: {
            id: true,
            postId: true,
            reporterId: true,
            reason: true,
            message: true,
            createdAt: true,
            reporter: { select: { id: true, username: true } },
          },
        })
      : [];

    const lastByPostId = new Map<number, (typeof lastReports)[number]>();
    for (const r of lastReports) {
      if (typeof r.postId === "number") lastByPostId.set(r.postId, r);
    }

    const posts = postIds.length
      ? await prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            userId: true,
            desc: true,
            images: true,
            videos: true,
            files: true,
            tags: true,
            location: true,
            status: true,
            createdAt: true,
            user: { select: { id: true, username: true } },
          },
        })
      : [];

    const postById = new Map<number, (typeof posts)[number]>();
    for (const p of posts) postById.set(p.id, p);

    const items = groups.map((g) => ({
      postId: g.postId,
      reportCount: g._count._all,
      lastReport: lastByPostId.get(g.postId) ?? null,
      post: postById.get(g.postId) ?? null,
    }));

    res.status(200).json({
      ok: true,
      status,
      total: total.length,
      skip,
      take,
      items,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/reports/posts/items", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const statusRaw = typeof req.query.status === "string" ? req.query.status : "PENDING";
    const status = (Object.values(ReportStatus) as string[]).includes(statusRaw)
      ? (statusRaw as ReportStatus)
      : ReportStatus.PENDING;

    const postId = req.query.postId ? parseId(req.query.postId, "Invalid postId") : undefined;

    const takeRaw = Number(req.query.take ?? 50);
    const skipRaw = Number(req.query.skip ?? 0);
    const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 200) : 50;
    const skip = Number.isFinite(skipRaw) ? Math.max(skipRaw, 0) : 0;

    const [items, total] = await prisma.$transaction([
      prisma.postReport.findMany({
        where: {
          status,
          ...(postId ? { postId } : {}),
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          reporter: { select: { id: true, username: true } },
          reviewedBy: { select: { id: true, username: true } },
          post: {
            select: {
              id: true,
              userId: true,
              desc: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.postReport.count({
        where: {
          status,
          ...(postId ? { postId } : {}),
        },
      }),
    ]);

    res.status(200).json({ ok: true, total, skip, take, items });
  } catch (err) {
    next(err);
  }
});

router.get("/reports/posts/:reportId", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const reportId = parseId(req.params.reportId, "Invalid reportId");

    const report = await prisma.postReport.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { id: true, username: true } },
        reviewedBy: { select: { id: true, username: true } },
        post: {
          select: {
            id: true,
            userId: true,
            desc: true,
            images: true,
            videos: true,
            files: true,
            tags: true,
            location: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report) throw Errors.notFound("Report not found");

    res.status(200).json({ ok: true, report });
  } catch (err) {
    next(err);
  }
});

router.post("/reports/posts/:reportId/approve", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const reportId = parseId(req.params.reportId, "Invalid reportId");

    const decisionReason = getReason(req.body);
    if (!decisionReason) throw Errors.validation("Reason is required");

    const decisionMessage = getMessage(req.body);

    // Обновляем только если репорт ещё PENDING
    const result = await prisma.postReport.updateMany({
      where: { id: reportId, status: ReportStatus.PENDING },
      data: {
        status: ReportStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
      },
    });

    if (result.count !== 1) {
      // либо не найден, либо уже рассмотрен
      throw Errors.conflict("Report is not pending or does not exist");
    }

    const updated = await prisma.postReport.findUnique({
      where: { id: reportId },
      select: { id: true, postId: true, reporterId: true, status: true, reviewedAt: true, reviewedById: true },
    });

    // На всякий случай (хотя count=1 гарантирует, что он есть)
    if (!updated) throw Errors.notFound("Report not found");

    await logModerationAction({
      actorId: req.user!.id,
      actionType: ModerationActionType.NOTE,
      targetType: ModerationTargetType.POST,
      targetId: String(updated.postId),
      reason: decisionReason,
      metadata: {
        reportId: updated.id,
        decision: "APPROVED",
        message: decisionMessage || undefined,
      },
    });

    res.status(200).json({ ok: true, report: updated });
  } catch (err) {
    next(err);
  }
});

router.post("/reports/posts/:reportId/reject", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const reportId = parseId(req.params.reportId, "Invalid reportId");

    const decisionReason = getReason(req.body);
    if (!decisionReason) throw Errors.validation("Reason is required");

    const decisionMessage = getMessage(req.body);

    // Обновляем только если репорт ещё PENDING
    const result = await prisma.postReport.updateMany({
      where: { id: reportId, status: ReportStatus.PENDING },
      data: {
        status: ReportStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
      },
    });

    if (result.count !== 1) {
      // либо не найден, либо уже рассмотрен
      throw Errors.conflict("Report is not pending or does not exist");
    }

    const updated = await prisma.postReport.findUnique({
      where: { id: reportId },
      select: { id: true, postId: true, reporterId: true, status: true, reviewedAt: true, reviewedById: true },
    });

    if (!updated) throw Errors.notFound("Report not found");

    await logModerationAction({
      actorId: req.user!.id,
      actionType: ModerationActionType.NOTE,
      targetType: ModerationTargetType.POST,
      targetId: String(updated.postId),
      reason: decisionReason,
      metadata: {
        reportId: updated.id,
        decision: "REJECTED",
        message: decisionMessage || undefined,
      },
    });

    res.status(200).json({ ok: true, report: updated });
  } catch (err) {
    next(err);
  }
});

// -------------------- moderation users (UI table) --------------------

/**
 * GET /api/v1/mod/users
 * q: поиск по id (точно), username/email (contains)
 * status: ALL | BANNED | RESTRICTED | SANCTIONED | CLEAN
 * sortBy: id | username | email | role
 * order: asc | desc
 * page: 1..n
 * limit: 1..100
 */

function getPage(query: any): number {
  const raw = Number(query?.page ?? 1);
  if (!Number.isFinite(raw)) return 1;
  return Math.max(1, Math.floor(raw));
}

function getLimit(query: any): number {
  const raw = Number(query?.limit ?? 20);
  if (!Number.isFinite(raw)) return 20;
  return Math.min(100, Math.max(1, Math.floor(raw)));
}

function getSortBy(query: any): "id" | "username" | "email" | "role" {
  const raw = typeof query?.sortBy === "string" ? query.sortBy.trim() : "";
  if (raw === "username" || raw === "email" || raw === "role" || raw === "id") return raw;
  return "id";
}

function getOrder(query: any): "asc" | "desc" {
  const raw = typeof query?.order === "string" ? query.order.trim() : "";
  if (raw === "asc" || raw === "desc") return raw;
  return "desc";
}

function getUsersStatus(query: any): "ALL" | "BANNED" | "RESTRICTED" | "SANCTIONED" | "CLEAN" {
  const raw = typeof query?.status === "string" ? query.status.trim() : "";
  if (raw === "ALL" || raw === "BANNED" || raw === "RESTRICTED" || raw === "SANCTIONED" || raw === "CLEAN") return raw;
  return "ALL";
}

router.get("/users", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = getUsersStatus(req.query);
    const sortBy = getSortBy(req.query);
    const order = getOrder(req.query);
    const page = getPage(req.query);
    const limit = getLimit(req.query);

    const result = await getModerationUsers({
      q: q || undefined,
      status,
      sortBy,
      order,
      page,
      limit,
    });

    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/mod/users/:userId
 * Детали пользователя для модалки/страницы модерации:
 * - user (поля профиля)
 * - activeSanctions + recentSanctions
 * - sanctionsSummary (isBanned/isRestricted/lastSanctionAt)
 * - последние moderation actions по этому USER
 */
router.get("/users/:userId", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const userId = parseId(req.params.userId, "Invalid userId");
    const data = await getModerationUserById(userId);

    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

// -------------------- user sanctions --------------------

router.post("/users/:userId/sanctions", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const userId = parseId(req.params.userId, "Invalid userId");

    const type = getSanctionType(req.body);
    const reason = getReason(req.body);
    if (!reason) throw Errors.validation("Reason is required");

    const message = getMessage(req.body);
    const endsAt = getEndsAt(req.body);
    const evidence = getEvidence(req.body);

    if (userId === req.user!.id) {
      throw Errors.forbidden("Forbidden: cannot sanction yourself");
    }

    const [actorDb, targetDb] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { role: true, isAdmin: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, isAdmin: true },
      }),
    ]);

    if (!targetDb) throw Errors.notFound("User not found");

    const actorRole = actorDb ? getEffectiveRole(actorDb.role, actorDb.isAdmin) : (req.user!.role as UserRole);
    const targetRole = getEffectiveRole(targetDb.role, targetDb.isAdmin);

    if (ROLE_RANK[targetRole] >= ROLE_RANK[actorRole]) {
      throw Errors.forbidden("Forbidden: cannot sanction user with equal/higher role");
    }

    if (type === UserSanctionType.PERM_BAN) {
      if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.OWNER) {
        throw Errors.forbidden("Forbidden: PERM_BAN requires ADMIN");
      }
    }

    const sanction = await applyUserSanction({
      actorId: req.user!.id,
      userId,
      type,
      reason,
      message: message || undefined,
      endsAt: endsAt ?? null,
      evidence,
    });

    res.status(201).json({ ok: true, sanction });
  } catch (err) {
    next(err);
  }
});

router.post("/sanctions/:sanctionId/lift", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const sanctionId = parseId(req.params.sanctionId, "Invalid sanctionId");
    const liftReason = getReason(req.body);
    if (!liftReason) throw Errors.validation("Reason is required");

    const sanction = await liftUserSanction({
      actorId: req.user!.id,
      sanctionId,
      liftReason,
    });

    res.status(200).json({ ok: true, sanction });
  } catch (err) {
    next(err);
  }
});

router.get("/users/:userId/sanctions", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const userId = parseId(req.params.userId, "Invalid userId");
    const items = await getUserSanctions(userId);

    res.status(200).json({ ok: true, items });
  } catch (err) {
    next(err);
  }
});

// -------------------- moderation actions history (evidence) --------------------

router.get("/actions", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const takeRaw = Number(req.query.take ?? 20);
    const skipRaw = Number(req.query.skip ?? 0);
    const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 100) : 20;
    const skip = Number.isFinite(skipRaw) ? Math.max(skipRaw, 0) : 0;

    const actorId = req.query.actorId ? parseId(req.query.actorId, "Invalid actorId") : undefined;

    const actionTypeRaw = typeof req.query.actionType === "string" ? req.query.actionType : undefined;
    const targetTypeRaw = typeof req.query.targetType === "string" ? req.query.targetType : undefined;

    const actionType =
      actionTypeRaw && (Object.values(ModerationActionType) as string[]).includes(actionTypeRaw)
        ? (actionTypeRaw as ModerationActionType)
        : undefined;

    const targetType =
      targetTypeRaw && (Object.values(ModerationTargetType) as string[]).includes(targetTypeRaw)
        ? (targetTypeRaw as ModerationTargetType)
        : undefined;

    const targetId =
      typeof req.query.targetId === "string" && req.query.targetId.trim().length
        ? req.query.targetId.trim()
        : undefined;

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const fromRaw = typeof req.query.from === "string" ? new Date(req.query.from) : null;
    const toRaw = typeof req.query.to === "string" ? new Date(req.query.to) : null;

    const from = fromRaw && !Number.isNaN(fromRaw.getTime()) ? fromRaw : undefined;
    const to = toRaw && !Number.isNaN(toRaw.getTime()) ? toRaw : undefined;

    const where: Prisma.ModerationActionWhereInput = {
      ...(actorId ? { actorId } : {}),
      ...(actionType ? { actionType } : {}),
      ...(targetType ? { targetType } : {}),
      ...(targetId ? { targetId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { reason: { contains: q, mode: "insensitive" } },
              { targetId: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.moderationAction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          actor: { select: { id: true, username: true, role: true } },
        },
      }),
      prisma.moderationAction.count({ where }),
    ]);

    res.status(200).json({ ok: true, total, skip, take, items });
  } catch (err) {
    next(err);
  }
});

router.get("/actions/:id", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const id = parseId(req.params.id, "Invalid action id");

    const action = await prisma.moderationAction.findUnique({
      where: { id },
      include: {
        actor: { select: { id: true, username: true, role: true } },
      },
    });

    if (!action) throw Errors.notFound("Action not found");

    res.status(200).json({ ok: true, action });
  } catch (err) {
    next(err);
  }
});

router.get("/actions/:id/evidence", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const id = parseId(req.params.id, "Invalid action id");

    const action = await prisma.moderationAction.findUnique({
      where: { id },
      include: {
        actor: { select: { id: true, username: true, role: true } },
      },
    });

    if (!action) throw Errors.notFound("Action not found");

    let targetPost: any = null;
    let targetUser: any = null;

    const targetIdNum = Number(action.targetId);
    const targetIdIsNum = Number.isFinite(targetIdNum) && targetIdNum > 0;

    if (action.targetType === ModerationTargetType.POST && targetIdIsNum) {
      targetPost = await prisma.post.findUnique({
        where: { id: targetIdNum },
        select: {
          id: true,
          userId: true,
          desc: true,
          images: true,
          videos: true,
          files: true,
          tags: true,
          location: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, username: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });
    }

    if (action.targetType === ModerationTargetType.USER && targetIdIsNum) {
      targetUser = await prisma.user.findUnique({
        where: { id: targetIdNum },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isAdmin: true,
          desc: true,
          profilePicture: true,
          coverPicture: true,
          from: true,
          city: true,
          relationship: true,
        },
      });
    }

    res.status(200).json({
      ok: true,
      action,
      targetPost,
      targetUser,
    });
  } catch (err) {
    next(err);
  }
});

export default router;