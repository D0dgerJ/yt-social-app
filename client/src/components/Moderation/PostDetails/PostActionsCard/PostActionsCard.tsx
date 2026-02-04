type Styles = Record<string, string>;

type PostActionFn = "hide" | "unhide" | "soft" | "hard";

type Props = {
  styles: Styles;

  hasApprovedReport: boolean;
  lastState: string;
  isLoadingActions: boolean;

  actionError: string;
  actionNote: string;
  setActionNote: (v: string) => void;
  isSubmittingAction: boolean;
  actionNoteLen: number;

  postActionsHint: string;

  canHide: boolean;
  canUnhide: boolean;
  canSoftDelete: boolean;
  canHardDelete: boolean;

  isAdminPlus: boolean;

  onPostAction: (fn: PostActionFn) => void;
  onRefreshActions: () => void;
};

export default function PostActionsCard({
  styles,

  hasApprovedReport,
  lastState,
  isLoadingActions,

  actionError,
  actionNote,
  setActionNote,
  isSubmittingAction,
  actionNoteLen,

  postActionsHint,

  canHide,
  canUnhide,
  canSoftDelete,
  canHardDelete,

  isAdminPlus,

  onPostAction,
  onRefreshActions,
}: Props) {
  return (
    <div className={`${styles.nextCard} ${!hasApprovedReport ? styles.cardDisabled : ""}`}>
      <div className={styles.nextTitle}>Post actions</div>

      <div className={styles.mutedSmall}>
        State: <b>{lastState}</b>{" "}
        {isLoadingActions ? <span className={styles.mutedSmall}>(loading actions…)</span> : null}
      </div>

      {actionError ? <div className={styles.actionError}>{actionError}</div> : null}

      <div className={styles.formRow}>
        <div className={styles.label}>Action note *</div>
        <textarea
          className={styles.textarea}
          value={actionNote}
          onChange={(e) => setActionNote(e.target.value)}
          placeholder="Explain why you apply this post action. Required."
          disabled={!hasApprovedReport || isSubmittingAction}
          rows={4}
        />
        <div className={styles.help}>Min 10 characters. Current: {actionNoteLen}</div>
      </div>

      {postActionsHint ? <div className={styles.hint}>{postActionsHint}</div> : null}

      <div className={styles.postActionsRow}>
        <button
          type="button"
          className={`${styles.postBtn} ${canHide ? styles.btnActive : ""}`}
          disabled={!canHide}
          onClick={() => onPostAction("hide")}
          title="Hide post (temporary)"
        >
          {isSubmittingAction ? "Working…" : "Hide (temporary)"}
        </button>

        <button
          type="button"
          className={`${styles.postBtn} ${canUnhide ? styles.btnActive : ""}`}
          disabled={!canUnhide}
          onClick={() => onPostAction("unhide")}
          title="Unhide post (restore visibility)"
        >
          {isSubmittingAction ? "Working…" : "Unhide"}
        </button>
      </div>

      <div className={styles.postActionsRow}>
        <button
          type="button"
          className={`${styles.postBtnDanger} ${canSoftDelete ? styles.btnDangerActive : ""}`}
          disabled={!canSoftDelete}
          onClick={() => onPostAction("soft")}
          title="Soft delete (recoverable)"
        >
          {isSubmittingAction ? "Working…" : "Soft delete"}
        </button>

        <button
          type="button"
          className={`${styles.postBtnDanger} ${canHardDelete ? styles.btnDangerActive : ""}`}
          disabled={!canHardDelete}
          onClick={() => onPostAction("hard")}
          title="Hard delete (permanent)"
        >
          {isSubmittingAction ? "Working…" : "Hard delete"}
        </button>
      </div>

      {!isAdminPlus ? (
        <div className={styles.mutedSmall}>Soft/Hard delete требуют роль ADMIN/OWNER.</div>
      ) : null}

      <button type="button" className={styles.refreshBtn} onClick={onRefreshActions}>
        Refresh actions
      </button>
    </div>
  );
}
