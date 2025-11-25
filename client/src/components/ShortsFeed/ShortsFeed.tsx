import React, { useEffect, useState } from "react";
import Post from "../Post/Post";
import { getFeedPosts } from "../../utils/api/post.api";
import "./ShortsFeed.scss";

type LikeEntity = number | string | { userId: number | string };

interface PostType {
  id: number;
  userId: number;
  createdAt: string;
  desc?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
  likes: LikeEntity[];
  _count?: { likes?: number; comments?: number };
  user?: { username: string; profilePicture?: string };
  [key: string]: any;
}

const toLikeArray = (likes: unknown): LikeEntity[] => {
  return Array.isArray(likes) ? (likes as LikeEntity[]) : [];
};

const ShortsFeed: React.FC = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        setLoading(true);
        setError(null);

        const data: any[] = await getFeedPosts();

        const normalized: PostType[] = data
          .map((p: any) => {
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
          })
          .filter(
            (p: PostType) =>
              Array.isArray(p.videos) && p.videos.length > 0
          );

        setPosts(normalized);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Не удалось загрузить шорты"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchShorts();
  }, []);

  if (loading) {
    return (
      <div className="shorts-feed shorts-feed--loading">
        Загрузка шортов...
      </div>
    );
  }

  if (error) {
    return (
      <div className="shorts-feed shorts-feed--error">
        {error}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="shorts-feed shorts-feed--empty">
        Пока нет шортов с видео. Попробуй загрузить первый короткий
        ролик через обычный пост с видео.
      </div>
    );
  }

  return (
    <div className="shorts-feed">
      {posts.map((post) => (
        <div key={post.id} className="shorts-feed__item">
          <Post post={post} />
        </div>
      ))}
    </div>
  );
};

export default ShortsFeed;
