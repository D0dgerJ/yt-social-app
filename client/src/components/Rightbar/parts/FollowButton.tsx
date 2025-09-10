import React from "react";

type Props = {
  isFollowed: boolean;
  loading?: boolean;
  onClick: () => void;
  className?: string;
};

const FollowButton: React.FC<Props> = ({ isFollowed, loading, onClick, className }) => {
  return (
    <button
      className={className ?? "follow-button"}
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      aria-label={isFollowed ? "Unfollow user" : "Follow user"}
    >
      {loading ? "..." : isFollowed ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
