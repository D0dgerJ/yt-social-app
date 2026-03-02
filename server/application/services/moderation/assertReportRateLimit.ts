import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

type Params = {
  reporterId: number;
  // по умолчанию 10 репортов за 10 минут
  limit?: number;
  windowMs?: number;
};

/**
 * DB-backed rate limit для репортов (postReport + commentReport).
 * Без Redis: считаем репорты за окно времени.
 */
export async function assertReportRateLimit({
  reporterId,
  limit = 10,
  windowMs = 10 * 60 * 1000,
}: Params) {
  if (!Number.isFinite(reporterId) || reporterId <= 0) {
    throw Errors.validation("Invalid reporterId");
  }

  const since = new Date(Date.now() - windowMs);

  // Считаем суммарно репорты на посты + репорты на комменты
  const [postCount, commentCount] = await Promise.all([
    prisma.postReport.count({
      where: { reporterId, createdAt: { gte: since } },
    }),
    prisma.commentReport.count({
      where: { reporterId, createdAt: { gte: since } },
    }),
  ]);

  const total = postCount + commentCount;

  if (total < limit) return;

  // Чтобы отдать retryAfterSec — ищем самый ранний репорт в окне
  const [oldestPost, oldestComment] = await Promise.all([
    prisma.postReport.findFirst({
      where: { reporterId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.commentReport.findFirst({
      where: { reporterId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  const oldest =
    oldestPost && oldestComment
      ? (oldestPost.createdAt < oldestComment.createdAt ? oldestPost.createdAt : oldestComment.createdAt)
      : (oldestPost?.createdAt ?? oldestComment?.createdAt);

  const retryAfterMs = oldest ? (oldest.getTime() + windowMs) - Date.now() : windowMs;
  const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));

  throw Errors.tooManyRequests(
    `Too many reports. Try again later.`,
    retryAfterSec
  );
}