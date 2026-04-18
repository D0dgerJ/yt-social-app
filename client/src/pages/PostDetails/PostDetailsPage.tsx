import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import Rightbar from "../../components/Rightbar/Rightbar";
import Post from "../../components/Post/Post";
import { getPostById } from "../../utils/api/post.api";
import "./PostDetailsPage.scss";

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
  _count?: {
    likes?: number;
    comments?: number;
  };
  user?: {
    username: string;
    profilePicture?: string;
  };
  [key: string]: any;
}

const toLikeArray = (likes: unknown): LikeEntity[] => {
  return Array.isArray(likes) ? (likes as LikeEntity[]) : [];
};

const PostDetailsPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [searchParams] = useSearchParams();

  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numericPostId = Number(postId);

  const targetCommentId = useMemo(() => {
    const raw = searchParams.get("commentId");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!Number.isFinite(numericPostId) || numericPostId <= 0) {
          setError("Некорректный ID поста.");
          return;
        }

        const data: any = await getPostById(numericPostId);

        const likesArray = toLikeArray(data?.likes);

        const likesCount =
          data?._count?.likes ??
          (Array.isArray(likesArray) ? likesArray.length : 0) ??
          data?.likesCount ??
          0;

        const commentsCount =
          data?._count?.comments ??
          (typeof data?.commentsCount === "number"
            ? data.commentsCount
            : typeof data?.comment === "number"
              ? data.comment
              : 0);

        setPost({
          ...data,
          likes: likesArray,
          _count: {
            likes: likesCount,
            comments: commentsCount,
          },
        });
      } catch (err: any) {
        console.error("Failed to load post", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Не удалось загрузить пост"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPost();
  }, [numericPostId]);

  return (
    <>
      <Navbar />

      <div className="layout">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>

        <main className="post-details-wrapper">
          {loading ? (
            <div className="post-details-state">
              <div className="post-details-state__card">Загрузка поста...</div>
            </div>
          ) : error ? (
            <div className="post-details-state">
              <div className="post-details-state__card post-details-state__card--error">
                {error}
              </div>
            </div>
          ) : post ? (
            <Post
              post={post}
              autoOpenModal
              targetCommentId={targetCommentId ?? undefined}
            />
          ) : (
            <div className="post-details-state">
              <div className="post-details-state__card">Пост не найден.</div>
            </div>
          )}
        </main>

        <div className="rightbar-wrapper">
          <Rightbar />
        </div>
      </div>
    </>
  );
};

export default PostDetailsPage;