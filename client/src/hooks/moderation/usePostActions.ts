import { useMemo, useState } from "react";
import { hidePost, unhidePost, softDeletePost, hardDeletePost } from "@/utils/api/mod.api";
import { extractApiError } from "@/utils/moderation/postDetails.utils";
import type { ModerationActionItem } from "@/utils/api/mod.api";
import type { AlreadyHandled } from "@/hooks/moderation/useModerationActions";

type Params = {
  postId: number;
  activeReportId: number | null;

  // permissions / gating
  hasApprovedReport: boolean;
  isAdminPlus: boolean;

  // actions state
  modActions: ModerationActionItem[];
  refreshActions: () => Promise<void>;
  setAlreadyHandled: (v: AlreadyHandled) => void;
  reloadActiveReport: () => Promise<void>;

  // optional UI info
  isLoadingActions: boolean;
};

type Fn = "hide" | "unhide" | "soft" | "hard";

function getHttpStatus(e: any): number | null {
  const s = e?.response?.status;
  return typeof s === "number" ? s : null;
}

function includesApprovedHint(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("requires approved report") || m.includes("approved report");
}

export function usePostActions({
  postId,
  activeReportId,
  hasApprovedReport,
  isAdminPlus,
  modActions,
  refreshActions,
  setAlreadyHandled,
  reloadActiveReport,
}: Params) {
  const [actionNote, setActionNote] = useState<string>("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string>("");

  const actionNoteTrimmed = actionNote.trim();
  const isActionNoteValid = actionNoteTrimmed.length >= 10;

  // Determine current state from moderation actions (best-effort)
  const lastState = useMemo(() => {
    const sorted = [...modActions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const lastDelete = sorted.find((a) => a.actionType === "CONTENT_DELETED");
    if (lastDelete) return "DELETED";

    const lastHide = sorted.find((a) => a.actionType === "CONTENT_HIDDEN");
    const lastUnhide = sorted.find((a) => a.actionType === "CONTENT_UNHIDDEN");

    if (lastHide && (!lastUnhide || new Date(lastHide.createdAt) > new Date(lastUnhide.createdAt))) {
      return "HIDDEN";
    }

    return "ACTIVE";
  }, [modActions]);

  const canUsePostActions = hasApprovedReport && !isSubmittingAction;
  const canHide = canUsePostActions && lastState === "ACTIVE" && isActionNoteValid;
  const canUnhide = canUsePostActions && lastState === "HIDDEN" && isActionNoteValid;
  const canSoftDelete = canUsePostActions && lastState !== "DELETED" && isActionNoteValid && isAdminPlus;
  const canHardDelete = canUsePostActions && lastState !== "DELETED" && isActionNoteValid && isAdminPlus;

  const postActionsHint = !hasApprovedReport
    ? "Post actions доступны только после APPROVED report."
    : !isActionNoteValid
    ? "Action note обязателен (min 10 chars)."
    : !isAdminPlus
    ? "Soft/Hard delete доступны только ADMIN/OWNER."
    : "";

  async function handlePostAction(fn: Fn) {
    setActionError("");
    setIsSubmittingAction(true);

    try {
      if (fn === "hide") await hidePost(postId, actionNoteTrimmed);
      if (fn === "unhide") await unhidePost(postId, actionNoteTrimmed);
      if (fn === "soft") await softDeletePost(postId, actionNoteTrimmed);
      if (fn === "hard") await hardDeletePost(postId, actionNoteTrimmed);

      setActionNote("");
      await refreshActions();

      if (activeReportId !== null) {
        await reloadActiveReport();
      }
    } catch (e: any) {
      const parsed = extractApiError(e);
      const status = getHttpStatus(e);

      if (status === 409 && parsed.details?.already) {
        const a = parsed.details.already;
        setAlreadyHandled({
          actionType: a.actionType ?? "CONFLICT",
          actor: a.actor ?? null,
          at: a.at ?? null,
          reason: a.reason ?? null,
          message: a.message ?? null,
        });
      }

      if (status === 403) {
        if (includesApprovedHint(parsed.message)) {
          setActionError("Нужно сначала одобрить жалобу (APPROVE report), затем можно выполнять действия с постом.");
        } else {
          setActionError(parsed.message || "Forbidden");
        }
      } else {
        setActionError(parsed.message);
      }

      await refreshActions();
      if (activeReportId !== null) {
        await reloadActiveReport();
      }
    } finally {
      setIsSubmittingAction(false);
    }
  }

  return {
    // state
    actionNote,
    setActionNote,
    actionError,
    isSubmittingAction,

    // derived
    actionNoteTrimmed,
    actionNoteLen: actionNoteTrimmed.length,
    isActionNoteValid,

    lastState,

    canHide,
    canUnhide,
    canSoftDelete,
    canHardDelete,

    postActionsHint,

    // actions
    onPostAction: handlePostAction,
  };
}
