import React, { useContext } from "react";
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
}

const PostModal: React.FC<PostModalProps> = ({ post, onClose }) => {
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

  return (
    <div
      className="post-modal-overlay"
      role="dialog"
      aria-modal="true"
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
            <button className="modal-close" onClick={onClose} aria-label="Close">
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

          <CommentSection postId={post.id} />
        </div>
      </div>
    </div>
  );
};

export default PostModal;
