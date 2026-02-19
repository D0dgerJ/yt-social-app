import { useMemo, useState } from "react";
import { approveCommentReport, rejectCommentReport } from "@/utils/api/mod.api";
import type { ModerationCommentReportLite } from "@/utils/types/moderation/commentDetails.types";

type DraftDecision = "VIOLATION" | "NO_VIOLATION" | "";

export function useCommentDecisionDraft(params: {
  activeLite: ModerationCommentReportLite | null;
  onAfterDecision?: () => Promise<void>;
}) {
  const { activeLite, onAfterDecision } = params;

  const [draftDecision, setDraftDecision] = useState<DraftDecision>("");
  const [draftCategory, setDraftCategory] = useState<string>("other");
  const [draftNote, setDraftNote] = useState("");

  const [decisionError, setDecisionError] = useState<string>("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const isPendingActive = activeLite?.status === "PENDING";
  const noteLen = draftNote.trim().length;

  const decisionHint = useMemo((): string => {
    if (!isPendingActive) return "Выбери PENDING репорт, чтобы принять решение.";
    if (!draftDecision) return "Выбери решение.";
    if (noteLen < 10) return "Напиши короткое обоснование (минимум 10 символов).";
    return "";
  }, [isPendingActive, draftDecision, noteLen]);

  const canApprove = Boolean(isPendingActive && draftDecision === "VIOLATION" && noteLen >= 10);
  const canReject = Boolean(isPendingActive && draftDecision === "NO_VIOLATION" && noteLen >= 10);

  function buildDecisionReason() {
    const note = draftNote.trim();
    if (!note) return draftCategory;
    return `${draftCategory}: ${note}`;
  }

  async function onApprove() {
    if (!activeLite) return;

    setDecisionError("");
    setIsSubmittingDecision(true);

    try {
      await approveCommentReport(activeLite.id, { reason: buildDecisionReason() });

      setDraftDecision("");
      setDraftNote("");

      await onAfterDecision?.();
    } catch (e: any) {
      setDecisionError(e?.message ?? "Failed to approve");
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  async function onReject() {
    if (!activeLite) return;

    setDecisionError("");
    setIsSubmittingDecision(true);

    try {
      await rejectCommentReport(activeLite.id, { reason: buildDecisionReason() });

      setDraftDecision("");
      setDraftNote("");

      await onAfterDecision?.();
    } catch (e: any) {
      setDecisionError(e?.message ?? "Failed to reject");
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  return {
    isPendingActive,

    draftDecision,
    setDraftDecision,

    draftCategory,
    setDraftCategory,

    draftNote,
    setDraftNote,

    noteLen,

    decisionHint,
    decisionError,
    isSubmittingDecision,

    canApprove,
    canReject,

    onApprove,
    onReject,
  };
}
