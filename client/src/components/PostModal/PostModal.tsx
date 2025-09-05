import React, { useState, useContext, useEffect } from "react";
import CommentSection from "../CommentSection/CommentSection";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import likeIcon from "../../assets/like.png";
import heartIcon from "../../assets/heart.png";
import moment from "moment";
import { AuthContext } from "../../context/AuthContext";
import { toggleLike } from "../../utils/api/post.api";
import "./PostModal.scss";

type LikeEntity = number | string | { userId: number | string };

interface PostModalProps {
  post: {
    id: number;
    createdAt: string;
    user?: { username: string };
    images?: string[];
    tags?: string[];
    desc?: string;
    likes?: LikeEntity[];
    _count?: { likes: number; comments: number };
  };
  onClose: () => void;
  onToggleLike?: (liked: boolean) => void;
}

const PostModal: React.FC<PostModalProps> = ({ post, onClose, onToggleLike }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(
    post._count?.likes ?? (Array.isArray(post.likes) ? post.likes.length : 0)
  );
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const uid = Number(currentUser?.id);
    if (!uid || !Array.isArray(post.likes)) return;

    const likedBy = post.likes.map((v: LikeEntity) =>
      typeof v === "object" && v !== null && "userId" in v
        ? Number(v.userId)
        : Number(v as number | string)
    );

    setIsLiked(likedBy.includes(uid));
  }, [currentUser?.id, post.likes]);

  useEffect(() => {
    setLikeCount(
      post._count?.likes ?? (Array.isArray(post.likes) ? post.likes.length : 0)
    );
  }, [post._count?.likes, post.likes, post.id]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await toggleLike(post.id);
      setIsLiked(res.liked);
      setLikeCount((prev) => (res.liked ? prev + 1 : Math.max(prev - 1, 0)));
      onToggleLike?.(res.liked);
    } catch (err) {
      console.error("Like failed", err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className="post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="post-modal-left">
          {post.images?.length ? (
            <div className="modal-image-grid">
              {post.images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Post image ${i}`}
                  className="modal-image"
                  onClick={() => openLightbox(i)}
                />
              ))}
            </div>
          ) : (
            <div className="modal-no-image">No images</div>
          )}

          {isLightboxOpen && (
            <Lightbox
              open={isLightboxOpen}
              close={() => setIsLightboxOpen(false)}
              slides={(post.images ?? []).map((url) => ({ src: url }))}
              index={lightboxIndex}
              on={{ view: ({ index }) => setLightboxIndex(index) }}
              plugins={[Thumbnails]}
            />
          )}
        </div>

        <div className="post-modal-right">
          <div className="modal-header">
            <span className="modal-username">{post.user?.username}</span>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          {post.desc && <div className="modal-description">{post.desc}</div>}

          {post.tags?.length ? (
            <div className="modal-tags">
              {post.tags.map((tag, i) => (
                <span key={i} className="modal-tag">#{tag}</span>
              ))}
            </div>
          ) : null}

          <div className="modal-meta">
            <span className="modal-time">{moment(post.createdAt).fromNow()}</span>
            <div className="modal-likes" onClick={handleLike}>
              <img
                src={likeIcon}
                alt="Like"
                className={`like-icon ${isLiked ? "liked" : ""}`}
              />
              <img
                src={heartIcon}
                alt="Heart"
                className={`like-icon ${isLiked ? "liked" : ""}`}
              />
              <span>{likeCount} likes</span>
            </div>
          </div>

          <CommentSection postId={post.id} />
        </div>
      </div>
    </div>
  );
};

export default PostModal;
