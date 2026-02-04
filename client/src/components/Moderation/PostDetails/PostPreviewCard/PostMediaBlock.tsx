type Styles = Record<string, string>;

type Props = {
  styles: Styles;
  images: string[];
  videos: string[];
  files: string[];
};

export default function PostMediaBlock({ styles, images, videos, files }: Props) {
  if (!images.length && !videos.length && !files.length) {
    return <div className={styles.mutedSmall}>No media</div>;
  }

  return (
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
  );
}