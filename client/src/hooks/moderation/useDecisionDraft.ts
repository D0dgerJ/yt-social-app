import { useMemo, useState } from "react";
import { approveReport, rejectReport } from "@/utils/api/mod.api";
import type { DraftDecision, ReportItem } from "@/utils/types/moderation/postDetails.types";

type Params = {
  activeLite: ReportItem | null;
  onAfterDecision: () => Promise<void>; 
};

function getHttpStatus(e: any): number | null {
  const s = e?.response?.status;
  return typeof s === "number" ? s : null;
}

function getMessage(e: any, fallback: string): string {
  const apiMsg =
    typeof e?.response?.data?.message === "string" ? e.response.data.message : null;

  if (apiMsg && apiMsg.trim()) return apiMsg;
  if (typeof e?.message === "string" && e.message.trim()) return e.message;
  return fallback;
}

export function useDecisionDraft({ activeLite, onAfterDecision }: Params) {
  const [draftDecision, setDraftDecision] = useState<DraftDecision>("");
  const [draftCategory, setDraftCategory] = useState<string>("other");
  const [draftNote, setDraftNote] = useState<string>("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string>("");

  const isPendingActive = activeLite?.status === "PENDING";

  const noteTrimmed = draftNote.trim();
  const isNoteValid = noteTrimmed.length >= 10;

  const canApprove =
    isPendingActive &&
    draftDecision === "VIOLATION" &&
    Boolean(draftCategory) &&
    isNoteValid &&
    !isSubmittingDecision;

  const canReject =
    isPendingActive &&
    draftDecision === "NO_VIOLATION" &&
    isNoteValid &&
    !isSubmittingDecision;

  const decisionHint = useMemo(() => {
    if (!isPendingActive) return "This report is already reviewed.";
    if (draftDecision === "VIOLATION" && !draftCategory) return "Select category.";
    if (!isNoteValid) return "Write a short moderator note (min 10 chars).";
    return "";
  }, [draftCategory, draftDecision, isNoteValid, isPendingActive]);

  async function handleApprove() {
    if (!activeLite) return;

    setDecisionError("");
    setIsSubmittingDecision(true);

    try {
      const reason = `Approved: ${draftCategory}`;
      const message = noteTrimmed;

      await approveReport(activeLite.id, { reason, message });

      setDraftDecision("");
      setDraftNote("");
      setDraftCategory("other");

      await onAfterDecision();
    } catch (e: any) {
      const status = getHttpStatus(e);

      if (status === 409) {
        setDecisionError("Этот репорт уже рассмотрен другим модератором.");
        await onAfterDecision(); 
        return;
      }

      setDecisionError(getMessage(e, "Failed to approve report"));
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  async function handleReject() {
    if (!activeLite) return;

    setDecisionError("");
    setIsSubmittingDecision(true);

    try {
      const reason = "Rejected: no violation";
      const message = noteTrimmed;

      await rejectReport(activeLite.id, { reason, message });

      setDraftDecision("");
      setDraftNote("");
      setDraftCategory("other");

      await onAfterDecision();
    } catch (e: any) {
      const status = getHttpStatus(e);

      if (status === 409) {
        setDecisionError("Этот репорт уже рассмотрен другим модератором.");
        await onAfterDecision();
        return;
      }

      setDecisionError(getMessage(e, "Failed to reject report"));
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  return {
    draftDecision,
    setDraftDecision,
    draftCategory,
    setDraftCategory,
    draftNote,
    setDraftNote,
    isSubmittingDecision,
    decisionError,
    setDecisionError,

    isPendingActive,
    noteTrimmed,
    noteLen: noteTrimmed.length,
    canApprove,
    canReject,
    decisionHint,

    onApprove: handleApprove,
    onReject: handleReject,
  };
}
