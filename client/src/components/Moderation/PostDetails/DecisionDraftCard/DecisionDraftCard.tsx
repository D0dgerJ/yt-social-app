type Styles = Record<string, string>;

type DraftDecision = "VIOLATION" | "NO_VIOLATION" | "";

type Props = {
  styles: Styles;

  isPendingActive: boolean;

  decisionError: string;
  decisionHint: string;

  draftDecision: DraftDecision;
  setDraftDecision: (v: DraftDecision) => void;

  draftCategory: string;
  setDraftCategory: (v: string) => void;

  draftNote: string;
  setDraftNote: (v: string) => void;

  noteLen: number;

  isSubmittingDecision: boolean;
  canApprove: boolean;
  canReject: boolean;

  onApprove: () => void;
  onReject: () => void;
};

export default function DecisionDraftCard({
  styles,

  isPendingActive,

  decisionError,
  decisionHint,

  draftDecision,
  setDraftDecision,

  draftCategory,
  setDraftCategory,

  draftNote,
  setDraftNote,

  noteLen,

  isSubmittingDecision,
  canApprove,
  canReject,

  onApprove,
  onReject,
}: Props) {
  return (
    <div className={`${styles.nextCard} ${!isPendingActive ? styles.cardDisabled : ""}`}>
      <div className={styles.nextTitle}>Decision draft</div>

      {decisionError ? <div className={styles.decisionError}>{decisionError}</div> : null}

      <div className={styles.formRow}>
        <div className={styles.label}>Decision *</div>
        <div className={styles.radioRow}>
          <label className={styles.radio}>
            <input
              type="radio"
              name="decision"
              value="VIOLATION"
              checked={draftDecision === "VIOLATION"}
              onChange={() => setDraftDecision("VIOLATION")}
              disabled={!isPendingActive || isSubmittingDecision}
            />
            <span>Policy violation (Approve report)</span>
          </label>

          <label className={styles.radio}>
            <input
              type="radio"
              name="decision"
              value="NO_VIOLATION"
              checked={draftDecision === "NO_VIOLATION"}
              onChange={() => setDraftDecision("NO_VIOLATION")}
              disabled={!isPendingActive || isSubmittingDecision}
            />
            <span>No violation (Reject report)</span>
          </label>
        </div>
      </div>

      {draftDecision === "VIOLATION" ? (
        <div className={styles.formRow}>
          <div className={styles.label}>Category *</div>
          <select
            className={styles.select}
            value={draftCategory}
            onChange={(e) => setDraftCategory(e.target.value)}
            disabled={!isPendingActive || isSubmittingDecision}
          >
            <option value="spam">Spam</option>
            <option value="harassment">Harassment / hate speech</option>
            <option value="violence">Violence / threats</option>
            <option value="nudity">Nudity / sexual content</option>
            <option value="copyright">Copyright violation</option>
            <option value="other">Other policy violation</option>
          </select>
        </div>
      ) : null}

      <div className={styles.formRow}>
        <div className={styles.label}>Moderator note *</div>
        <textarea
          className={styles.textarea}
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          placeholder="Explain your decision (why approve/reject). This will be logged in moderation history."
          disabled={!isPendingActive || isSubmittingDecision}
          rows={5}
        />
        <div className={styles.help}>Min 10 characters. Current: {noteLen}</div>
      </div>

      {decisionHint ? <div className={styles.hint}>{decisionHint}</div> : null}

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={`${styles.approveBtn} ${canApprove ? styles.btnActive : ""}`}
          disabled={!canApprove}
          onClick={onApprove}
          title={
            canApprove
              ? "Approve report"
              : "Fill decision + category + note, and make sure report is PENDING"
          }
        >
          {isSubmittingDecision ? "Working…" : "Approve report"}
        </button>

        <button
          type="button"
          className={`${styles.rejectBtn} ${canReject ? styles.btnDangerActive : ""}`}
          disabled={!canReject}
          onClick={onReject}
          title={
            canReject ? "Reject report" : "Fill decision + note, and make sure report is PENDING"
          }
        >
          {isSubmittingDecision ? "Working…" : "Reject report"}
        </button>
      </div>

      <div className={styles.mutedSmall}>
        Сначала выбери решение и напиши обоснование — только после этого кнопки станут активны.
      </div>
    </div>
  );
}
