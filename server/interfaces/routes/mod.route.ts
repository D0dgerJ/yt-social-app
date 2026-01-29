import { Router } from "express";
import prisma from "../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../infrastructure/errors/ApiError.ts";

import { hidePost, softDeletePost, unhidePost } from "../../application/services/moderation/moderatePost.ts";
import { hardDeletePost } from "../../application/services/moderation/hardDeletePost.ts";

import { logModerationAction } from "../../application/services/moderation/logModerationAction.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { requireModerator, requireAdmin } from "../../infrastructure/middleware/requireRole.ts";

import { ModerationActionType, ModerationTargetType, ReportStatus, UserSanctionType  } from "@prisma/client";

import { applyUserSanction } from "../../application/services/moderation/applyUserSanction.ts";
import { liftUserSanction } from "../../application/services/moderation/liftUserSanction.ts";
import { getUserSanctions } from "../../application/services/moderation/getUserSanctions.ts";

const router = Router();

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
  // ISO string expected
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
  // evidence — опциональный Json (мы не валидируем жестко на старте)
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

    const post = await unhidePost({ actorId: req.user!.id, postId, reason });
    res.status(200).json({ ok: true, post });
  } catch (err) {
    next(err);
  }
});

/**
 * SOFT DELETE: ADMIN+
 * Только если есть APPROVED report
 * reason (обоснование решения) ОБЯЗАТЕЛЕН
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
 * reason (обоснование решения) ОБЯЗАТЕЛЕН
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

/**
 * ✅ Вариант 2: "каждый пост = строка + count репортов + последняя жалоба"
 *
 * GET /mod/reports/posts?status=PENDING&postId=123&take=20&skip=0
 * MODERATOR+
 */
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

    // 1) группируем репорты по postId: count + max(createdAt)
    const groupsRaw = await prisma.postReport.groupBy({
      by: ["postId"],
      where: {
        status,
        ...(postId ? { postId } : {}),
      },
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: {
        _max: { createdAt: "desc" },
      },
      skip,
      take,
    });

    // ✅ тип-фикс: теперь postId гарантированно number
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

    // 2) последние жалобы (по каждому посту) — distinct(postId) + orderBy createdAt desc
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
        // postId у lastReports должен быть number, но Prisma иногда типизирует как number | null
        if (typeof r.postId === "number") {
          lastByPostId.set(r.postId, r);
        }
      }

    // 3) сами посты (для строки таблицы)
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

    // 4) собираем строки в том же порядке, что groups
    const items = groups.map((g) => {
      const p = postById.get(g.postId) ?? null;

      return {
        postId: g.postId,
        reportCount: g._count._all,
        lastReport: lastByPostId.get(g.postId) ?? null,
        post: p,
      };
    });

    res.status(200).json({
      ok: true,
      status,
      total: total.length, // количество "постов-строк", а не репортов
      skip,
      take,
      items,
    });
  } catch (err) {
    next(err);
  }
});



/**
 * (опционально) список репортов как "items" — если нужно окно деталей
 * GET /mod/reports/posts/items?status=PENDING&postId=123&take=50&skip=0
 */
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

/**
 * GET /mod/reports/posts/:reportId
 * MODERATOR+
 */
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

/**
 * POST /mod/reports/posts/:reportId/approve
 * MODERATOR+
 *
 * ВАЖНО: НЕ перезаписываем PostReport.reason/message (это репортёрские поля).
 * reason/message тут — это обоснование решения модератора (идёт в ModerationAction).
 */
router.post("/reports/posts/:reportId/approve", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const reportId = parseId(req.params.reportId, "Invalid reportId");

    const decisionReason = getReason(req.body);
    if (!decisionReason) throw Errors.validation("Reason is required");

    const decisionMessage = getMessage(req.body);

    const updated = await prisma.postReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
      },
      select: { id: true, postId: true, reporterId: true, status: true, reviewedAt: true, reviewedById: true },
    });

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

/**
 * POST /mod/reports/posts/:reportId/reject
 * MODERATOR+
 *
 * ВАЖНО: НЕ перезаписываем PostReport.reason/message (это репортёрские поля).
 */
router.post("/reports/posts/:reportId/reject", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const reportId = parseId(req.params.reportId, "Invalid reportId");

    const decisionReason = getReason(req.body);
    if (!decisionReason) throw Errors.validation("Reason is required");

    const decisionMessage = getMessage(req.body);

    const updated = await prisma.postReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
      },
      select: { id: true, postId: true, reporterId: true, status: true, reviewedAt: true, reviewedById: true },
    });

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

// -------------------- user sanctions --------------------

/**
 * POST /mod/users/:userId/sanctions
 * MODERATOR+
 * PERM_BAN — только ADMIN+
 *
 * body:
 * {
 *   type: "WARN" | "RESTRICT" | "TEMP_BAN" | "PERM_BAN",
 *   reason: string,
 *   message?: string,
 *   endsAt?: string (ISO) // required for TEMP_BAN
 *   evidence?: any (Json)
 * }
 */
router.post("/users/:userId/sanctions", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const userId = parseId(req.params.userId, "Invalid userId");

    const type = getSanctionType(req.body);
    const reason = getReason(req.body);
    if (!reason) throw Errors.validation("Reason is required");

    const message = getMessage(req.body);
    const endsAt = getEndsAt(req.body);
    const evidence = getEvidence(req.body);

    // PERM_BAN только ADMIN+
    if (type === UserSanctionType.PERM_BAN) {
      // requireAdmin уже есть, но у нас сейчас requireModerator.
      // Делаем ручную проверку: если не ADMIN — forbidden.
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { role: true, isAdmin: true },
      });

      const effectiveRole = dbUser?.isAdmin && dbUser.role === "USER" ? "ADMIN" : dbUser?.role; // упрощенно
      if (effectiveRole !== "ADMIN" && effectiveRole !== "OWNER") {
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

/**
 * POST /mod/sanctions/:sanctionId/lift
 * MODERATOR+
 * body: { reason: string }
 */
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

/**
 * GET /mod/users/:userId/sanctions
 * MODERATOR+
 */
router.get("/users/:userId/sanctions", authMiddleware, requireModerator, async (req, res, next) => {
  try {
    const userId = parseId(req.params.userId, "Invalid userId");
    const items = await getUserSanctions(userId);

    res.status(200).json({ ok: true, items });
  } catch (err) {
    next(err);
  }
});

export default router;
