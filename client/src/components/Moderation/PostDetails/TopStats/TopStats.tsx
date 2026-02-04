type Styles = Record<string, string>;

type Counts = {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
};

type Props = {
  counts: Counts;
  styles: Styles;
};

export default function TopStats({ counts, styles }: Props) {
  return (
    <div className={styles.topStats}>
      <div className={styles.stat}>
        <div className={styles.statLabel}>Pending</div>
        <div className={styles.statValue}>{counts.PENDING}</div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statLabel}>Approved</div>
        <div className={styles.statValue}>{counts.APPROVED}</div>
      </div>

      <div className={styles.stat}>
        <div className={styles.statLabel}>Rejected</div>
        <div className={styles.statValue}>{counts.REJECTED}</div>
      </div>
    </div>
  );
}
