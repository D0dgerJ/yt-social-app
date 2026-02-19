import { useEffect, useMemo, useState } from "react";
import type { ReportStatus } from "@/utils/api/mod.api";
import { getCommentReportItems } from "@/utils/api/mod.api";
import type { CommentCaseCounts, ModerationCommentReportLite } from "@/utils/types/moderation/commentDetails.types";

function countByStatus(items: ModerationCommentReportLite[]): CommentCaseCounts {
  const base: CommentCaseCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const r of items) base[r.status] += 1;
  return base;
}

export function useModerationCommentReports(commentId: number) {
  const [isLoadingReports, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reports, setReports] = useState<ModerationCommentReportLite[]>([]);
  const [activeReportId, setActiveReportId] = useState<number | null>(null);

  const [counts, setCounts] = useState<CommentCaseCounts>({ PENDING: 0, APPROVED: 0, REJECTED: 0 });

  const activeLite = useMemo(
    () => (activeReportId ? reports.find((r) => r.id === activeReportId) ?? null : null),
    [activeReportId, reports]
  );

  async function refreshCase() {
    if (!Number.isFinite(commentId) || commentId <= 0) return;

    setLoading(true);
    setError(null);

    try {
      // Забираем все репорты по этому commentId (по всем статусам)
      const [pending, approved, rejected] = await Promise.all([
        getCommentReportItems({ status: "PENDING", commentId, take: 200, skip: 0 }),
        getCommentReportItems({ status: "APPROVED", commentId, take: 200, skip: 0 }),
        getCommentReportItems({ status: "REJECTED", commentId, take: 200, skip: 0 }),
      ]);

      const all: ModerationCommentReportLite[] = [
        ...(pending.items ?? []),
        ...(approved.items ?? []),
        ...(rejected.items ?? []),
      ].map((x: any) => ({
        id: x.id,
        commentId: x.commentId,
        reason: x.reason,
        details: x.details ?? null,
        status: x.status as ReportStatus,
        createdAt: x.createdAt,
        reporter: x.reporter ?? null,
      }));

      // сортируем по времени (desc), чтобы “последний” был первым
      all.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

      setReports(all);
      setCounts(countByStatus(all));

      // активный репорт: либо сохранённый, либо последний PENDING, либо просто самый свежий
      setActiveReportId((prev) => {
        if (prev && all.some((r) => r.id === prev)) return prev;

        const lastPending = all.find((r) => r.status === "PENDING");
        if (lastPending) return lastPending.id;

        return all[0]?.id ?? null;
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentId]);

  return {
    isLoadingReports,
    error,

    reports,
    activeReportId,
    setActiveReportId,

    counts,
    activeLite,

    refreshCase,
  };
}
