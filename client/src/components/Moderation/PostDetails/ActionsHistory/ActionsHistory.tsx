import type { ModerationActionItem } from "@/utils/api/mod.api";
import ActionHistoryItem from "./ActionHistoryItem";

type Styles = Record<string, string>;

type Props = {
  styles: Styles;
  items: ModerationActionItem[];
  isLoading: boolean;
  fmt: (iso?: string | null) => string;
};

export default function ActionsHistory({ styles, items, isLoading, fmt }: Props) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        Actions history{" "}
        {isLoading ? <span className={styles.mutedSmall}>(loading…)</span> : null}
      </div>

      {sorted.length === 0 && !isLoading ? (
        <div className={styles.muted}>No actions</div>
      ) : null}

      <div className={styles.topStats}>
        {sorted.map((a) => (
          <ActionHistoryItem key={a.id} styles={styles} item={a} fmt={fmt} />
        ))}
      </div>
    </div>
  );
}
