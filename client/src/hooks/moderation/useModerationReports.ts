import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportItems } from "@/utils/api/mod.api";
import type { ReportItem } from "@/utils/types/moderation/postDetails.types";

type Counts = {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
};

export function useModerationReports(postId: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeReportId, setActiveReportId] = useState<number | null>(null);

  // --- load reports (PENDING + APPROVED + REJECTED) ---
  useEffect(() => {
    if (!Number.isFinite(postId) || postId <= 0) {
      setError("Invalid postId in URL");
      return;
    }

    let cancelled = false;

    async function loadAll() {
      setIsLoading(true);
      setError("");

      try {
        const [pending, approved, rejected] = await Promise.all([
          getReportItems({ postId, status: "PENDING", take: 200, skip: 0 }),
          getReportItems({ postId, status: "APPROVED", take: 200, skip: 0 }),
          getReportItems({ postId, status: "REJECTED", take: 200, skip: 0 }),
        ]);

        const all: ReportItem[] = [
          ...(pending?.items ?? []),
          ...(approved?.items ?? []),
          ...(rejected?.items ?? []),
        ];

        all.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (cancelled) return;

        setReports(all);

        const newestPending = all.find((r) => r.status === "PENDING");
        const fallback = all[0];

        const nextActive = newestPending?.id ?? fallback?.id ?? null;
        setActiveReportId(nextActive);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load reports");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const counts: Counts = useMemo(() => {
    const out: Counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of reports) out[r.status] += 1;
    return out;
  }, [reports]);

  const activeLite = useMemo(
    () => reports.find((r) => r.id === activeReportId) ?? null,
    [reports, activeReportId]
  );

  const refreshCase = useCallback(async () => {
    const [pending, approved, rejected] = await Promise.all([
      getReportItems({ postId, status: "PENDING", take: 200, skip: 0 }),
      getReportItems({ postId, status: "APPROVED", take: 200, skip: 0 }),
      getReportItems({ postId, status: "REJECTED", take: 200, skip: 0 }),
    ]);

    const all: ReportItem[] = [
      ...(pending?.items ?? []),
      ...(approved?.items ?? []),
      ...(rejected?.items ?? []),
    ];

    all.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setReports(all);

    const stillExists =
      activeReportId !== null && all.some((r) => r.id === activeReportId);
    if (!stillExists) {
      const newestPending = all.find((r) => r.status === "PENDING");
      setActiveReportId(newestPending?.id ?? all[0]?.id ?? null);
    }
  }, [activeReportId, postId]);

  return {
    // state
    isLoadingReports: isLoading,
    error,
    setError,

    reports,
    setReports,

    activeReportId,
    setActiveReportId,

    // derived
    counts,
    activeLite,

    // actions
    refreshCase,
  };
}
