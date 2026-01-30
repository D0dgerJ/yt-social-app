import { useMemo, useState } from "react";
import { hardDeletePost, hidePost, softDeletePost, unhidePost } from "@/utils/api/mod.api";

type Props = {
  postId: number;
  postStatus?: string | null;
  hasApprovedReport: boolean;

  onPostStatusChange: (nextStatus: string) => void;
  onAfterAction?: () => Promise<void> | void;
};

const quickReasons = [
  "Spam / scam content",
  "Harassment / hate speech",
  "Violence / threats",
  "Nudity / sexual content",
  "Copyright violation",
  "Other policy violation",
];

function clip(text: string, max = 36) {
  const t = (text ?? "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default function PostModerationActions({
  postId,
  postStatus,
  hasApprovedReport,
  onPostStatusChange,
  onAfterAction,
}: Props) {
  const [reason, setReason] = useState("Moderation action");
  const [busy, setBusy] = useState<null | "hide" | "unhide" | "soft" | "hard">(null);

  const isHidden = useMemo(
    () => ((postStatus ?? "").toUpperCase().includes("HIDDEN")),
    [postStatus]
  );

  const isDeleted = useMemo(
    () => ((postStatus ?? "").toUpperCase().includes("DELETED")),
    [postStatus]
  );

  const safeReason = reason.trim() || "Moderation action";

  const runAfter = async () => {
    if (!onAfterAction) return;
    await onAfterAction();
  };

  const onHide = async () => {
    try {
      setBusy("hide");
      await hidePost(postId, safeReason);
      onPostStatusChange("HIDDEN");
      await runAfter();
    } finally {
      setBusy(null);
    }
  };

  const onUnhide = async () => {
    try {
      setBusy("unhide");
      await unhidePost(postId, safeReason);
      onPostStatusChange("ACTIVE");
      await runAfter();
    } finally {
      setBusy(null);
    }
  };

  const onSoftDelete = async () => {
    if (!reason.trim()) {
      alert("Reason is required");
      return;
    }

    if (!hasApprovedReport) {
      const ok = confirm("No APPROVED reports found. Backend may reject soft-delete. Continue?");
      if (!ok) return;
    }

    const ok = confirm("Soft delete this post?");
    if (!ok) return;

    try {
      setBusy("soft");
      await softDeletePost(postId, reason.trim());
      onPostStatusChange("SOFT_DELETED");
      await runAfter();
    } finally {
      setBusy(null);
    }
  };

  const onHardDelete = async () => {
    if (!reason.trim()) {
      alert("Reason is required");
      return;
    }

    if (!hasApprovedReport) {
      const ok = confirm("No APPROVED reports found. Backend may reject hard-delete. Continue?");
      if (!ok) return;
    }

    const ok = confirm("HARD delete this post permanently?");
    if (!ok) return;

    try {
      setBusy("hard");
      await hardDeletePost(postId, reason.trim());
      onPostStatusChange("HARD_DELETED");
      await runAfter();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mod-post-modal__actions">
      <div className="mod-post-modal__actionsRow">
        <input
          className="mod-post-modal__actionInput"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for post action..."
        />
      </div>

      <div className="mod-post-modal__quickReasons">
        {quickReasons.map((r) => (
          <button
            key={r}
            type="button"
            className="mod-post-modal__quickBtn"
            onClick={() => setReason(r)}
          >
            {clip(r)}
          </button>
        ))}
      </div>

      <div className="mod-post-modal__actionsRow">
        <button onClick={onHide} disabled={Boolean(busy) || isHidden}>
          {busy === "hide" ? "Hiding..." : "Hide"}
        </button>

        <button onClick={onUnhide} disabled={Boolean(busy) || !isHidden}>
          {busy === "unhide" ? "Unhiding..." : "Unhide"}
        </button>

        <button onClick={onSoftDelete} disabled={Boolean(busy) || isDeleted}>
          {busy === "soft" ? "Deleting..." : "Soft delete"}
        </button>

        <button onClick={onHardDelete} disabled={Boolean(busy)}>
          {busy === "hard" ? "Deleting..." : "Hard delete"}
        </button>
      </div>

      <div className="mod-post-modal__note">
        Note: soft/hard delete may require an APPROVED report (backend rule).
      </div>
    </div>
  );
}