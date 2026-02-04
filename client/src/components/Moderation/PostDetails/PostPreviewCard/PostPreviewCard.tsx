import PostMetaBlock from "./PostMetaBlock";
import PostMediaBlock from "./PostMediaBlock";

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
          <PostMetaBlock styles={styles} post={post} location={location} tags={tags} fmt={fmt} />

          {post.desc ? (
            <div className={styles.postText}>{post.desc}</div>
          ) : (
            <div className={styles.muted}>(no text)</div>
          )}

          <PostMediaBlock styles={styles} images={images} videos={videos} files={files} />
        </>
      )}
    </section>
  );
}