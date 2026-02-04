import type { ModerationActionItem } from "@/utils/api/mod.api";

type Styles = Record<string, string>;

type Props = {
  styles: Styles;
  item: ModerationActionItem;
  fmt: (iso?: string | null) => string;
};

export default function ActionHistoryItem({ styles, item, fmt }: Props) {
  const actorLabel = item.actor?.username
    ? `@${item.actor.username}`
    : item.actorId
    ? `#${item.actorId}`
    : "system";

  return (
    <div className={styles.stat}>
      <div className={styles.metaRow}>
        <span className={styles.metaKey}>When</span>
        <span className={styles.metaVal}>{fmt(item.createdAt) || "—"}</span>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaKey}>Actor</span>
        <span className={styles.metaVal}>{actorLabel}</span>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaKey}>Action</span>
        <span className={styles.metaVal}>{item.actionType}</span>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaKey}>Target</span>
        <span className={styles.metaVal}>
          {item.targetType} #{item.targetId}
        </span>
      </div>

      <div className={styles.mutedSmall}>
        {item.reason ? item.reason : <span className={styles.tagMuted}>—</span>}
      </div>
    </div>
  );
}
