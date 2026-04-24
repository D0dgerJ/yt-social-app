import React, { useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import { AuthContext } from "../../context/AuthContext";
import usePostLikes from "../../hooks/usePostLike";

import CommentSection from "../CommentSection/CommentSection";
import PostGallery from "../Post/parts/PostGallery";
import PostMeta from "../Post/parts/PostMeta";
import PostTags from "../Post/parts/PostTags";

import "./PostModal.scss";

type LikeEntity = number | string | { userId: number | string };

interface PostModalProps {
  post: {
    id: number;
    createdAt: string;
    desc?: string;
    images?: string[];
    tags?: string[];
    likes?: LikeEntity[];
    _count?: { likes?: number; comments?: number };
    user?: { username: string };
  };
  onClose: () => void;
  targetCommentId?: number;
}

const PostModal: React.FC<PostModalProps> = ({
  post,
  onClose,
  targetCommentId,
}) => {
  const { user: currentUser } = useContext(AuthContext);

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

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [onClose]);

  const modalNode = (
    <div
      className="post-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Post details"
      onClick={onClose}
    >
      <div className="post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="post-modal-left">
          <PostGallery
            images={post.images}
            gridClassName="modal-image-grid"
            imgClassName="modal-image"
            emptyClassName="modal-no-image"
            emptyText="No images"
            showEmpty={true}
          />
        </div>

        <div className="post-modal-right">
          <div className="modal-header">
            <span className="modal-username">{post.user?.username}</span>

            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {post.desc && <div className="modal-description">{post.desc}</div>}

          <PostTags tags={post.tags} className="modal-tags" />

          <PostMeta
            createdAt={post.createdAt}
            isLiked={isLiked}
            likes={likeCount}
            onToggle={toggleLike}
            loading={isLiking}
            rootClassName="modal-meta"
            timeClassName="modal-time"
            likesClassName="modal-likes"
            showTime={true}
            asButton={true}
          />

          <div className="modal-comments">
            <CommentSection
              postId={post.id}
              targetCommentId={targetCommentId}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

export default PostModal;