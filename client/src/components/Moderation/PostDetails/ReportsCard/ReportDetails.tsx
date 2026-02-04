type Styles = Record<string, string>;

type Props = {
  styles: Styles;
  activeLite: any;
  fmt: (v?: string | null) => string;
};

export default function ReportDetails({ styles, activeLite, fmt }: Props) {
  return (
    <div className={styles.reportDetails}>
      <div className={styles.detailsTitle}>Report details</div>

      {!activeLite ? (
        <div className={styles.muted}>Select a report to view details.</div>
      ) : (
        <>
          <div className={styles.detailsRow}>
            <span className={styles.metaKey}>Report ID:</span>
            <span className={styles.mono}>#{activeLite.id}</span>
          </div>

          <div className={styles.detailsRow}>
            <span className={styles.metaKey}>Status:</span>
            <span className={styles.metaVal}>{activeLite.status}</span>
          </div>

          <div className={styles.detailsRow}>
            <span className={styles.metaKey}>Reporter:</span>
            <span className={styles.metaVal}>
              @{activeLite.reporter?.username ?? "unknown"}
            </span>
          </div>

          <div className={styles.detailsRow}>
            <span className={styles.metaKey}>Created:</span>
            <span className={styles.metaVal}>{fmt(activeLite.createdAt)}</span>
          </div>

          {activeLite.reviewedBy ? (
            <div className={styles.detailsRow}>
              <span className={styles.metaKey}>Reviewed by:</span>
              <span className={styles.metaVal}>
                @{activeLite.reviewedBy.username} · {fmt(activeLite.reviewedAt)}
              </span>
            </div>
          ) : null}

          <div className={styles.detailsMsg}>
            {activeLite.message ? activeLite.message : "(no message)"}
          </div>
        </>
      )}
    </div>
  );
}
