import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Masonry from "react-masonry-css";
import Post from "../Post/Post";
import { getExplorePosts } from "../../utils/api/post.api";
import "./ShortsFeed.scss";

type LikeEntity = number | string | { userId: number | string };

interface PostType {
  id: number;
  desc: string;
  createdAt: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
  score?: number | null;
  userId: number;
  user?: {
    username: string;
    profilePicture?: string;
  };
  likes: LikeEntity[];
  _count?: {
    likes: number;
    comments: number;
  };
}

const breakpointColumns = {
  default: 2,
  900: 1,
};

const toLikeArray = (likes: unknown): LikeEntity[] => {
  return Array.isArray(likes) ? (likes as LikeEntity[]) : [];
};

const ShortsFeed: React.FC = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const data: any[] = await getExplorePosts();

        const normalized: PostType[] = data.map((p: any) => {
          const likesArray = toLikeArray(p?.likes);

          const likesCount =
            p?._count?.likes ??
            (Array.isArray(likesArray) ? likesArray.length : 0) ??
            p?.likesCount ??
            0;

          const commentsCount =
            p?._count?.comments ??
            (typeof p?.commentsCount === "number"
              ? p.commentsCount
              : typeof p?.comment === "number"
                ? p.comment
                : 0);

          return {
            ...p,
            likes: likesArray,
            _count: { likes: likesCount, comments: commentsCount },
          };
        });

        setPosts(normalized);
      } catch (err: any) {
        console.error("Failed to load shorts", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            t("shorts.failedToLoad")
        );
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [t]);

  const shortsPosts = useMemo(
    () => posts.filter((post) => Array.isArray(post.videos) && post.videos.length > 0),
    [posts]
  );

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  return (
    <section className="shorts-feed">
      {loading ? (
        <div className="shorts-feed-state">
          <div className="shorts-feed-state__card">{t("shorts.loading")}</div>
        </div>
      ) : error ? (
        <div className="shorts-feed-state">
          <div className="shorts-feed-state__card shorts-feed-state__card--error">
            {error}
          </div>
        </div>
      ) : shortsPosts.length === 0 ? (
        <div className="shorts-feed-state">
          <div className="shorts-feed-state__card">{t("shorts.empty")}</div>
        </div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumns}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
        >
          {shortsPosts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onDeleted={handlePostDeleted}
            />
          ))}
        </Masonry>
      )}
    </section>
  );
};

export default ShortsFeed;