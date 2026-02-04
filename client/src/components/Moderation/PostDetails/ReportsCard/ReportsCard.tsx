import ReportsList from "./ReportsList";
import ReportDetails from "./ReportDetails";

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
          <ReportsList
            styles={styles}
            reports={reports}
            activeReportId={activeReportId}
            setActiveReportId={setActiveReportId}
            reasonLabel={reasonLabel}
            fmt={fmt}
            clip={clip}
          />

          <ReportDetails styles={styles} activeLite={activeLite} fmt={fmt} />
        </div>
      )}
    </section>
  );
}