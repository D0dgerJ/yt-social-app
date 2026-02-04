type Styles = Record<string, string>;

type Props = {
  styles: Styles;
  post: any;
  location?: string | null;
  tags: string[];
  fmt: (v?: string | null) => string;
};

export default function PostMetaBlock({ styles, post, location, tags, fmt }: Props) {
  return (
    <div className={styles.postMeta}>
      <div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Status:</span>
          <span className={styles.metaVal}>{post.status}</span>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Created:</span>
          <span className={styles.metaVal}>{fmt(post.createdAt)}</span>
        </div>

        {location ? (
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Location:</span>
            <span className={styles.metaVal}>{location}</span>
          </div>
        ) : null}
      </div>

      <div className={styles.metaRight}>
        {tags.length ? (
          <div className={styles.tags}>
            {tags.slice(0, 8).map((t) => (
              <span key={t} className={styles.tag}>
                #{t}
              </span>
            ))}
            {tags.length > 8 ? (
              <span className={styles.tagMuted}>+{tags.length - 8}</span>
            ) : null}
          </div>
        ) : (
          <div className={styles.mutedSmall}>No tags</div>
        )}
      </div>
    </div>
  );
}