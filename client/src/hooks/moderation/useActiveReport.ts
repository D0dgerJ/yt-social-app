import { useCallback, useEffect, useState } from "react";
import { getReportById } from "@/utils/api/mod.api";
import type { FullReport } from "@/utils/types/moderation/postDetails.types";

export function useActiveReport(activeReportId: number | null) {
  const [activeFullReport, setActiveFullReport] = useState<FullReport | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);

  const reloadActiveReport = useCallback(async () => {
    if (activeReportId === null) {
      setActiveFullReport(null);
      return;
    }

    setIsLoadingActive(true);
    try {
      const res = await getReportById(activeReportId);
      const report = res?.report as FullReport | undefined;
      setActiveFullReport(report ?? null);
    } catch {
      setActiveFullReport(null);
    } finally {
      setIsLoadingActive(false);
    }
  }, [activeReportId]);

  useEffect(() => {
    if (activeReportId === null) {
      setActiveFullReport(null);
      return;
    }

    let cancelled = false;

    async function loadOne(reportId: number) {
      setIsLoadingActive(true);
      try {
        const res = await getReportById(reportId);
        const report = res?.report as FullReport | undefined;
        if (!cancelled) setActiveFullReport(report ?? null);
      } catch {
        if (!cancelled) setActiveFullReport(null);
      } finally {
        if (!cancelled) setIsLoadingActive(false);
      }
    }

    void loadOne(activeReportId);

    return () => {
      cancelled = true;
    };
  }, [activeReportId]);

  return {
    activeFullReport,
    setActiveFullReport,
    isLoadingActive,
    reloadActiveReport,
  };
}
