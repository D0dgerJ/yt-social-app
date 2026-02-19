import { useMemo, useState } from "react";
import { hideComment, unhideComment } from "@/utils/api/mod.api";
import type { ModerationCommentView } from "@/utils/types/moderation/commentDetails.types";

export function useCommentActions(params: {
  commentId: number;
  hasApprovedReport: boolean;
  comment: ModerationCommentView | null;
  onAfterAction: () => Promise<void>;
}) {
  const { commentId, hasApprovedReport, comment, onAfterAction } = params;

  const [actionNote, setActionNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const actionNoteLen = actionNote.trim().length;

  const state = comment?.status ?? "—";

  const commentActionsHint = useMemo(() => {
    if (!hasApprovedReport) return "Действия доступны только после APPROVED report.";
    if (actionNoteLen < 10) return "Action note: минимум 10 символов.";
    return null;
  }, [hasApprovedReport, actionNoteLen]);

  const canHide = Boolean(
    hasApprovedReport && comment?.status === "ACTIVE" && actionNoteLen >= 10 && !isSubmittingAction
  );

  const canUnhide = Boolean(
    hasApprovedReport && comment?.status === "HIDDEN" && actionNoteLen >= 10 && !isSubmittingAction
  );

  async function onCommentAction(kind: "HIDE" | "UNHIDE") {
    setActionError(null);
    setIsSubmittingAction(true);
    try {
      const note = actionNote.trim();

      if (kind === "HIDE") await hideComment(commentId, note);
      if (kind === "UNHIDE") await unhideComment(commentId, note);

      setActionNote("");
      await onAfterAction();
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to apply action");
    } finally {
      setIsSubmittingAction(false);
    }
  }

  return {
    state,

    actionError,
    actionNote,
    setActionNote,
    isSubmittingAction,
    actionNoteLen,

    commentActionsHint,
    canHide,
    canUnhide,

    onCommentAction,
  };
}
