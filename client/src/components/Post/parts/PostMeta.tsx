import React from "react";
import moment from "moment";
import likeIcon from "../../../assets/like.png";
import heartIcon from "../../../assets/heart.png";

type Props = {
  createdAt: string;
  isLiked: boolean;
  likes: number;
  onToggle: () => void;
  loading?: boolean;

  rootClassName?: string;
  timeClassName?: string;
  likesClassName?: string;

  showTime?: boolean;
  asButton?: boolean;
};

const PostMeta: React.FC<Props> = ({
  createdAt,
  isLiked,
  likes,
  onToggle,
  loading,
  rootClassName = "modal-meta",
  timeClassName = "modal-time",
  likesClassName = "modal-likes",
  showTime = true,
  asButton = true,
}) => {
  return (
    <div className={rootClassName}>
      {showTime && (
        <span className={timeClassName}>{moment(createdAt).fromNow()}</span>
      )}

      {asButton ? (
        <button
          type="button"
          className={likesClassName}
          onClick={onToggle}
          disabled={loading}
          aria-pressed={isLiked}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
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
          <span>{likes} likes</span>
        </button>
      ) : (
        <div
          className={likesClassName}
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && onToggle()
          }
          aria-pressed={isLiked}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
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
          <span>{likes} likes</span>
        </div>
      )}
    </div>
  );
};

export default PostMeta;
