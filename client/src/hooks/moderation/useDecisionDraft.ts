import { useMemo, useState } from "react";
import { approveReport, rejectReport } from "@/utils/api/mod.api";
import type { DraftDecision, ReportItem } from "@/utils/types/moderation/postDetails.types";

type Params = {
  activeLite: ReportItem | null;
  onAfterDecision: () => Promise<void>; // refreshCase + refreshActions снаружи (чтобы не менять логику)
};

export function useDecisionDraft({ activeLite, onAfterDecision }: Params) {
  // --- Decision draft (Block 4) ---
  const [draftDecision, setDraftDecision] = useState<DraftDecision>("");
  const [draftCategory, setDraftCategory] = useState<string>("other");
  const [draftNote, setDraftNote] = useState<string>("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string>("");

  // --- Decision gating ---
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
      setDecisionError(e?.message || "Failed to approve report");
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
      setDecisionError(e?.message || "Failed to reject report");
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  return {
    // state
    draftDecision,
    setDraftDecision,
    draftCategory,
    setDraftCategory,
    draftNote,
    setDraftNote,
    isSubmittingDecision,
    decisionError,
    setDecisionError,

    // derived
    isPendingActive,
    noteTrimmed,
    noteLen: noteTrimmed.length,
    canApprove,
    canReject,
    decisionHint,

    // actions
    onApprove: handleApprove,
    onReject: handleReject,
  };
}
