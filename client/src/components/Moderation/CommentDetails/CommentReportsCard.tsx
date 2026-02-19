import type { ReportStatus } from "@/utils/api/mod.api";
import type { ModerationCommentReportLite } from "@/utils/types/moderation/commentDetails.types";

export function CommentReportsCard(props: {
  styles: any;
  isLoading: boolean;
  reports: ModerationCommentReportLite[];
  activeLite: ModerationCommentReportLite | null;
  activeReportId: number | null;
  setActiveReportId: (id: number) => void;
  reasonLabel: Record<string, string>;
  fmt: (d?: string | null) => string;
  clip: (t: string, max?: number) => string;
}) {
  const { styles, isLoading, reports, activeReportId, setActiveReportId, activeLite, reasonLabel, fmt, clip } = props;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <b>Reports</b>
        <span className={styles.muted}>{isLoading ? "Loading..." : `Total: ${reports.length}`}</span>
      </div>

      <div className={styles.reportsGrid}>
        <div className={styles.reportsList}>
          {reports.map((r) => {
            const isActive = r.id === activeReportId;
            return (
              <button
                key={r.id}
                type="button"
                className={`${styles.reportItem} ${isActive ? styles.reportItemActive : ""}`}
                onClick={() => setActiveReportId(r.id)}
              >
                <div className={styles.reportTop}>
                  <b>{reasonLabel[r.reason] ?? r.reason}</b>
                  <span className={styles.badge}>{r.status}</span>
                </div>

                <div className={styles.muted}>
                  @{r.reporter?.username ?? "unknown"} · {fmt(r.createdAt)}
                </div>

                <div className={styles.reportMsg}>
                  {r.details ? clip(r.details, 120) : <span className={styles.muted}>(no details)</span>}
                </div>
              </button>
            );
          })}

          {!isLoading && reports.length === 0 ? <div className={styles.muted}>No reports</div> : null}
        </div>

        <div className={styles.reportDetails}>
          <div className={styles.subTitle}>Report details</div>

          {activeLite ? (
            <div className={styles.detailsBox}>
              <div className={styles.detailsRow}>
                <span className={styles.k}>Report ID</span>
                <b>#{activeLite.id}</b>
              </div>

              <div className={styles.detailsRow}>
                <span className={styles.k}>Status</span>
                <b>{activeLite.status}</b>
              </div>

              <div className={styles.detailsRow}>
                <span className={styles.k}>Reporter</span>
                <b>@{activeLite.reporter?.username ?? "unknown"}</b>
              </div>

              <div className={styles.detailsRow}>
                <span className={styles.k}>Created</span>
                <b>{fmt(activeLite.createdAt)}</b>
              </div>

              <div className={styles.detailsRowCol}>
                <span className={styles.k}>Details</span>
                <div>{activeLite.details?.trim() ? activeLite.details : <span className={styles.muted}>(no details)</span>}</div>
              </div>
            </div>
          ) : (
            <div className={styles.muted}>Select a report</div>
          )}
        </div>
      </div>
    </div>
  );
}
