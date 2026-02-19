import type { ModerationCommentView } from "@/utils/types/moderation/commentDetails.types";

export function CommentPreviewCard(props: {
  styles: any;
  isLoading: boolean;
  isLoadingActive: boolean;
  comment: ModerationCommentView | null;
  fmt: (d?: string | null) => string;
}) {
  const { styles, isLoading, isLoadingActive, comment, fmt } = props;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <b>Comment preview</b>
        <span className={styles.muted}>Status: {comment?.status ?? "—"}</span>
      </div>

      {isLoading || isLoadingActive ? (
        <div className={styles.muted}>Loading...</div>
      ) : comment ? (
        <>
          <div className={styles.kv}>
            <div>
              <div className={styles.k}>Created</div>
              <div className={styles.v}>{fmt(comment.createdAt)}</div>
            </div>

            <div>
              <div className={styles.k}>Author</div>
              <div className={styles.v}>@{comment.user?.username ?? "unknown"}</div>
            </div>

            <div>
              <div className={styles.k}>Post</div>
              <div className={styles.v}>#{comment.postId}</div>
            </div>
          </div>

          <div className={styles.previewText}>{comment.content?.trim() ? comment.content : "(no text)"}</div>

          {(comment.images?.length ?? 0) > 0 ? (
            <div className={styles.mediaRow}>
              <b>Images:</b> <span className={styles.muted}>{comment.images.length}</span>
            </div>
          ) : null}

          {(comment.videos?.length ?? 0) > 0 ? (
            <div className={styles.mediaRow}>
              <b>Videos:</b> <span className={styles.muted}>{comment.videos.length}</span>
            </div>
          ) : null}

          {(comment.files?.length ?? 0) > 0 ? (
            <div className={styles.mediaRow}>
              <b>Files:</b> <span className={styles.muted}>{comment.files.length}</span>
            </div>
          ) : null}
        </>
      ) : (
        <div className={styles.muted}>No comment data</div>
      )}
    </div>
  );
}
