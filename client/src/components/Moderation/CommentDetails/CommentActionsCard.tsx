export function CommentActionsCard(props: {
  styles: any;
  hasApprovedReport: boolean;

  state: string;

  actionError: string | null;
  actionNote: string;
  setActionNote: (v: string) => void;

  isSubmittingAction: boolean;
  actionNoteLen: number;

  commentActionsHint: string | null;

  canHide: boolean;
  canUnhide: boolean;
  canDelete: boolean;
  canRestore: boolean;

  onCommentAction: (kind: "HIDE" | "UNHIDE" | "DELETE" | "RESTORE") => void;
  onRefreshActions: () => void;
}) {
  const {
    styles,
    hasApprovedReport,
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
    onRefreshActions,
  } = props;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <b>Comment actions</b>
        <span className={styles.muted}>State: {state}</span>
      </div>

      <div className={styles.block}>
        <div className={styles.k}>Action note *</div>
        <textarea
          className={styles.textarea}
          value={actionNote}
          onChange={(e) => setActionNote(e.target.value)}
          placeholder="Explain why you apply this action. Required."
        />
        <div className={styles.hint}>Min 10 characters. Current: {actionNoteLen}</div>

        {!hasApprovedReport ? (
          <div className={styles.hintMuted}>Actions available only after APPROVED report.</div>
        ) : null}

        {commentActionsHint ? <div className={styles.hintMuted}>{commentActionsHint}</div> : null}
        {actionError ? <div className={styles.error}>{actionError}</div> : null}
      </div>

      <div className={styles.actionsRow}>
        <button
          className={styles.btn}
          type="button"
          disabled={!canHide}
          onClick={() => onCommentAction("HIDE")}
        >
          Hide
        </button>

        <button
          className={styles.btn}
          type="button"
          disabled={!canUnhide}
          onClick={() => onCommentAction("UNHIDE")}
        >
          Unhide
        </button>

        <button
          className={styles.btn}
          type="button"
          disabled={!canDelete}
          onClick={() => onCommentAction("DELETE")}
        >
          Delete
        </button>

        <button
          className={styles.btn}
          type="button"
          disabled={!canRestore}
          onClick={() => onCommentAction("RESTORE")}
        >
          Restore
        </button>
      </div>

      <button
        className={styles.btnWide}
        type="button"
        disabled={isSubmittingAction}
        onClick={onRefreshActions}
      >
        Refresh actions
      </button>
    </div>
  );
}