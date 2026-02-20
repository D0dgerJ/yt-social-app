import { useMemo, useState } from "react";
import {
  hideComment,
  unhideComment,
  softDeleteComment,
  restoreDeletedComment,
} from "@/utils/api/mod.api";
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

  const baseAllowed = Boolean(hasApprovedReport && actionNoteLen >= 10 && !isSubmittingAction);

  const canHide = Boolean(baseAllowed && comment?.status === "ACTIVE");
  const canUnhide = Boolean(baseAllowed && comment?.status === "HIDDEN");
  const canDelete = Boolean(baseAllowed && comment?.status !== "DELETED");
  const canRestore = Boolean(baseAllowed && comment?.status === "DELETED");

  async function onCommentAction(kind: "HIDE" | "UNHIDE" | "DELETE" | "RESTORE") {
    setActionError(null);
    setIsSubmittingAction(true);

    try {
      const note = actionNote.trim();

      if (kind === "HIDE") await hideComment(commentId, note);
      if (kind === "UNHIDE") await unhideComment(commentId, note);
      if (kind === "DELETE") await softDeleteComment(commentId, note);
      if (kind === "RESTORE") await restoreDeletedComment(commentId, note);

      setActionNote("");
      await onAfterAction();
    } catch (e: any) {
      // axios обычно кладёт текст в response.data.message
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "Failed to apply action";
      setActionError(msg);
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
    canDelete,
    canRestore,

    onCommentAction,
  };
}