import type { NavigateFunction } from "react-router-dom";

type Styles = Record<string, string>;

type Props = {
  postId: number;
  navigate: NavigateFunction;
  styles: Styles;
};

export default function CaseHeader({ postId, navigate, styles }: Props) {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate("/moderation")}
        >
          ← Back to list
        </button>

        <h2 className={styles.title}>
          Case: Post <span className={styles.mono}>#{postId}</span>
        </h2>
      </div>

      <button
        type="button"
        className={styles.historyBtn}
        onClick={() => navigate("/moderation/history")}
      >
        Open history
      </button>
    </div>
  );
}
