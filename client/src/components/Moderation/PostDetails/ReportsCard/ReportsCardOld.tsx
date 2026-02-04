type Styles = Record<string, string>;

type Props = {
  styles: Styles;
  isLoading: boolean;
  reports: any[];
  activeLite: any;
  activeReportId: number | null;
  setActiveReportId: (id: number) => void;
  reasonLabel: Record<string, string>;
  fmt: (v?: string | null) => string;
  clip: (t: string, max?: number) => string;
};

export default function ReportsCard({
  styles,
  isLoading,
  reports,
  activeLite,
  activeReportId,
  setActiveReportId,
  reasonLabel,
  fmt,
  clip,
}: Props) {
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>Reports</h3>

      {isLoading ? (
        <div className={styles.muted}>Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className={styles.muted}>No reports for this post.</div>
      ) : (
        <div className={styles.reportsWrap}>
          <div className={styles.reportsList}>
            {reports.map((r) => {
              const isActive = r.id === activeReportId;

              return (
                <button
                  key={r.id}
                  type="button"
                  className={isActive ? styles.reportItemActive : styles.reportItem}
                  onClick={() => setActiveReportId(r.id)}
                >
                  <div className={styles.reportTop}>
                    <div className={styles.reportReason}>
                      {reasonLabel[r.reason] ?? r.reason}
                    </div>
                    <div className={styles.reportStatus}>{r.status}</div>
                  </div>

                  <div className={styles.reportBy}>
                    @{r.reporter?.username ?? "unknown"} · {fmt(r.createdAt)}
                  </div>

                  <div className={styles.reportMsg}>
                    {r.message ? clip(r.message, 120) : "(no message)"}
                  </div>
                </button>
              );
            })}
          </div>

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
        </div>
      )}
    </section>
  );
}
