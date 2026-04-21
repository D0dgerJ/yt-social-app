import React, { useContext, useEffect, useRef, useState } from "react";
import { MdOutlineMoreVert } from "react-icons/md";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import moment from "moment";

import { getUserById } from "../../utils/api/user.api";
import { deletePost, reportPost } from "../../utils/api/post.api";
import { AuthContext } from "../../context/AuthContext";
import usePostLikes from "../../hooks/usePostLike";
import { toAbsoluteMediaUrl } from "../../utils/mediaUrl";

import PostModal from "../PostModal/PostModal";
import PostGallery from "./parts/PostGallery";
import PostMeta from "./parts/PostMeta";
import PostTags from "./parts/PostTags";
import PostVideos from "./parts/PostVideos";
import PostFiles from "./parts/PostFiles";

import userPic from "./assets/user.png";
import "./Post.scss";

type LikeEntity = number | string | { userId: number | string };

export interface PostProps {
  post: {
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
  };
  onDeleted?: (postId: number) => void;
  autoOpenModal?: boolean;
  targetCommentId?: number;
}

type UserInfo = { id: number; username: string; profilePicture?: string };

const Post: React.FC<PostProps> = ({
  post,
  onDeleted,
  autoOpenModal = false,
  targetCommentId,
}) => {
  const { user: currentUser } = useContext(AuthContext);

  const [author, setAuthor] = useState<UserInfo | null>(
    post.user
      ? {
          id: post.userId,
          username: post.user.username,
          profilePicture: post.user.profilePicture,
        }
      : null
  );

  const [showPostModal, setShowPostModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const didAutoOpenRef = useRef(false);

  const isOwner = currentUser?.id === post.userId;

  useEffect(() => {
    if (author) return;

    (async () => {
      try {
        const res = await getUserById(post.userId);
        setAuthor(res);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [post.userId, author]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!autoOpenModal || didAutoOpenRef.current) return;

    didAutoOpenRef.current = true;

    const timer = window.setTimeout(() => {
      setShowPostModal(true);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [autoOpenModal]);

  const {
    count: likeCount,
    isLiked,
    loading: isLiking,
    toggle: toggleLike,
  } = usePostLikes({
    postId: post.id,
    likes: post.likes,
    initialCount: post._count?.likes,
    currentUserId: currentUser?.id,
  });

  const handleLike = async () => {
    if (!currentUser?.id || isLiking) return;

    try {
      await toggleLike();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to like");
    }
  };

  const commentsCount =
    post._count?.comments ??
    (typeof (post as any).commentsCount === "number"
      ? (post as any).commentsCount
      : typeof (post as any).comment === "number"
        ? (post as any).comment
        : 0);

  const handleReport = async () => {
    if (!currentUser?.id) {
      toast.info("You need to sign in to submit a report.");
      return;
    }

    setIsMenuOpen(false);

    const messageRaw = window.prompt("Describe the issue (optional):");
    const message = typeof messageRaw === "string" ? messageRaw.trim() : "";

    try {
      const res = await reportPost(post.id, {
        reason: "other",
        message: message || undefined,
      });

      if (res?.alreadyReported) {
        toast.info("You have already reported this post.");
        return;
      }

      toast.success("Report submitted.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to submit report");
    }
  };

  const handleDelete = async () => {
    if (!currentUser?.id) {
      toast.info("You need to sign in.");
      return;
    }

    if (!isOwner) {
      toast.error("You cannot delete someone else's post.");
      return;
    }

    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    setIsMenuOpen(false);
    setIsDeleting(true);

    try {
      await deletePost(post.id);
      toast.success("Post deleted.");
      onDeleted?.(post.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="post-container" style={{ breakInside: "avoid" }}>
      <div className="post-top">
        <div className="post-user">
          <img
            src={
              author?.profilePicture
                ? toAbsoluteMediaUrl(author.profilePicture)
                : userPic
            }
            alt="Profile"
            className="post-avatar"
          />

          <div className="post-user-meta">
            <Link
              to={`/profile/${author?.username}`}
              className="post-username-link"
            >
              <span className="post-username">{author?.username}</span>
            </Link>
            <span className="post-time">{moment(post.createdAt).fromNow()}</span>
          </div>
        </div>

        <div className="post-options" ref={menuRef}>
          <button
            type="button"
            className="options-trigger"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Post options"
          >
            <MdOutlineMoreVert className="options-icon" />
          </button>

          {isMenuOpen && (
            <div className="post-options-menu">
              {isOwner ? (
                <button
                  type="button"
                  className="post-options-item danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              ) : (
                <button
                  type="button"
                  className="post-options-item"
                  onClick={handleReport}
                >
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="post-content">
        {post.desc && <p className="post-text">{post.desc}</p>}

        <PostGallery
          images={post.images}
          gridClassName="post-image-grid"
          imgClassName="post-image-thumb"
          showEmpty={false}
        />

        <PostVideos videos={post.videos} />
        <PostFiles files={post.files} />

        {post.location && <div className="post-location">📍 {post.location}</div>}
      </div>

      <PostTags tags={post.tags} className="post-tags" />

      <div className="post-bottom">
        <PostMeta
          createdAt={post.createdAt}
          isLiked={isLiked}
          likes={likeCount}
          onToggle={handleLike}
          loading={isLiking}
          rootClassName="post-bottom-meta"
          timeClassName="post-time"
          likesClassName="like-section"
          showTime={false}
          asButton={false}
        />

        <button
          type="button"
          className="comment-section"
          onClick={() => setShowPostModal(true)}
        >
          <span>{commentsCount} comments</span>
        </button>
      </div>

      {showPostModal && (
        <PostModal
          post={post}
          onClose={() => setShowPostModal(false)}
          targetCommentId={targetCommentId}
        />
      )}
    </article>
  );
};

export default Post;