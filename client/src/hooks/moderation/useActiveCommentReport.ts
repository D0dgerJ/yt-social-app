import { useEffect, useState } from "react";
import { getCommentReportById } from "@/utils/api/mod.api";
import type { ModerationCommentReportFull } from "@/utils/types/moderation/commentDetails.types";

export function useActiveCommentReport(activeReportId: number | null) {
  const [activeFullReport, setActiveFullReport] = useState<ModerationCommentReportFull | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);

  async function reloadActiveReport() {
    if (!activeReportId) {
      setActiveFullReport(null);
      return;
    }

    setIsLoadingActive(true);
    try {
      const data = await getCommentReportById(activeReportId);
      setActiveFullReport(data.report as any);
    } finally {
      setIsLoadingActive(false);
    }
  }

  useEffect(() => {
    void reloadActiveReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReportId]);

  return { activeFullReport, isLoadingActive, reloadActiveReport };
}
