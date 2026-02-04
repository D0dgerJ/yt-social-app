type Styles = Record<string, string>;

type Props = {
  styles: Styles;
  reports: any[];
  activeReportId: number | null;
  setActiveReportId: (id: number) => void;
  reasonLabel: Record<string, string>;
  fmt: (v?: string | null) => string;
  clip: (t: string, max?: number) => string;
};

export default function ReportsList({
  styles,
  reports,
  activeReportId,
  setActiveReportId,
  reasonLabel,
  fmt,
  clip,
}: Props) {
  return (
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
  );
}
