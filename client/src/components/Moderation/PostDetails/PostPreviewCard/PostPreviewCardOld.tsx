type Styles = Record<string, string>;

type Props = {
  styles: Styles;
  isLoading: boolean;
  isLoadingActive: boolean;
  post: any;
  location?: string | null;
  tags: string[];
  images: string[];
  videos: string[];
  files: string[];
  fmt: (v?: string | null) => string;
};

export default function PostPreviewCard({
  styles,
  isLoading,
  isLoadingActive,
  post,
  location,
  tags,
  images,
  videos,
  files,
  fmt,
}: Props) {
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>Post preview</h3>

      {isLoading || isLoadingActive ? (
        <div className={styles.muted}>Loading…</div>
      ) : !post ? (
        <div className={styles.muted}>No post data yet (select a report).</div>
      ) : (
        <>
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

          {post.desc ? (
            <div className={styles.postText}>{post.desc}</div>
          ) : (
            <div className={styles.muted}>(no text)</div>
          )}

          {images.length || videos.length || files.length ? (
            <div className={styles.mediaBlock}>
              {images.length ? (
                <div className={styles.mediaRow}>
                  <div className={styles.mediaTitle}>Images</div>
                  <div className={styles.mediaGrid}>
                    {images.slice(0, 6).map((src, idx) => (
                      <img
                        key={`${src}-${idx}`}
                        src={src}
                        alt="post img"
                        className={styles.mediaImg}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {videos.length ? (
                <div className={styles.mediaRow}>
                  <div className={styles.mediaTitle}>Videos</div>
                  <div className={styles.mediaList}>
                    {videos.slice(0, 5).map((v, idx) => (
                      <div key={`${v}-${idx}`} className={styles.mediaItem}>
                        🎬 {v}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {files.length ? (
                <div className={styles.mediaRow}>
                  <div className={styles.mediaTitle}>Files</div>
                  <div className={styles.mediaList}>
                    {files.slice(0, 8).map((f, idx) => (
                      <div key={`${f}-${idx}`} className={styles.mediaItem}>
                        📎 {f}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.mutedSmall}>No media</div>
          )}
        </>
      )}
    </section>
  );
}
