import React from "react";
import moment from "moment";
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
}) => {
  const content = (
    <>
      <img
        src={heartIcon}
        alt="Like"
        className={`like-icon ${isLiked ? "liked" : ""}`}
      />
      <span>{likes} likes</span>
    </>
  );

  return (
    <div className={rootClassName}>
      {showTime && (
        <span className={timeClassName}>
          {moment(createdAt).fromNow()}
        </span>
      )}

      <button
        type="button"
        className={likesClassName}
        onClick={onToggle}
        disabled={loading}
        aria-pressed={isLiked}
        aria-label={isLiked ? "Unlike" : "Like"}
      >
        {content}
      </button>
    </div>
  );
};

export default PostMeta;