    type Styles = Record<string, string>;

type AlreadyHandled = {
  actionType: string;
  actor?: { id?: number; username?: string } | null;
  at?: string | null;
  reason?: string | null;
  message?: string | null;
};

type Props = {
  data: AlreadyHandled | null;
  styles: Styles;
  fmt: (iso?: string | null) => string;
};

export default function AlreadyHandledBanner({ data, styles, fmt }: Props) {
  if (!data) return null;

  return (
    <div className={styles.handledBanner}>
      <div className={styles.handledTitle}>Already handled</div>

      <div className={styles.handledRow}>
        <span className={styles.metaKey}>Action:</span>
        <span className={styles.metaVal}>{data.actionType}</span>
      </div>

      <div className={styles.handledRow}>
        <span className={styles.metaKey}>By:</span>
        <span className={styles.metaVal}>
          @{data.actor?.username ?? "unknown"}{" "}
          {data.actor?.id ? (
            <span className={styles.mutedSmall}>(#{data.actor.id})</span>
          ) : null}
        </span>
      </div>

      <div className={styles.handledRow}>
        <span className={styles.metaKey}>When:</span>
        <span className={styles.metaVal}>{fmt(data.at)}</span>
      </div>

      {data.reason ? (
        <div className={styles.handledRow}>
          <span className={styles.metaKey}>Reason:</span>
          <span className={styles.metaVal}>{data.reason}</span>
        </div>
      ) : null}

      {data.message ? <div className={styles.handledMsg}>{data.message}</div> : null}
    </div>
  );
}
